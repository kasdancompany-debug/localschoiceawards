import "server-only";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import {
  APP_RATE_LIMITS,
  type AppRateLimitAction,
  type AuthRateLimitAction,
  type RateLimitResult,
} from "@/lib/security/rate-limit-policy";

export type { AppRateLimitAction, AuthRateLimitAction, RateLimitResult };

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

async function assertRateLimit(options: {
  action: AppRateLimitAction;
  identifier: string;
  ipAddress?: string | null;
}): Promise<RateLimitResult> {
  const admin = createSupabaseAdminClient();
  const config = APP_RATE_LIMITS[options.action];
  const identifier = normalizeIdentifier(options.identifier);
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

  const { count, error: countError } = await admin
    .from("auth_rate_limit_attempts")
    .select("id", { count: "exact", head: true })
    .eq("action", options.action)
    .eq("identifier", identifier)
    .gte("created_at", windowStart);

  if (countError) {
    throw new Error(`Unable to evaluate rate limit: ${countError.message}`);
  }

  const attempts = count ?? 0;
  if (attempts >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: config.windowSeconds,
    };
  }

  const { error: insertError } = await admin.from("auth_rate_limit_attempts").insert({
    action: options.action,
    identifier,
    ip_address: options.ipAddress ?? null,
  });

  if (insertError) {
    throw new Error(`Unable to record rate-limit attempt: ${insertError.message}`);
  }

  return {
    allowed: true,
    remaining: Math.max(config.limit - attempts - 1, 0),
    retryAfterSeconds: 0,
  };
}

export async function assertAuthRateLimit(options: {
  action: AuthRateLimitAction;
  identifier: string;
  ipAddress?: string | null;
}): Promise<RateLimitResult> {
  return assertRateLimit(options);
}

export async function assertAppRateLimit(options: {
  action: AppRateLimitAction;
  identifier: string;
  ipAddress?: string | null;
}): Promise<RateLimitResult> {
  return assertRateLimit(options);
}
