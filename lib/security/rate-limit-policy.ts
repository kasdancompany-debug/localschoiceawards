export type AuthRateLimitAction = "login" | "register" | "password_reset";

export type NominationRateLimitAction = "nominate" | "nominate_suggest";

export type VotingRateLimitAction = "vote";

export type AppRateLimitAction =
  | AuthRateLimitAction
  | NominationRateLimitAction
  | VotingRateLimitAction;

export type RateLimitConfig = {
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export const AUTH_RATE_LIMITS: Record<AuthRateLimitAction, RateLimitConfig> = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  register: { limit: 5, windowSeconds: 60 * 60 },
  password_reset: { limit: 5, windowSeconds: 60 * 60 },
};

export const NOMINATION_RATE_LIMITS: Record<NominationRateLimitAction, RateLimitConfig> = {
  nominate: { limit: 20, windowSeconds: 60 * 60 },
  nominate_suggest: { limit: 10, windowSeconds: 60 * 60 },
};

export const VOTING_RATE_LIMITS: Record<VotingRateLimitAction, RateLimitConfig> = {
  vote: { limit: 40, windowSeconds: 60 * 60 },
};

export const APP_RATE_LIMITS: Record<AppRateLimitAction, RateLimitConfig> = {
  ...AUTH_RATE_LIMITS,
  ...NOMINATION_RATE_LIMITS,
  ...VOTING_RATE_LIMITS,
};

/** Pure helper for unit tests — evaluates whether an attempt count is allowed. */
export function evaluateRateLimitWindow(
  attemptCount: number,
  action: AppRateLimitAction,
): RateLimitResult {
  const config = APP_RATE_LIMITS[action];
  if (attemptCount >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: config.windowSeconds,
    };
  }

  return {
    allowed: true,
    remaining: config.limit - attemptCount,
    retryAfterSeconds: 0,
  };
}

export function getAuthRateLimitConfig(action: AuthRateLimitAction): RateLimitConfig {
  return AUTH_RATE_LIMITS[action];
}

export function getAppRateLimitConfig(action: AppRateLimitAction): RateLimitConfig {
  return APP_RATE_LIMITS[action];
}
