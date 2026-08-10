export {
  getAuthenticatedSession,
  getCurrentUser,
  getOptionalUser,
  getProfileForUser,
  getUserPlatformRoles,
  hasPlatformRole,
  requireAdminSession,
  requirePlatformRole,
  requireSupplierSession,
  requireUser,
} from "@/lib/auth/session";
export {
  getAccountStatusLabel,
  getDisplayName,
  hasAnyPlatformRole,
  isPlatformRoleKey,
  mapProfileRow,
  normalizePlatformRoles,
} from "@/lib/auth/profile";
export { buildLoginPath, sanitizeRedirectPath } from "@/lib/auth/redirects";
export { grantPlatformRole, listUserPlatformRoleKeys, revokePlatformRole } from "@/lib/auth/roles";
export {
  canSelfAssignPlatformRole,
  decideAuthentication,
  decidePlatformAuthorization,
} from "@/lib/auth/guards";
export type { GuardDecision } from "@/lib/auth/guards";
