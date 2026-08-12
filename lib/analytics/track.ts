import "server-only";

import { EVENT_TO_BUSINESS_METRIC, type AnalyticsEventName } from "@/lib/analytics/events";
import { sanitizeAnalyticsProperties } from "@/lib/analytics/rules";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { createSupabaseAdminClient } from "@/lib/database";
import type { Json } from "@/types/database";

export type TrackAnalyticsEventInput = {
  eventName: AnalyticsEventName | string;
  communityId?: string | null;
  campaignId?: string | null;
  businessId?: string | null;
  businessLocationId?: string | null;
  userId?: string | null;
  anonymousId?: string | null;
  properties?: Record<string, unknown>;
  occurredAt?: Date | string;
  /** Mirror to PostHog when configured. */
  posthog?: boolean;
};

export async function trackAnalyticsEvent(input: TrackAnalyticsEventInput): Promise<{ ok: true; id?: string } | { ok: false; message: string }> {
  const properties = sanitizeAnalyticsProperties(input.properties);
  const occurredAt =
    typeof input.occurredAt === "string"
      ? input.occurredAt
      : (input.occurredAt ?? new Date()).toISOString();
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("analytics_events")
    .insert({
      event_name: input.eventName,
      community_id: input.communityId ?? null,
      campaign_id: input.campaignId ?? null,
      business_id: input.businessId ?? null,
      user_id: input.userId ?? null,
      anonymous_id: input.anonymousId ?? null,
      properties: properties as Json,
      occurred_at: occurredAt,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  const metricColumn = EVENT_TO_BUSINESS_METRIC[input.eventName as AnalyticsEventName];
  if (metricColumn && input.businessId) {
    const day = occurredAt.slice(0, 10);
    await admin.rpc("bump_business_profile_daily_metric", {
      p_business_id: input.businessId,
      p_business_location_id: input.businessLocationId ?? null,
      p_date: day,
      p_column: metricColumn,
      p_delta: 1,
    });
  }

  if (input.posthog !== false) {
    const distinctId = input.userId || input.anonymousId || "anonymous";
    const flat: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        flat[key] = value;
      }
    }
    if (input.communityId) flat.community_id = input.communityId;
    if (input.campaignId) flat.campaign_id = input.campaignId;
    if (input.businessId) flat.business_id = input.businessId;
    void captureServerEvent(distinctId, input.eventName, flat);
  }

  return { ok: true, id: data?.id };
}

export async function softTrackAnalyticsEvent(input: TrackAnalyticsEventInput): Promise<void> {
  try {
    await trackAnalyticsEvent(input);
  } catch {
    // Analytics must never break primary UX.
  }
}
