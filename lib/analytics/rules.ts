import {
  FORBIDDEN_ANALYTICS_PROPERTY_KEYS,
  type AnalyticsEventName,
} from "@/lib/analytics/events";

export type AnalyticsActor =
  | { kind: "admin"; userId: string }
  | { kind: "business_member"; userId: string; businessIds: string[] }
  | { kind: "anonymous" };

export type DateRange = {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
};

export function parseDateRange(input: {
  from?: string | null;
  to?: string | null;
  defaultDays?: number;
}): DateRange {
  const defaultDays = input.defaultDays ?? 30;
  const to = input.to && /^\d{4}-\d{2}-\d{2}$/.test(input.to)
    ? input.to
    : new Date().toISOString().slice(0, 10);
  const fromDefault = new Date(`${to}T12:00:00.000Z`);
  fromDefault.setUTCDate(fromDefault.getUTCDate() - (defaultDays - 1));
  const from =
    input.from && /^\d{4}-\d{2}-\d{2}$/.test(input.from)
      ? input.from
      : fromDefault.toISOString().slice(0, 10);
  return from <= to ? { from, to } : { from: to, to: from };
}

export function sanitizeAnalyticsProperties(
  properties: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!properties) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (
      FORBIDDEN_ANALYTICS_PROPERTY_KEYS.includes(
        key as (typeof FORBIDDEN_ANALYTICS_PROPERTY_KEYS)[number],
      )
    ) {
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Business dashboards may only see aggregated engagement for businesses they belong to.
 * Individual voter choices are never exposed.
 */
export function canViewBusinessAnalytics(input: {
  actor: AnalyticsActor;
  businessId: string;
}): boolean {
  if (input.actor.kind === "admin") return true;
  if (input.actor.kind === "business_member") {
    return input.actor.businessIds.includes(input.businessId);
  }
  return false;
}

export function canViewCommunityAnalytics(input: { actor: AnalyticsActor }): boolean {
  return input.actor.kind === "admin";
}

export function canCompareCommunities(input: { actor: AnalyticsActor }): boolean {
  return input.actor.kind === "admin";
}

export function filterBusinessMetricsRows<T extends { businessId: string }>(input: {
  actor: AnalyticsActor;
  rows: T[];
}): T[] {
  if (input.actor.kind === "admin") return input.rows;
  if (input.actor.kind === "business_member") {
    const allowed = new Set(input.actor.businessIds);
    return input.rows.filter((row) => allowed.has(row.businessId));
  }
  return [];
}

export function assertNoVoterChoiceLeak(payload: Record<string, unknown>): {
  ok: true;
} | { ok: false; leakedKeys: string[] } {
  const leaked = Object.keys(payload).filter((key) =>
    FORBIDDEN_ANALYTICS_PROPERTY_KEYS.includes(
      key as (typeof FORBIDDEN_ANALYTICS_PROPERTY_KEYS)[number],
    ),
  );
  return leaked.length ? { ok: false, leakedKeys: leaked } : { ok: true };
}

export function contributionMarginCents(input: {
  revenueCents: number;
  manufacturingCostCents: number;
  supplierShippingCostCents: number;
  stripeFeeCents?: number;
  refundCents?: number;
}): number {
  return (
    input.revenueCents -
    input.manufacturingCostCents -
    input.supplierShippingCostCents -
    (input.stripeFeeCents ?? 0) -
    (input.refundCents ?? 0)
  );
}

export function shippingMarginCents(input: {
  shippingCollectedCents: number;
  supplierShippingCostCents: number;
}): number {
  return input.shippingCollectedCents - input.supplierShippingCostCents;
}

export function productConversionRate(input: {
  winnerBusinesses: number;
  buyers: number;
}): number {
  if (input.winnerBusinesses <= 0) return 0;
  return (input.buyers / input.winnerBusinesses) * 100;
}

export function averageOrderValueCents(input: {
  revenueCents: number;
  orders: number;
}): number {
  if (input.orders <= 0) return 0;
  return Math.round(input.revenueCents / input.orders);
}

export function emailConversionRate(input: {
  delivered: number;
  clicked: number;
}): number {
  if (input.delivered <= 0) return 0;
  return (input.clicked / input.delivered) * 100;
}

export function toCsv(rows: Array<Record<string, string | number | null | undefined>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (value: string | number | null | undefined) => {
    const raw = value == null ? "" : String(value);
    if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

export function isFunnelEvent(eventName: string): boolean {
  return eventName.startsWith("funnel.") || eventName.startsWith("winner.");
}

export type TrackableEventName = AnalyticsEventName | string;
