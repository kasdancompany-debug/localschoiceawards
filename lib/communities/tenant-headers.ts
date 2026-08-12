/**
 * Tenant header names shared by Edge proxy and Server Components.
 * Keep this module free of env / server-only imports so proxy/middleware stays bootable.
 */

export const COMMUNITY_SUBDOMAIN_HEADER = "x-community-subdomain";
export const HOSTNAME_KIND_HEADER = "x-hostname-kind";
