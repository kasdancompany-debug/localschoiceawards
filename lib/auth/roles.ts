import "server-only";

import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { isPlatformRoleKey, normalizePlatformRoles } from "@/lib/auth/profile";
import type { PlatformRoleKey } from "@/types/user";

export async function listUserPlatformRoleKeys(userId: string): Promise<PlatformRoleKey[]> {
  const supabase = await createSupabaseServerClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("user_platform_roles")
    .select("platform_role_id")
    .eq("user_id", userId);

  if (membershipError || !memberships?.length) {
    return [];
  }

  const roleIds = memberships.map((row) => row.platform_role_id);
  const { data: roles, error: rolesError } = await supabase
    .from("platform_roles")
    .select("key")
    .in("id", roleIds);

  if (rolesError || !roles) {
    return [];
  }

  return normalizePlatformRoles(roles.map((role) => role.key).filter(isPlatformRoleKey));
}

export async function grantPlatformRole(targetUserId: string, roleKey: PlatformRoleKey) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("grant_platform_role", {
    target_user_id: targetUserId,
    role_key: roleKey,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function revokePlatformRole(targetUserId: string, roleKey: PlatformRoleKey) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("revoke_platform_role", {
    target_user_id: targetUserId,
    role_key: roleKey,
  });

  if (error) {
    throw new Error(error.message);
  }
}
