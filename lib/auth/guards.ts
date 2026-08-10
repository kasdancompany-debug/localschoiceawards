import type { PlatformRoleKey } from "@/types/user";
import { hasAnyPlatformRole } from "@/lib/auth/profile";

export type GuardDecision = "allow" | "unauthenticated" | "forbidden";

export function decideAuthentication(isAuthenticated: boolean): GuardDecision {
  return isAuthenticated ? "allow" : "unauthenticated";
}

export function decidePlatformAuthorization(
  isAuthenticated: boolean,
  userRoles: readonly PlatformRoleKey[],
  requiredRoles: readonly PlatformRoleKey[],
): GuardDecision {
  if (!isAuthenticated) {
    return "unauthenticated";
  }

  if (!hasAnyPlatformRole(userRoles, requiredRoles)) {
    return "forbidden";
  }

  return "allow";
}

export function canSelfAssignPlatformRole(
  actorUserId: string,
  targetUserId: string,
  actorRoles: readonly PlatformRoleKey[],
  roleToGrant: PlatformRoleKey,
): { allowed: boolean; reason?: string } {
  if (actorUserId === targetUserId) {
    return { allowed: false, reason: "Users cannot assign roles to themselves." };
  }

  const isAdmin =
    actorRoles.includes("administrator") || actorRoles.includes("super_administrator");
  if (!isAdmin) {
    return { allowed: false, reason: "Only administrators may change roles." };
  }

  if (roleToGrant === "super_administrator" && !actorRoles.includes("super_administrator")) {
    return {
      allowed: false,
      reason: "Only super administrators may grant super_administrator.",
    };
  }

  return { allowed: true };
}
