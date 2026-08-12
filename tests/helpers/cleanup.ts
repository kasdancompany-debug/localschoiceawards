/**
 * Safe cleanup helpers for disposable test data.
 * Only deletes rows tagged with TEST_DATA_MARKER / known test email domains.
 */

import { TEST_DATA_MARKER } from "@/tests/factories";

export type CleanupClient = {
  from: (table: string) => {
    delete: () => {
      like: (column: string, pattern: string) => Promise<{ error: { message: string } | null }>;
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
      in: (column: string, values: string[]) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export function isSafeTestEmail(email: string): boolean {
  return email.endsWith("@example.test") || email.endsWith("@localschoice.test");
}

export function assertSafeTestCleanupTarget(input: {
  emails?: string[];
  ids?: string[];
}): void {
  for (const email of input.emails ?? []) {
    if (!isSafeTestEmail(email)) {
      throw new Error(`Refusing to clean non-test email: ${email}`);
    }
  }
  for (const id of input.ids ?? []) {
    // Factory IDs use the fixed UUID prefix 00000000-0000-4000-8000-
    if (!id.startsWith("00000000-0000-4000-8000-")) {
      throw new Error(`Refusing to clean non-factory id: ${id}`);
    }
  }
}

/**
 * Best-effort cleanup when an admin client is available.
 * No-ops when client is null (unit environments without DB).
 */
export async function cleanupFactoryArtifacts(input: {
  admin: CleanupClient | null;
  orderNumbers?: string[];
  emails?: string[];
  ids?: string[];
}): Promise<{ cleaned: boolean; reason?: string }> {
  if (!input.admin) {
    return { cleaned: false, reason: "no_admin_client" };
  }

  assertSafeTestCleanupTarget({ emails: input.emails, ids: input.ids });

  if (input.orderNumbers?.length) {
    for (const orderNumber of input.orderNumbers) {
      if (!orderNumber.startsWith("LCA-TEST-")) {
        throw new Error(`Refusing to delete non-test order: ${orderNumber}`);
      }
    }
    await input.admin.from("orders").delete().in("order_number", input.orderNumbers);
  }

  // Marker reserved for future tagged rows (metadata / notes columns).
  void TEST_DATA_MARKER;

  return { cleaned: true };
}
