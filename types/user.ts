export const PLATFORM_ROLE_KEYS = [
  "user",
  "moderator",
  "support",
  "operations",
  "finance",
  "administrator",
  "super_administrator",
  "supplier_user",
] as const;

export type PlatformRoleKey = (typeof PLATFORM_ROLE_KEYS)[number];

export const ADMIN_PLATFORM_ROLES: PlatformRoleKey[] = [
  "administrator",
  "super_administrator",
];

export const SUPPLIER_PLATFORM_ROLES: PlatformRoleKey[] = [
  "supplier_user",
  "administrator",
  "super_administrator",
];

export type Profile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  preferredLocale: string;
  preferredCurrency: "CAD" | "USD";
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedSession = {
  userId: string;
  email: string;
  emailConfirmed: boolean;
  profile: Profile | null;
  roles: PlatformRoleKey[];
};

/** @deprecated Prefer PlatformRoleKey — kept briefly for migration clarity */
export type UserRole = PlatformRoleKey;

export type AppUserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  roles: PlatformRoleKey[];
};
