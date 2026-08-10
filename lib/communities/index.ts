export {
  buildCommunityHostname,
  extractSubdomain,
  parseHostname,
} from "@/lib/communities/hostname";
export type { HostnameKind, ParsedHostname } from "@/lib/communities/hostname";
export {
  assertNotReservedSubdomain,
  isReservedSubdomain,
  RESERVED_SYSTEM_SUBDOMAINS,
} from "@/lib/communities/reserved";
export { toCommunitySummary } from "@/lib/communities/mappers";
export {
  getCommunityById,
  getCommunityBySubdomain,
  getPublicCommunityBySubdomain,
  resolveCommunityByHostLabel,
} from "@/lib/communities/service";
export {
  COMMUNITY_SUBDOMAIN_HEADER,
  getCurrentCommunity,
  HOSTNAME_KIND_HEADER,
  requireCurrentCommunity,
} from "@/lib/communities/current";
export { buildCommunityMetadata, getCommunityCanonicalUrl } from "@/lib/communities/metadata";
export {
  internalPathForHostnameKind,
  resolveTenantFromHostname,
  shouldPassthroughTenantRewrite,
} from "@/lib/communities/resolve-tenant";
export type { CommunityLookup, TenantResolution } from "@/lib/communities/resolve-tenant";
