import { describe, expect, it } from "vitest";

import {
  canInviteRole,
  emailDomainMatchesBusinessWebsite,
  isInvitationExpired,
  nextClaimStatusAfterSubmission,
} from "@/lib/businesses/access";
import { assertCanAccessBusiness } from "@/lib/businesses/access";

describe("business access control", () => {
  it("prevents privilege escalation on invites", () => {
    expect(canInviteRole("administrator", "owner")).toBe(false);
    expect(canInviteRole("administrator", "administrator")).toBe(false);
    expect(canInviteRole("administrator", "manager")).toBe(true);
    expect(canInviteRole("manager", "viewer")).toBe(true);
    expect(canInviteRole("viewer", "marketing")).toBe(false);
    expect(canInviteRole("owner", "owner")).toBe(true);
  });

  it("blocks unauthorized membership access", () => {
    expect(() => assertCanAccessBusiness(null)).toThrow(/do not have access/i);
    expect(() =>
      assertCanAccessBusiness({ role: "viewer", status: "revoked" }),
    ).toThrow(/do not have access/i);
    expect(() => assertCanAccessBusiness({ role: "manager", status: "active" })).not.toThrow();
  });

  it("marks invitations expired after expires_at", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isInvitationExpired(past)).toBe(true);
    expect(isInvitationExpired(future)).toBe(false);
  });

  it("never auto-approves from domain email alone", () => {
    expect(
      nextClaimStatusAfterSubmission({ domainEmailMatched: true, hasEvidence: false }),
    ).toBe("email_verification");
    expect(
      nextClaimStatusAfterSubmission({ domainEmailMatched: true, hasEvidence: true }),
    ).toBe("under_review");
    expect(
      nextClaimStatusAfterSubmission({ domainEmailMatched: false, hasEvidence: false }),
    ).toBe("evidence_required");
  });

  it("detects matching business-domain emails", () => {
    expect(
      emailDomainMatchesBusinessWebsite("owner@riverfrontpizza.ca", "https://www.riverfrontpizza.ca"),
    ).toBe(true);
    expect(
      emailDomainMatchesBusinessWebsite("person@gmail.com", "https://riverfrontpizza.ca"),
    ).toBe(false);
  });
});
