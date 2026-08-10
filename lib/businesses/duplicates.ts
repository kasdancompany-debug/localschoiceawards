import type { DuplicateCandidate } from "@/types/business";

export function normalizeBusinessText(input: string | null | undefined): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePhoneDigits(input: string | null | undefined): string | null {
  const digits = (input ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

export function normalizeWebsiteDomain(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim().toLowerCase();
  if (!raw) {
    return null;
  }
  const withoutProtocol = raw.replace(/^https?:\/\//, "").replace(/^www\./, "");
  const host = withoutProtocol.split("/")[0]?.split("?")[0]?.trim() ?? "";
  return host || null;
}

export function normalizeAddressKey(parts: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  administrativeRegionCode?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
}): string {
  return normalizeBusinessText(
    [
      parts.addressLine1,
      parts.addressLine2,
      parts.city,
      parts.administrativeRegionCode,
      parts.postalCode,
      parts.countryCode,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function slugifyBusinessName(input: string): string {
  const slug = normalizeBusinessText(input).replace(/\s+/g, "-");
  return slug || "business";
}

export function ensureUniqueBusinessSlug(desired: string, existingSlugs: Set<string>): string {
  const base = slugifyBusinessName(desired);
  if (!existingSlugs.has(base)) {
    return base;
  }
  let index = 2;
  while (existingSlugs.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

export type DuplicateProbe = {
  id: string;
  locationId?: string;
  publicName: string;
  slug: string;
  communityId?: string;
  normalizedName: string;
  normalizedPhone: string | null;
  normalizedWebsiteDomain: string | null;
  normalizedAddress: string | null;
};

export type IncomingDuplicateSignals = {
  publicName: string;
  phone?: string | null;
  websiteUrl?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  administrativeRegionCode?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
};

/**
 * Score potential duplicates using normalized name, phone, website domain, and address.
 */
export function findDuplicateCandidates(
  incoming: IncomingDuplicateSignals,
  existing: DuplicateProbe[],
  options?: { communityId?: string; minScore?: number },
): DuplicateCandidate[] {
  const minScore = options?.minScore ?? 40;
  const name = normalizeBusinessText(incoming.publicName);
  const phone = normalizePhoneDigits(incoming.phone);
  const domain = normalizeWebsiteDomain(incoming.websiteUrl);
  const address = normalizeAddressKey(incoming);

  const results: DuplicateCandidate[] = [];

  for (const row of existing) {
    if (options?.communityId && row.communityId && row.communityId !== options.communityId) {
      continue;
    }

    const reasons: string[] = [];
    let score = 0;

    if (name && row.normalizedName === name) {
      reasons.push("exact_name");
      score += 50;
    } else if (
      name &&
      row.normalizedName &&
      (name.includes(row.normalizedName) || row.normalizedName.includes(name))
    ) {
      reasons.push("similar_name");
      score += 25;
    }

    if (phone && row.normalizedPhone && phone === row.normalizedPhone) {
      reasons.push("phone");
      score += 35;
    }

    if (domain && row.normalizedWebsiteDomain && domain === row.normalizedWebsiteDomain) {
      reasons.push("website_domain");
      score += 30;
    }

    if (address && row.normalizedAddress && address === row.normalizedAddress) {
      reasons.push("address");
      score += 40;
    }

    if (score >= minScore && reasons.length > 0) {
      results.push({
        businessId: row.id,
        locationId: row.locationId,
        publicName: row.publicName,
        slug: row.slug,
        communityId: row.communityId,
        reasons,
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

/** Keep locations scoped to a community — never mix tenants. */
export function filterLocationsForCommunity<T extends { communityId: string }>(
  locations: T[],
  communityId: string,
): T[] {
  return locations.filter((location) => location.communityId === communityId);
}
