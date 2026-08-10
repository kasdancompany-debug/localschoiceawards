import type { ProfileRow } from "@/types/database";
import type { PlatformRoleKey, Profile } from "@/types/user";
import { PLATFORM_ROLE_KEYS } from "@/types/user";

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    preferredLocale: row.preferred_locale,
    preferredCurrency: row.preferred_currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isPlatformRoleKey(value: string): value is PlatformRoleKey {
  return (PLATFORM_ROLE_KEYS as readonly string[]).includes(value);
}

export function normalizePlatformRoles(keys: string[]): PlatformRoleKey[] {
  const unique = new Set<PlatformRoleKey>();
  for (const key of keys) {
    if (isPlatformRoleKey(key)) {
      unique.add(key);
    }
  }
  return [...unique];
}

export function hasAnyPlatformRole(
  userRoles: readonly PlatformRoleKey[],
  required: readonly PlatformRoleKey[],
): boolean {
  return required.some((role) => userRoles.includes(role));
}

export function getDisplayName(profile: Profile | null, email: string): string {
  if (profile?.displayName?.trim()) {
    return profile.displayName.trim();
  }

  const composed = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  if (composed) {
    return composed;
  }

  return email;
}

export function getAccountStatusLabel(options: {
  emailConfirmed: boolean;
  banned?: boolean;
}): string {
  if (options.banned) {
    return "Suspended";
  }
  if (!options.emailConfirmed) {
    return "Email verification required";
  }
  return "Active";
}
