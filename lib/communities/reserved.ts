export const RESERVED_SYSTEM_SUBDOMAINS = [
  "www",
  "business",
  "account",
  "admin",
  "supplier",
  "api",
  "app",
  "support",
  "partners",
  "assets",
  "static",
  "mail",
] as const;

export type ReservedSystemSubdomain = (typeof RESERVED_SYSTEM_SUBDOMAINS)[number];

const reservedSet = new Set<string>(RESERVED_SYSTEM_SUBDOMAINS);

export function isReservedSubdomain(value: string): boolean {
  return reservedSet.has(value.trim().toLowerCase());
}

export function assertNotReservedSubdomain(value: string): void {
  if (isReservedSubdomain(value)) {
    throw new Error(`Subdomain "${value}" is reserved for system use.`);
  }
}
