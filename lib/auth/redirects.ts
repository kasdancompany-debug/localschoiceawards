/**
 * Pure redirect helpers — safe for unit tests without Next.js runtime.
 */

export function sanitizeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/account",
): string {
  if (!candidate) {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return fallback;
  }

  return trimmed;
}

export function buildLoginPath(next?: string | null): string {
  const redirect = sanitizeRedirectPath(next, "/account");
  if (redirect === "/account") {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(redirect)}`;
}
