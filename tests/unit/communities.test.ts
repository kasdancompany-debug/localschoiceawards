import { describe, expect, it } from "vitest";

import {
  buildCommunityHostname,
  extractSubdomain,
  parseHostname,
} from "@/lib/communities/hostname";
import { isReservedSubdomain, RESERVED_SYSTEM_SUBDOMAINS } from "@/lib/communities/reserved";
import {
  internalPathForHostnameKind,
  resolveTenantFromHostname,
} from "@/lib/communities/resolve-tenant";
import { getPilotCommunityBySubdomain, PILOT_COMMUNITIES } from "@/lib/communities/pilot-catalog";
import { isCommunityPubliclyAvailable } from "@/types/community";
import { contactFormSchema } from "@/lib/validation/schemas";

describe("parseHostname", () => {
  it("classifies the apex and www as main", () => {
    expect(parseHostname("localschoiceawards.com", "localschoiceawards.com").kind).toBe("main");
    expect(parseHostname("www.localschoiceawards.com", "localschoiceawards.com").kind).toBe("main");
    expect(parseHostname("localhost:3000", "localhost:3000").kind).toBe("main");
  });

  it("strips ports and lowercases hosts", () => {
    const parsed = parseHostname("Sudbury.LocalsChoiceAwards.COM:443", "localschoiceawards.com");
    expect(parsed.hostname).toBe("sudbury.localschoiceawards.com");
    expect(parsed.port).toBe("443");
    expect(parsed.subdomain).toBe("sudbury");
    expect(parsed.kind).toBe("community");
  });

  it("distinguishes system surfaces", () => {
    expect(parseHostname("admin.localschoiceawards.com", "localschoiceawards.com").kind).toBe(
      "admin",
    );
    expect(parseHostname("business.localhost:3000", "localhost:3000").kind).toBe("business");
    expect(parseHostname("supplier.localhost:3000", "localhost:3000").kind).toBe("supplier");
  });

  it("marks other reserved labels as unknown", () => {
    expect(parseHostname("api.localschoiceawards.com", "localschoiceawards.com").kind).toBe(
      "unknown",
    );
    expect(parseHostname("mail.localschoiceawards.com", "localschoiceawards.com").kind).toBe(
      "unknown",
    );
  });

  it("supports local wildcard community hosts", () => {
    const parsed = parseHostname("saultstemarie.localhost:3000", "localhost:3000");
    expect(parsed.kind).toBe("community");
    expect(parsed.subdomain).toBe("saultstemarie");
  });
});

describe("extractSubdomain", () => {
  it("returns community labels only", () => {
    expect(extractSubdomain("sudbury.localschoiceawards.com", "localschoiceawards.com")).toBe(
      "sudbury",
    );
    expect(extractSubdomain("www.localschoiceawards.com", "localschoiceawards.com")).toBeNull();
    expect(extractSubdomain("admin.localschoiceawards.com", "localschoiceawards.com")).toBeNull();
  });
});

describe("reserved subdomains", () => {
  it("includes the required system labels", () => {
    for (const label of [
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
    ]) {
      expect(RESERVED_SYSTEM_SUBDOMAINS).toContain(label);
      expect(isReservedSubdomain(label.toUpperCase())).toBe(true);
    }
  });

  it("rejects building community URLs for reserved labels", () => {
    expect(() => buildCommunityHostname("admin", "localschoiceawards.com")).toThrow(/reserved/i);
  });
});

describe("buildCommunityHostname", () => {
  it("builds production and local community hosts", () => {
    expect(buildCommunityHostname("detroit", "localschoiceawards.com")).toBe(
      "https://detroit.localschoiceawards.com",
    );
    expect(buildCommunityHostname("detroit", "localhost:3000", "http")).toBe(
      "http://detroit.localhost:3000",
    );
  });
});

describe("internalPathForHostnameKind", () => {
  it("rewrites tenant roots without changing already-prefixed paths", () => {
    expect(internalPathForHostnameKind("community", "/")).toBe("/community");
    expect(internalPathForHostnameKind("community", "/community")).toBeNull();
    expect(internalPathForHostnameKind("admin", "/")).toBe("/admin");
    expect(internalPathForHostnameKind("business", "/claims")).toBe("/business/claims");
    expect(internalPathForHostnameKind("main", "/")).toBeNull();
    expect(internalPathForHostnameKind("admin", "/login")).toBeNull();
    expect(internalPathForHostnameKind("community", "/account/settings")).toBeNull();
  });
});

describe("resolveTenantFromHostname integration", () => {
  it("resolves each pilot subdomain to a different community", async () => {
    const lookup = async (subdomain: string) => getPilotCommunityBySubdomain(subdomain);
    const resolved = await Promise.all(
      PILOT_COMMUNITIES.map(async (pilot) => {
        const result = await resolveTenantFromHostname(
          `${pilot.subdomain}.localhost:3000`,
          "localhost:3000",
          lookup,
        );
        return result;
      }),
    );

    expect(resolved.every((item) => item.kind === "community")).toBe(true);
    const ids = resolved.map((item) => (item.kind === "community" ? item.community.id : null));
    expect(new Set(ids).size).toBe(PILOT_COMMUNITIES.length);
  });

  it("does not trust missing communities", async () => {
    const result = await resolveTenantFromHostname(
      "nowhere.localschoiceawards.com",
      "localschoiceawards.com",
      async () => null,
    );
    expect(result.kind).toBe("unavailable");
  });

  it("keeps admin and business hosts non-community", async () => {
    const admin = await resolveTenantFromHostname(
      "admin.localhost:3000",
      "localhost:3000",
      async () => {
        throw new Error("lookup should not run for admin hosts");
      },
    );
    expect(admin.kind).toBe("admin");

    const business = await resolveTenantFromHostname(
      "business.localschoiceawards.com",
      "localschoiceawards.com",
      async () => null,
    );
    expect(business.kind).toBe("business");
  });
});

describe("community availability", () => {
  it("hides archived markets from public resolution rules", () => {
    expect(
      isCommunityPubliclyAvailable({
        isPublic: true,
        marketStatus: "archived",
      }),
    ).toBe(false);
    expect(
      isCommunityPubliclyAvailable({
        isPublic: true,
        marketStatus: "preparing",
      }),
    ).toBe(true);
  });
});

describe("contactFormSchema", () => {
  it("accepts valid contact payloads", () => {
    const result = contactFormSchema.safeParse({
      name: "Alex Rivera",
      email: "alex@example.com",
      message: "I would like to nominate a local business.",
      turnstileToken: "test-token",
    });

    expect(result.success).toBe(true);
  });
});
