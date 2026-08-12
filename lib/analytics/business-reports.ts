import "server-only";

import {
  canViewBusinessAnalytics,
  parseDateRange,
  toCsv,
  type AnalyticsActor,
  type DateRange,
} from "@/lib/analytics/rules";
import { createSupabaseAdminClient } from "@/lib/database";
import { formatMoney } from "@/lib/commerce/rules";

export type BusinessAnalyticsSummary = {
  businessId: string;
  range: DateRange;
  profileViews: number;
  websiteClicks: number;
  phoneClicks: number;
  directionClicks: number;
  nominationPageVisits: number;
  votingPageVisits: number;
  assetDownloads: number;
  series: Array<{
    date: string;
    profileViews: number;
    websiteClicks: number;
    phoneClicks: number;
    directionClicks: number;
    nominationPageVisits: number;
    votingPageVisits: number;
    assetDownloads: number;
  }>;
  orders: Array<{
    orderId: string;
    orderNumber: string;
    totalCents: number;
    currencyCode: "CAD" | "USD";
    placedAt: string | null;
    paymentStatus: string;
  }>;
};

export async function getBusinessAnalytics(input: {
  actor: AnalyticsActor;
  businessId: string;
  from?: string | null;
  to?: string | null;
}): Promise<BusinessAnalyticsSummary | null> {
  if (!canViewBusinessAnalytics({ actor: input.actor, businessId: input.businessId })) {
    return null;
  }

  const range = parseDateRange({ from: input.from, to: input.to });
  const admin = createSupabaseAdminClient();
  const { data: rows } = await admin
    .from("business_profile_daily_metrics")
    .select("*")
    .eq("business_id", input.businessId)
    .gte("date", range.from)
    .lte("date", range.to)
    .order("date", { ascending: true });

  const seriesMap = new Map<
    string,
    {
      date: string;
      profileViews: number;
      websiteClicks: number;
      phoneClicks: number;
      directionClicks: number;
      nominationPageVisits: number;
      votingPageVisits: number;
      assetDownloads: number;
    }
  >();

  for (const row of rows ?? []) {
    const existing = seriesMap.get(row.date) ?? {
      date: row.date,
      profileViews: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      directionClicks: 0,
      nominationPageVisits: 0,
      votingPageVisits: 0,
      assetDownloads: 0,
    };
    existing.profileViews += row.profile_views;
    existing.websiteClicks += row.website_clicks;
    existing.phoneClicks += row.phone_clicks;
    existing.directionClicks += row.direction_clicks;
    existing.nominationPageVisits += row.nomination_link_clicks;
    existing.votingPageVisits += row.voting_link_clicks;
    existing.assetDownloads += row.asset_downloads;
    seriesMap.set(row.date, existing);
  }

  const series = [...seriesMap.values()];
  const totals = series.reduce(
    (acc, day) => {
      acc.profileViews += day.profileViews;
      acc.websiteClicks += day.websiteClicks;
      acc.phoneClicks += day.phoneClicks;
      acc.directionClicks += day.directionClicks;
      acc.nominationPageVisits += day.nominationPageVisits;
      acc.votingPageVisits += day.votingPageVisits;
      acc.assetDownloads += day.assetDownloads;
      return acc;
    },
    {
      profileViews: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      directionClicks: 0,
      nominationPageVisits: 0,
      votingPageVisits: 0,
      assetDownloads: 0,
    },
  );

  const { data: orderRows } = await admin
    .from("orders")
    .select("id, order_number, total_cents, currency_code, placed_at, payment_status, user_id")
    .eq("payment_status", "paid")
    .gte("placed_at", `${range.from}T00:00:00.000Z`)
    .lte("placed_at", `${range.to}T23:59:59.999Z`)
    .order("placed_at", { ascending: false })
    .limit(100);

  // Award-order history for this business: match via eligibility / personalization snapshots when present.
  const orders = (orderRows ?? [])
    .filter((order) => {
      // Prefer explicit business linkage in item personalization when available later.
      // Until then, only show orders owned by members of this business (buyer history for owners).
      if (input.actor.kind === "business_member") {
        return order.user_id != null && input.actor.userId === order.user_id;
      }
      return true;
    })
    .map((order) => ({
      orderId: order.id,
      orderNumber: order.order_number,
      totalCents: order.total_cents,
      currencyCode: order.currency_code as "CAD" | "USD",
      placedAt: order.placed_at,
      paymentStatus: order.payment_status,
    }));

  // For business members, load orders that include their eligibility-bound items.
  const { data: eligibilityOrders } = await admin
    .from("order_items")
    .select(
      "order_id, award_eligibility_id, orders(id, order_number, total_cents, currency_code, placed_at, payment_status)",
    )
    .not("award_eligibility_id", "is", null)
    .limit(200);

  const eligibilityBusiness = await admin
    .from("award_eligibilities")
    .select("id")
    .eq("business_id", input.businessId);
  const eligibilityIds = new Set((eligibilityBusiness.data ?? []).map((row) => row.id));

  const awardOrders = (eligibilityOrders ?? [])
    .filter((item) => item.award_eligibility_id && eligibilityIds.has(item.award_eligibility_id))
    .map((item) => {
      const order = item.orders as unknown as {
        id: string;
        order_number: string;
        total_cents: number;
        currency_code: "CAD" | "USD";
        placed_at: string | null;
        payment_status: string;
      } | null;
      if (!order || order.payment_status !== "paid") return null;
      if (order.placed_at) {
        const day = order.placed_at.slice(0, 10);
        if (day < range.from || day > range.to) return null;
      }
      return {
        orderId: order.id,
        orderNumber: order.order_number,
        totalCents: order.total_cents,
        currencyCode: order.currency_code,
        placedAt: order.placed_at,
        paymentStatus: order.payment_status,
      };
    })
    .filter(Boolean) as BusinessAnalyticsSummary["orders"];

  const mergedOrders = [...awardOrders];
  const seen = new Set(mergedOrders.map((o) => o.orderId));
  for (const order of orders) {
    if (!seen.has(order.orderId)) mergedOrders.push(order);
  }

  return {
    businessId: input.businessId,
    range,
    ...totals,
    series,
    orders: mergedOrders.slice(0, 50),
  };
}

export function businessAnalyticsToCsv(summary: BusinessAnalyticsSummary): string {
  return toCsv(
    summary.series.map((day) => ({
      date: day.date,
      profile_views: day.profileViews,
      website_clicks: day.websiteClicks,
      phone_clicks: day.phoneClicks,
      direction_clicks: day.directionClicks,
      nomination_page_visits: day.nominationPageVisits,
      voting_page_visits: day.votingPageVisits,
      asset_downloads: day.assetDownloads,
    })),
  );
}

export function formatBusinessMetricMoney(
  cents: number,
  currency: "CAD" | "USD" = "CAD",
): string {
  return formatMoney(cents, currency);
}
