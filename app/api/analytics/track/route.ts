import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CLIENT_TRACKABLE_ANALYTICS_EVENTS,
  type ClientTrackableAnalyticsEvent,
} from "@/lib/analytics/events";
import { softTrackAnalyticsEvent } from "@/lib/analytics/track";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { assertAppRateLimit } from "@/lib/security/rate-limit";

const clientEventSet = new Set<string>(CLIENT_TRACKABLE_ANALYTICS_EVENTS);

const bodySchema = z.object({
  eventName: z
    .string()
    .min(1)
    .max(120)
    .refine((value): value is ClientTrackableAnalyticsEvent => clientEventSet.has(value), {
      message: "Unsupported analytics event.",
    }),
  communityId: z.string().uuid().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
  businessId: z.string().uuid().optional().nullable(),
  businessLocationId: z.string().uuid().optional().nullable(),
  anonymousId: z.string().max(120).optional().nullable(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

function clientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ip = clientIp(request);
  const identifier = user?.id || parsed.data.anonymousId || ip || "anonymous";
  try {
    const limit = await assertAppRateLimit({
      action: "analytics_track",
      identifier,
      ipAddress: ip,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }
  } catch {
    // Fail open on rate-limit infrastructure errors so UX is not blocked.
  }

  await softTrackAnalyticsEvent({
    eventName: parsed.data.eventName,
    communityId: parsed.data.communityId,
    campaignId: parsed.data.campaignId,
    businessId: parsed.data.businessId,
    businessLocationId: parsed.data.businessLocationId,
    userId: user?.id ?? null,
    anonymousId: parsed.data.anonymousId,
    properties: parsed.data.properties,
  });

  return NextResponse.json({ ok: true });
}
