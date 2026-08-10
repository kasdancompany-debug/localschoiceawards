import { describe, expect, it } from "vitest";

import {
  canSelfAssignPlatformRole,
  decideAuthentication,
  decidePlatformAuthorization,
} from "@/lib/auth/guards";
import { getAccountStatusLabel, getDisplayName, hasAnyPlatformRole } from "@/lib/auth/profile";
import { buildLoginPath, sanitizeRedirectPath } from "@/lib/auth/redirects";
import { evaluateRateLimitWindow } from "@/lib/security/rate-limit-policy";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import type { Profile } from "@/types/user";

describe("sanitizeRedirectPath", () => {
  it("allows relative app paths", () => {
    expect(sanitizeRedirectPath("/account/settings")).toBe("/account/settings");
  });

  it("rejects open redirects", () => {
    expect(sanitizeRedirectPath("https://evil.example")).toBe("/account");
    expect(sanitizeRedirectPath("//evil.example")).toBe("/account");
  });
});

describe("buildLoginPath", () => {
  it("omits next when destination is the account home", () => {
    expect(buildLoginPath("/account")).toBe("/login");
  });

  it("encodes intended destinations", () => {
    expect(buildLoginPath("/admin")).toBe("/login?next=%2Fadmin");
  });
});

describe("authorization guards", () => {
  it("requires authentication before role checks", () => {
    expect(decideAuthentication(false)).toBe("unauthenticated");
    expect(decidePlatformAuthorization(false, [], ["administrator"])).toBe("unauthenticated");
  });

  it("allows matching platform roles", () => {
    expect(
      decidePlatformAuthorization(true, ["administrator"], ["administrator", "super_administrator"]),
    ).toBe("allow");
  });

  it("forbids authenticated users without the required role", () => {
    expect(decidePlatformAuthorization(true, ["user"], ["supplier_user"])).toBe("forbidden");
  });

  it("supports hasAnyPlatformRole helper", () => {
    expect(hasAnyPlatformRole(["user", "moderator"], ["moderator"])).toBe(true);
    expect(hasAnyPlatformRole(["user"], ["administrator"])).toBe(false);
  });
});

describe("canSelfAssignPlatformRole", () => {
  it("blocks self-assignment of privileged roles", () => {
    const result = canSelfAssignPlatformRole("user-1", "user-1", ["administrator"], "moderator");
    expect(result.allowed).toBe(false);
  });

  it("blocks non-admins from granting roles", () => {
    const result = canSelfAssignPlatformRole("admin-1", "user-2", ["user"], "moderator");
    expect(result.allowed).toBe(false);
  });

  it("allows administrators to grant non-super roles to others", () => {
    const result = canSelfAssignPlatformRole("admin-1", "user-2", ["administrator"], "support");
    expect(result.allowed).toBe(true);
  });

  it("requires super_administrator to grant super_administrator", () => {
    const denied = canSelfAssignPlatformRole(
      "admin-1",
      "user-2",
      ["administrator"],
      "super_administrator",
    );
    expect(denied.allowed).toBe(false);

    const allowed = canSelfAssignPlatformRole(
      "super-1",
      "user-2",
      ["super_administrator"],
      "super_administrator",
    );
    expect(allowed.allowed).toBe(true);
  });
});

describe("account status helpers", () => {
  it("labels email verification and active states", () => {
    expect(getAccountStatusLabel({ emailConfirmed: false })).toBe("Email verification required");
    expect(getAccountStatusLabel({ emailConfirmed: true })).toBe("Active");
  });

  it("prefers display name then composed name", () => {
    const profile: Profile = {
      id: "1",
      firstName: "Ada",
      lastName: "Lovelace",
      displayName: "Ada L.",
      avatarUrl: null,
      preferredLocale: "en-CA",
      preferredCurrency: "CAD",
      createdAt: "",
      updatedAt: "",
    };
    expect(getDisplayName(profile, "ada@example.com")).toBe("Ada L.");
  });
});

describe("auth rate limits", () => {
  it("blocks when the attempt window is exhausted", () => {
    expect(evaluateRateLimitWindow(10, "login").allowed).toBe(false);
    expect(evaluateRateLimitWindow(3, "login").allowed).toBe(true);
  });
});

describe("auth schemas", () => {
  it("accepts valid login payloads", () => {
    const result = loginSchema.safeParse({
      email: "voter@example.com",
      password: "secret-value",
      turnstileToken: "token",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak registration passwords", () => {
    const result = registerSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      password: "short",
      confirmPassword: "short",
      turnstileToken: "token",
    });
    expect(result.success).toBe(false);
  });
});
