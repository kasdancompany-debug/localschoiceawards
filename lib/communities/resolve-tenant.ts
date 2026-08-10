import { parseHostname, type HostnameKind, type ParsedHostname } from "@/lib/communities/hostname";
import type { Community } from "@/types/community";

export type CommunityLookup = (subdomain: string) => Promise<Community | null>;

export type TenantResolution =
  | { kind: "main"; parsed: ParsedHostname; community: null }
  | { kind: "business" | "admin" | "supplier"; parsed: ParsedHostname; community: null }
  | { kind: "community"; parsed: ParsedHostname; community: Community }
  | { kind: "unavailable"; parsed: ParsedHostname; community: null; reason: "unknown" | "inactive" }
  | { kind: "unknown"; parsed: ParsedHostname; community: null };

/**
 * Hostname → tenant resolution used by proxy consumers and integration tests.
 * Community identity always comes from hostname + lookup — never from a browser community ID.
 */
export async function resolveTenantFromHostname(
  hostHeader: string,
  rootDomain: string,
  lookup: CommunityLookup,
): Promise<TenantResolution> {
  const parsed = parseHostname(hostHeader, rootDomain);

  switch (parsed.kind) {
    case "main":
      return { kind: "main", parsed, community: null };
    case "business":
      return { kind: "business", parsed, community: null };
    case "admin":
      return { kind: "admin", parsed, community: null };
    case "supplier":
      return { kind: "supplier", parsed, community: null };
    case "unknown":
      return { kind: "unknown", parsed, community: null };
    case "community": {
      if (!parsed.subdomain) {
        return { kind: "unavailable", parsed, community: null, reason: "unknown" };
      }
      const community = await lookup(parsed.subdomain);
      if (!community) {
        return { kind: "unavailable", parsed, community: null, reason: "unknown" };
      }
      return { kind: "community", parsed, community };
    }
    default:
      return { kind: "unknown", parsed, community: null };
  }
}

export function shouldPassthroughTenantRewrite(pathname: string): boolean {
  const passthroughPrefixes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/auth",
    "/api",
    "/account",
  ];

  return passthroughPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function internalPathForHostnameKind(
  kind: HostnameKind,
  pathname: string,
): string | null {
  if (shouldPassthroughTenantRewrite(pathname)) {
    return null;
  }

  const suffix = pathname === "/" ? "" : pathname;

  switch (kind) {
    case "community":
      return pathname.startsWith("/community") ? null : `/community${suffix}`;
    case "admin":
      return pathname.startsWith("/admin") ? null : `/admin${suffix}`;
    case "supplier":
      return pathname.startsWith("/supplier") ? null : `/supplier${suffix}`;
    case "business":
      return pathname.startsWith("/business") ? null : `/business${suffix}`;
    case "main":
    case "unknown":
    default:
      return null;
  }
}
