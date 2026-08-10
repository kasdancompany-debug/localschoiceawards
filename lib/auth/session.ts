import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { hasAnyPlatformRole, mapProfileRow } from "@/lib/auth/profile";
import { buildLoginPath } from "@/lib/auth/redirects";
import { listUserPlatformRoleKeys } from "@/lib/auth/roles";
import { toRoute } from "@/lib/routes";
import {
  ADMIN_PLATFORM_ROLES,
  SUPPLIER_PLATFORM_ROLES,
  type AuthenticatedSession,
  type PlatformRoleKey,
  type Profile,
} from "@/types/user";

export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getUserPlatformRoles(userId: string): Promise<PlatformRoleKey[]> {
  return listUserPlatformRoleKeys(userId);
}

export async function getProfileForUser(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileRow(data);
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const user = await getOptionalUser();
  if (!user || !user.email) {
    return null;
  }

  const [profile, roles] = await Promise.all([
    getProfileForUser(user.id),
    getUserPlatformRoles(user.id),
  ]);

  return {
    userId: user.id,
    email: user.email,
    emailConfirmed: Boolean(user.email_confirmed_at),
    profile,
    roles,
  };
}

export async function requireUser(options?: { next?: string }): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession();
  if (!session) {
    redirect(toRoute(buildLoginPath(options?.next ?? "/account")));
  }
  return session;
}

export async function hasPlatformRole(
  role: PlatformRoleKey | PlatformRoleKey[],
  userId?: string,
): Promise<boolean> {
  const required = Array.isArray(role) ? role : [role];
  const roles = userId
    ? await getUserPlatformRoles(userId)
    : ((await getAuthenticatedSession())?.roles ?? []);

  return hasAnyPlatformRole(roles, required);
}

export async function requirePlatformRole(
  role: PlatformRoleKey | PlatformRoleKey[],
  options?: { next?: string; unauthorizedPath?: string },
): Promise<AuthenticatedSession> {
  const session = await requireUser({ next: options?.next });
  const required = Array.isArray(role) ? role : [role];

  if (!hasAnyPlatformRole(session.roles, required)) {
    redirect(toRoute(options?.unauthorizedPath ?? "/account"));
  }

  return session;
}

export async function requireAdminSession(next = "/admin"): Promise<AuthenticatedSession> {
  return requirePlatformRole(ADMIN_PLATFORM_ROLES, {
    next,
    unauthorizedPath: "/account",
  });
}

export async function requireSupplierSession(next = "/supplier"): Promise<AuthenticatedSession> {
  const session = await requireUser({ next });
  if (hasAnyPlatformRole(session.roles, SUPPLIER_PLATFORM_ROLES)) {
    return session;
  }

  const { createSupabaseAdminClient } = await import("@/lib/database/supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("supplier_users")
    .select("id")
    .eq("user_id", session.userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!data) {
    redirect(toRoute("/account"));
  }

  return session;
}

/** @deprecated Use getOptionalUser */
export async function getCurrentUser(): Promise<User | null> {
  return getOptionalUser();
}
