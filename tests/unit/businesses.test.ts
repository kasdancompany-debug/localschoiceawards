import { describe, expect, it } from "vitest";

import {
  filterLocationsForCommunity,
  findDuplicateCandidates,
  normalizeAddressKey,
  normalizeBusinessText,
  normalizePhoneDigits,
  normalizeWebsiteDomain,
  slugifyBusinessName,
  ensureUniqueBusinessSlug,
  type DuplicateProbe,
} from "@/lib/businesses/duplicates";
import { normalizeImportHeaders, parseCsv } from "@/lib/businesses/csv";

const probes: DuplicateProbe[] = [
  {
    id: "biz-1",
    locationId: "loc-1",
    publicName: "Riverfront Pizza",
    slug: "riverfront-pizza",
    communityId: "community-a",
    normalizedName: normalizeBusinessText("Riverfront Pizza"),
    normalizedPhone: normalizePhoneDigits("(705) 555-1212"),
    normalizedWebsiteDomain: normalizeWebsiteDomain("https://www.riverfrontpizza.ca"),
    normalizedAddress: normalizeAddressKey({
      addressLine1: "123 Queen St",
      city: "Sault Ste. Marie",
      administrativeRegionCode: "ON",
      postalCode: "P6A 1A1",
      countryCode: "CA",
    }),
  },
  {
    id: "biz-2",
    locationId: "loc-2",
    publicName: "Motor City Motors",
    slug: "motor-city-motors",
    communityId: "community-b",
    normalizedName: normalizeBusinessText("Motor City Motors"),
    normalizedPhone: normalizePhoneDigits("3135559999"),
    normalizedWebsiteDomain: normalizeWebsiteDomain("motorcitymotors.com"),
    normalizedAddress: normalizeAddressKey({
      addressLine1: "500 Woodward",
      city: "Detroit",
      administrativeRegionCode: "MI",
      countryCode: "US",
    }),
  },
];

describe("business duplicate detection", () => {
  it("normalizes name, phone, domain and address", () => {
    expect(normalizeBusinessText("Riverfront  Pizza!")).toBe("riverfront pizza");
    expect(normalizePhoneDigits("(705) 555-1212")).toBe("7055551212");
    expect(normalizeWebsiteDomain("https://WWW.RiverfrontPizza.ca/menu")).toBe(
      "riverfrontpizza.ca",
    );
    expect(
      normalizeAddressKey({
        addressLine1: "123 Queen St.",
        city: "Sault Ste. Marie",
        administrativeRegionCode: "ON",
      }),
    ).toContain("queen");
  });

  it("detects duplicates by phone and domain without overwriting logic", () => {
    const matches = findDuplicateCandidates(
      {
        publicName: "Riverfront Pizza Co",
        phone: "705-555-1212",
        websiteUrl: "http://riverfrontpizza.ca",
      },
      probes,
      { communityId: "community-a" },
    );

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.businessId).toBe("biz-1");
    expect(matches[0]?.reasons).toEqual(
      expect.arrayContaining(["phone", "website_domain"]),
    );
  });

  it("isolates duplicate checks to the requested community", () => {
    const matches = findDuplicateCandidates(
      {
        publicName: "Motor City Motors",
        phone: "3135559999",
      },
      probes,
      { communityId: "community-a" },
    );
    expect(matches).toEqual([]);
  });

  it("filters locations by community id", () => {
    const locations = [
      { id: "1", communityId: "community-a" },
      { id: "2", communityId: "community-b" },
    ];
    expect(filterLocationsForCommunity(locations, "community-a")).toEqual([
      { id: "1", communityId: "community-a" },
    ]);
  });

  it("creates unique slugs without colliding", () => {
    const existing = new Set(["riverfront-pizza"]);
    expect(ensureUniqueBusinessSlug("Riverfront Pizza", existing)).toBe("riverfront-pizza-2");
    expect(slugifyBusinessName("Hello World")).toBe("hello-world");
  });
});

describe("csv import parsing", () => {
  it("parses quoted csv and normalizes headers", () => {
    const csv = `public_name,website_url,phone\n"Riverfront Pizza","https://example.com","705-555-0000"`;
    const parsed = parseCsv(csv);
    expect(parsed.rows).toHaveLength(1);
    const normalized = normalizeImportHeaders(parsed.rows[0] ?? {});
    expect(normalized.publicName).toBe("Riverfront Pizza");
    expect(normalized.websiteUrl).toBe("https://example.com");
  });
});
