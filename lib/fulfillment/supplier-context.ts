import "server-only";

import { requireSupplierSession } from "@/lib/auth/session";
import { getSupplierIdsForUser } from "@/lib/fulfillment/service";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { mapSupplier } from "@/lib/fulfillment/mappers";
import type { Supplier } from "@/types/fulfillment";
import { hasAnyPlatformRole } from "@/lib/auth/profile";
import { SUPPLIER_PLATFORM_ROLES } from "@/types/user";

export async function resolveSupplierContext(): Promise<{
  session: Awaited<ReturnType<typeof requireSupplierSession>>;
  suppliers: Supplier[];
  primarySupplierId: string | null;
  isPlatformOperator: boolean;
}> {
  const session = await requireSupplierSession("/supplier");
  const isPlatformOperator = hasAnyPlatformRole(session.roles, SUPPLIER_PLATFORM_ROLES);
  const membershipIds = await getSupplierIdsForUser(session.userId);
  const admin = createSupabaseAdminClient();

  let suppliers: Supplier[] = [];
  if (membershipIds.length) {
    const { data } = await admin.from("suppliers").select("*").in("id", membershipIds);
    suppliers = (data ?? []).map(mapSupplier);
  } else if (isPlatformOperator) {
    const { data } = await admin.from("suppliers").select("*").eq("active", true).order("name");
    suppliers = (data ?? []).map(mapSupplier);
  }

  return {
    session,
    suppliers,
    primarySupplierId: suppliers[0]?.id ?? null,
    isPlatformOperator,
  };
}
