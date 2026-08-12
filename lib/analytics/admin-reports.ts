import "server-only";

import {
  averageOrderValueCents,
  canCompareCommunities,
  canViewCommunityAnalytics,
  contributionMarginCents,
  emailConversionRate,
  parseDateRange,
  productConversionRate,
  shippingMarginCents,
  toCsv,
  type AnalyticsActor,
  type DateRange,
} from "@/lib/analytics/rules";
import { createSupabaseAdminClient } from "@/lib/database";

export type AdminAnalyticsDashboard = {
  range: DateRange;
  communityId: string | null;
  kpis: {
    activeCommunities: number;
    campaignsByStage: Record<string, number>;
    businessesListed: number;
    claimedBusinesses: number;
    registeredUsers: number;
    nominators: number;
    voters: number;
    votes: number;
    winnerBusinesses: number;
    buyers: number;
    productConversionRate: number;
    averageOrderValueCents: number;
    revenueCents: number;
    manufacturingCostCents: number;
    shippingCollectedCents: number;
    supplierShippingCostCents: number;
    shippingMarginCents: number;
    stripeFeesCents: number;
    refundsCents: number;
    grossContributionCents: number;
    campaignsCompleted: number;
    emailDelivered: number;
    emailClicked: number;
    emailConversionRate: number;
  };
  contributionByCommunity: Array<{
    communityId: string;
    communityName: string;
    revenueCents: number;
    contributionCents: number;
    orders: number;
  }>;
  contributionByProduct: Array<{
    productId: string;
    productName: string;
    revenueCents: number;
    units: number;
  }>;
  supplierPerformance: Array<{
    supplierId: string;
    supplierName: string;
    fulfillments: number;
    manufacturingCostCents: number;
    supplierShippingCostCents: number;
  }>;
  funnel: Array<{ step: string; count: number }>;
};

export async function getAdminAnalyticsDashboard(input: {
  actor: AnalyticsActor;
  from?: string | null;
  to?: string | null;
  communityId?: string | null;
}): Promise<AdminAnalyticsDashboard | null> {
  if (!canViewCommunityAnalytics({ actor: input.actor })) {
    return null;
  }
  if (input.communityId && !canCompareCommunities({ actor: input.actor })) {
    return null;
  }

  const range = parseDateRange({ from: input.from, to: input.to });
  const fromIso = `${range.from}T00:00:00.000Z`;
  const toIso = `${range.to}T23:59:59.999Z`;
  const admin = createSupabaseAdminClient();
  const communityFilter = input.communityId ?? null;

  const { count: activeCommunities } = await admin
    .from("communities")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true)
    .neq("market_status", "archived");

  const { data: campaigns } = await admin
    .from("campaigns")
    .select("id, status, community_id")
    .limit(5000);
  const campaignsByStage: Record<string, number> = {};
  let campaignsCompleted = 0;
  for (const campaign of campaigns ?? []) {
    if (communityFilter && campaign.community_id !== communityFilter) continue;
    campaignsByStage[campaign.status] = (campaignsByStage[campaign.status] ?? 0) + 1;
    if (campaign.status === "results_published" || campaign.status === "archived") {
      campaignsCompleted += 1;
    }
  }

  let businessesQuery = admin
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .neq("status", "rejected")
    .is("deleted_at", null);
  // Community scoping for businesses goes through locations when needed.
  if (communityFilter) {
    const { data: locationBiz } = await admin
      .from("business_locations")
      .select("business_id")
      .eq("community_id", communityFilter)
      .limit(10000);
    const ids = [...new Set((locationBiz ?? []).map((row) => row.business_id))];
    businessesQuery = admin
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .neq("status", "rejected")
      .is("deleted_at", null)
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }
  const { count: businessesListed } = await businessesQuery;

  const { data: claimedMemberships } = await admin
    .from("business_memberships")
    .select("business_id, businesses!inner(id, status)")
    .eq("status", "active")
    .in("role", ["owner", "administrator"])
    .limit(10000);
  const claimedSet = new Set<string>();
  for (const row of claimedMemberships ?? []) {
    claimedSet.add(row.business_id);
  }
  if (communityFilter) {
    const { data: locationBiz } = await admin
      .from("business_locations")
      .select("business_id")
      .eq("community_id", communityFilter);
    const allowed = new Set((locationBiz ?? []).map((row) => row.business_id));
    for (const id of [...claimedSet]) {
      if (!allowed.has(id)) claimedSet.delete(id);
    }
  }

  const { count: registeredUsers } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  const nominationsQuery = admin
    .from("nominations")
    .select("id, user_id, status, campaign_id, campaigns!inner(community_id)")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .neq("status", "invalidated")
    .limit(20000);
  const { data: nominationsRaw } = await nominationsQuery;
  const nominations = (nominationsRaw ?? []).filter((row) => {
    const campaign = row.campaigns as unknown as { community_id: string } | null;
    return !communityFilter || campaign?.community_id === communityFilter;
  });
  const nominators = new Set(nominations.map((row) => row.user_id).filter(Boolean));

  const votesQuery = admin
    .from("votes")
    .select("id, user_id, status, campaign_id, campaigns!inner(community_id)")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .eq("status", "active")
    .limit(20000);
  const { data: votesRaw } = await votesQuery;
  const votes = (votesRaw ?? []).filter((row) => {
    const campaign = row.campaigns as unknown as { community_id: string } | null;
    return !communityFilter || campaign?.community_id === communityFilter;
  });
  const voters = new Set(votes.map((row) => row.user_id).filter(Boolean));

  const winnersQuery = admin
    .from("award_eligibilities")
    .select("id, business_id, campaign_id, eligibility_status, created_at, campaigns!inner(community_id)")
    .eq("eligibility_status", "active")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .limit(20000);
  const { data: winnersRaw } = await winnersQuery;
  const winners = (winnersRaw ?? []).filter((row) => {
    const campaign = row.campaigns as unknown as { community_id: string } | null;
    return !communityFilter || campaign?.community_id === communityFilter;
  });
  const winnerBusinesses = new Set(winners.map((row) => row.business_id));

  const ordersQuery = admin
    .from("orders")
    .select(
      "id, user_id, business_id, subtotal_cents, shipping_cents, total_cents, payment_status, placed_at, currency_code",
    )
    .eq("payment_status", "paid")
    .gte("placed_at", fromIso)
    .lte("placed_at", toIso)
    .limit(20000);
  const { data: ordersRaw } = await ordersQuery;

  const businessIds = [
    ...new Set((ordersRaw ?? []).map((row) => row.business_id).filter(Boolean)),
  ] as string[];
  const businessCommunity = new Map<string, string>();
  if (businessIds.length) {
    const { data: locations } = await admin
      .from("business_locations")
      .select("business_id, community_id")
      .in("business_id", businessIds);
    for (const location of locations ?? []) {
      if (!businessCommunity.has(location.business_id)) {
        businessCommunity.set(location.business_id, location.community_id);
      }
    }
  }

  const orders = (ordersRaw ?? [])
    .map((row) => ({
      ...row,
      community_id: row.business_id ? (businessCommunity.get(row.business_id) ?? null) : null,
    }))
    .filter((row) => !communityFilter || row.community_id === communityFilter);

  const buyers = new Set(orders.map((row) => row.user_id).filter(Boolean));
  const revenueCents = orders.reduce(
    (sum, row) => sum + row.subtotal_cents + row.shipping_cents,
    0,
  );
  const shippingCollectedCents = orders.reduce((sum, row) => sum + row.shipping_cents, 0);
  const orderIds = orders.map((row) => row.id);

  let manufacturingCostCents = 0;
  let supplierShippingCostCents = 0;
  const supplierMap = new Map<
    string,
    { supplierId: string; supplierName: string; fulfillments: number; manufacturingCostCents: number; supplierShippingCostCents: number }
  >();

  if (orderIds.length) {
    const { data: fulfillments } = await admin
      .from("fulfillments")
      .select("id, order_id, supplier_id, manufacturing_cost_cents, supplier_shipping_cost_cents, suppliers(name)")
      .in("order_id", orderIds)
      .is("parent_fulfillment_id", null);
    for (const row of fulfillments ?? []) {
      manufacturingCostCents += row.manufacturing_cost_cents;
      supplierShippingCostCents += row.supplier_shipping_cost_cents;
      const supplier = row.suppliers as unknown as { name: string } | null;
      const existing = supplierMap.get(row.supplier_id) ?? {
        supplierId: row.supplier_id,
        supplierName: supplier?.name ?? "Supplier",
        fulfillments: 0,
        manufacturingCostCents: 0,
        supplierShippingCostCents: 0,
      };
      existing.fulfillments += 1;
      existing.manufacturingCostCents += row.manufacturing_cost_cents;
      existing.supplierShippingCostCents += row.supplier_shipping_cost_cents;
      supplierMap.set(row.supplier_id, existing);
    }
  }

  let stripeFeesCents = 0;
  if (orderIds.length) {
    const { data: payments } = await admin
      .from("payments")
      .select("fee_cents, order_id, status")
      .in("order_id", orderIds)
      .eq("status", "succeeded");
    for (const payment of payments ?? []) {
      stripeFeesCents += payment.fee_cents ?? 0;
    }
  }

  let refundsCents = 0;
  if (orderIds.length) {
    const { data: refunds } = await admin
      .from("refunds")
      .select("amount_cents, order_id, status")
      .in("order_id", orderIds)
      .in("status", ["succeeded", "pending"]);
    for (const refund of refunds ?? []) {
      refundsCents += refund.amount_cents;
    }
  }

  const grossContributionCents = contributionMarginCents({
    revenueCents,
    manufacturingCostCents,
    supplierShippingCostCents,
    stripeFeeCents: stripeFeesCents,
    refundCents: refundsCents,
  });

  const communityNameById = new Map<string, string>();
  const { data: communityRows } = await admin.from("communities").select("id, name");
  for (const row of communityRows ?? []) {
    communityNameById.set(row.id, row.name);
  }

  const contributionByCommunityMap = new Map<
    string,
    { communityId: string; communityName: string; revenueCents: number; contributionCents: number; orders: number }
  >();
  for (const order of orders) {
    const communityId = order.community_id ?? "unknown";
    const existing = contributionByCommunityMap.get(communityId) ?? {
      communityId,
      communityName: communityNameById.get(communityId) ?? "Unknown",
      revenueCents: 0,
      contributionCents: 0,
      orders: 0,
    };
    const orderRevenue = order.subtotal_cents + order.shipping_cents;
    existing.revenueCents += orderRevenue;
    existing.orders += 1;
    contributionByCommunityMap.set(communityId, existing);
  }
  // Approximate contribution allocation by revenue share when costs are order-linked in aggregate.
  const totalRevenue = Math.max(1, revenueCents);
  for (const row of contributionByCommunityMap.values()) {
    row.contributionCents = Math.round(
      (row.revenueCents / totalRevenue) * grossContributionCents,
    );
  }

  const productMap = new Map<
    string,
    { productId: string; productName: string; revenueCents: number; units: number }
  >();
  if (orderIds.length) {
    const { data: items } = await admin
      .from("order_items")
      .select("product_id, product_name_snapshot, quantity, unit_price_cents, order_id")
      .in("order_id", orderIds);
    for (const item of items ?? []) {
      const existing = productMap.get(item.product_id) ?? {
        productId: item.product_id,
        productName: item.product_name_snapshot,
        revenueCents: 0,
        units: 0,
      };
      existing.revenueCents += item.quantity * item.unit_price_cents;
      existing.units += item.quantity;
      productMap.set(item.product_id, existing);
    }
  }

  const { count: emailDelivered } = await admin
    .from("email_deliveries")
    .select("id", { count: "exact", head: true })
    .in("status", ["sent", "delivered", "opened", "clicked"])
    .gte("created_at", fromIso)
    .lte("created_at", toIso);
  const { count: emailClicked } = await admin
    .from("email_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("status", "clicked")
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  const funnelSteps = [
    "funnel.signup",
    "funnel.nominate",
    "funnel.vote",
    "funnel.winner_view",
    "funnel.product_view",
    "funnel.add_to_cart",
    "funnel.checkout_started",
    "funnel.order_paid",
  ] as const;
  const funnel: Array<{ step: string; count: number }> = [];
  for (const step of funnelSteps) {
    let query = admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", step)
      .gte("occurred_at", fromIso)
      .lte("occurred_at", toIso);
    if (communityFilter) query = query.eq("community_id", communityFilter);
    const { count } = await query;
    funnel.push({ step, count: count ?? 0 });
  }

  return {
    range,
    communityId: communityFilter,
    kpis: {
      activeCommunities: activeCommunities ?? 0,
      campaignsByStage,
      businessesListed: businessesListed ?? 0,
      claimedBusinesses: claimedSet.size,
      registeredUsers: registeredUsers ?? 0,
      nominators: nominators.size,
      voters: voters.size,
      votes: votes.length,
      winnerBusinesses: winnerBusinesses.size,
      buyers: buyers.size,
      productConversionRate: productConversionRate({
        winnerBusinesses: winnerBusinesses.size,
        buyers: buyers.size,
      }),
      averageOrderValueCents: averageOrderValueCents({
        revenueCents,
        orders: orders.length,
      }),
      revenueCents,
      manufacturingCostCents,
      shippingCollectedCents,
      supplierShippingCostCents,
      shippingMarginCents: shippingMarginCents({
        shippingCollectedCents,
        supplierShippingCostCents,
      }),
      stripeFeesCents,
      refundsCents,
      grossContributionCents,
      campaignsCompleted,
      emailDelivered: emailDelivered ?? 0,
      emailClicked: emailClicked ?? 0,
      emailConversionRate: emailConversionRate({
        delivered: emailDelivered ?? 0,
        clicked: emailClicked ?? 0,
      }),
    },
    contributionByCommunity: [...contributionByCommunityMap.values()].sort(
      (a, b) => b.contributionCents - a.contributionCents,
    ),
    contributionByProduct: [...productMap.values()].sort(
      (a, b) => b.revenueCents - a.revenueCents,
    ),
    supplierPerformance: [...supplierMap.values()].sort(
      (a, b) => b.fulfillments - a.fulfillments,
    ),
    funnel,
  };
}

export function adminAnalyticsToCsv(dashboard: AdminAnalyticsDashboard): string {
  return toCsv([
    {
      metric: "active_communities",
      value: dashboard.kpis.activeCommunities,
    },
    {
      metric: "claimed_businesses",
      value: dashboard.kpis.claimedBusinesses,
    },
    {
      metric: "revenue_cents",
      value: dashboard.kpis.revenueCents,
    },
    {
      metric: "manufacturing_cost_cents",
      value: dashboard.kpis.manufacturingCostCents,
    },
    {
      metric: "supplier_shipping_cost_cents",
      value: dashboard.kpis.supplierShippingCostCents,
    },
    {
      metric: "shipping_collected_cents",
      value: dashboard.kpis.shippingCollectedCents,
    },
    {
      metric: "shipping_margin_cents",
      value: dashboard.kpis.shippingMarginCents,
    },
    {
      metric: "stripe_fees_cents",
      value: dashboard.kpis.stripeFeesCents,
    },
    {
      metric: "refunds_cents",
      value: dashboard.kpis.refundsCents,
    },
    {
      metric: "gross_contribution_cents",
      value: dashboard.kpis.grossContributionCents,
    },
    {
      metric: "product_conversion_rate",
      value: Number(dashboard.kpis.productConversionRate.toFixed(2)),
    },
    {
      metric: "email_conversion_rate",
      value: Number(dashboard.kpis.emailConversionRate.toFixed(2)),
    },
    {
      metric: "campaigns_completed",
      value: dashboard.kpis.campaignsCompleted,
    },
  ]);
}

export function adminCommunityContributionToCsv(
  dashboard: AdminAnalyticsDashboard,
): string {
  return toCsv(
    dashboard.contributionByCommunity.map((row) => ({
      community_id: row.communityId,
      community_name: row.communityName,
      orders: row.orders,
      revenue_cents: row.revenueCents,
      contribution_cents: row.contributionCents,
    })),
  );
}
