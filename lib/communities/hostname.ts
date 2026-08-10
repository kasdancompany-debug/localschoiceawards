import { isReservedSubdomain } from "@/lib/communities/reserved";

export type HostnameKind =
  | "main"
  | "community"
  | "business"
  | "admin"
  | "supplier"
  | "unknown";

export type ParsedHostname = {
  hostHeader: string;
  hostname: string;
  port: string | null;
  rootHostname: string;
  subdomain: string | null;
  kind: HostnameKind;
};

function stripPort(value: string): { hostname: string; port: string | null } {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return { hostname: "", port: null };
  }

  // IPv6 literals are not used for community hosts; keep simple host:port parsing.
  const [hostname = "", port = null] = trimmed.split(":");
  return { hostname, port };
}

function classifySubdomain(subdomain: string | null): HostnameKind {
  if (!subdomain) {
    return "main";
  }

  switch (subdomain) {
    case "www":
      return "main";
    case "business":
      return "business";
    case "admin":
      return "admin";
    case "supplier":
      return "supplier";
    default:
      if (isReservedSubdomain(subdomain)) {
        return "unknown";
      }
      return "community";
  }
}

/**
 * Pure hostname parser used by proxy and server community resolution.
 * Strips ports, lowercases hosts, and classifies reserved vs community labels.
 */
export function parseHostname(hostHeader: string, rootDomain: string): ParsedHostname {
  const host = stripPort(hostHeader);
  const root = stripPort(rootDomain);
  const hostname = host.hostname;
  const rootHostname = root.hostname;

  if (!hostname || !rootHostname) {
    return {
      hostHeader,
      hostname,
      port: host.port,
      rootHostname,
      subdomain: null,
      kind: "main",
    };
  }

  if (hostname === rootHostname || hostname === "localhost" && rootHostname === "localhost") {
    return {
      hostHeader,
      hostname,
      port: host.port,
      rootHostname,
      subdomain: null,
      kind: "main",
    };
  }

  // Local wildcard style: saultstemarie.localhost
  if (rootHostname === "localhost" && hostname.endsWith(".localhost")) {
    const subdomain = hostname.slice(0, -".localhost".length);
    if (!subdomain || subdomain.includes(".")) {
      return {
        hostHeader,
        hostname,
        port: host.port,
        rootHostname,
        subdomain: null,
        kind: "unknown",
      };
    }

    return {
      hostHeader,
      hostname,
      port: host.port,
      rootHostname,
      subdomain,
      kind: classifySubdomain(subdomain),
    };
  }

  if (hostname === `www.${rootHostname}`) {
    return {
      hostHeader,
      hostname,
      port: host.port,
      rootHostname,
      subdomain: "www",
      kind: "main",
    };
  }

  if (hostname.endsWith(`.${rootHostname}`)) {
    const subdomain = hostname.slice(0, -(rootHostname.length + 1));
    if (!subdomain || subdomain.includes(".")) {
      return {
        hostHeader,
        hostname,
        port: host.port,
        rootHostname,
        subdomain: null,
        kind: "unknown",
      };
    }

    return {
      hostHeader,
      hostname,
      port: host.port,
      rootHostname,
      subdomain,
      kind: classifySubdomain(subdomain),
    };
  }

  return {
    hostHeader,
    hostname,
    port: host.port,
    rootHostname,
    subdomain: null,
    kind: "unknown",
  };
}

export function buildCommunityHostname(
  subdomain: string,
  rootDomain: string,
  protocol: "http" | "https" = "https",
): string {
  const root = stripPort(rootDomain);
  const portSuffix = root.port ? `:${root.port}` : "";
  const normalizedSubdomain = subdomain.trim().toLowerCase();

  if (isReservedSubdomain(normalizedSubdomain)) {
    throw new Error(`Cannot build community URL for reserved subdomain "${normalizedSubdomain}".`);
  }

  return `${protocol}://${normalizedSubdomain}.${root.hostname}${portSuffix}`;
}

/** @deprecated Prefer parseHostname().subdomain for community candidates */
export function extractSubdomain(host: string, rootDomain: string): string | null {
  const parsed = parseHostname(host, rootDomain);
  return parsed.kind === "community" ? parsed.subdomain : null;
}
