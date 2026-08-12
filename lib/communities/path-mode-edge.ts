/**
 * Edge-safe path-community helpers (no server-only / env module imports).
 * Used by proxy.ts.
 */

const PATH_COMMUNITY_COOKIE = "lca_path_community";

export function pathCommunityCookieName(): string {
  return PATH_COMMUNITY_COOKIE;
}

export function usesPathCommunityUrlsFromEnv(): boolean {
  if (process.env.USE_PATH_COMMUNITY_URLS === "true") return true;
  if (process.env.USE_PATH_COMMUNITY_URLS === "false") return false;
  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "").toLowerCase();
  return root.endsWith(".vercel.app");
}

export function parsePathCommunityRequest(pathname: string): {
  subdomain: string;
  restPath: string;
} | null {
  const match = pathname.match(/^\/c\/([a-z0-9]+(?:-[a-z0-9]+)*)(\/.*)?$/i);
  if (!match?.[1]) return null;
  const rest = match[2] && match[2].length > 0 ? match[2] : "/";
  return { subdomain: match[1].toLowerCase(), restPath: rest };
}

export function isCommunitySurfacePath(pathname: string): boolean {
  const prefixes = [
    "/categories",
    "/category",
    "/search",
    "/winners",
    "/nominate",
    "/vote",
    "/finalists",
    "/how-it-works",
    "/rules",
    "/missing-business",
    "/business",
    "/order",
    "/cart",
    "/checkout",
  ];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
