/**
 * Deterministic test-data builders. Prefer these over ad-hoc object literals
 * so integration/e2e setup stays consistent and easy to clean up.
 */

let seq = 0;

export function resetFactorySequence(next = 0): void {
  seq = next;
}

function nextSeq(): number {
  seq += 1;
  return seq;
}

export function factoryId(_prefix = "id"): string {
  const n = nextSeq().toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${n.slice(-12)}`;
}

export function buildTestUser(overrides?: Partial<{ id: string; email: string }>) {
  const id = overrides?.id ?? factoryId("user");
  return {
    id,
    email: overrides?.email ?? `user-${id.slice(-6)}@example.test`,
  };
}

export function buildTestCommunity(
  overrides?: Partial<{
    id: string;
    name: string;
    subdomain: string;
    marketStatus: string;
    isPublic: boolean;
  }>,
) {
  const id = overrides?.id ?? factoryId("community");
  const subdomain = overrides?.subdomain ?? `city${id.slice(-4)}`;
  return {
    id,
    name: overrides?.name ?? `Test City ${id.slice(-4)}`,
    displayName: overrides?.name ?? `Test City ${id.slice(-4)}`,
    subdomain,
    slug: subdomain,
    marketStatus: overrides?.marketStatus ?? "nominations",
    isPublic: overrides?.isPublic ?? true,
    timezone: "America/Toronto",
  };
}

export function buildTestBusiness(
  overrides?: Partial<{ id: string; publicName: string; status: string }>,
) {
  const id = overrides?.id ?? factoryId("business");
  return {
    id,
    publicName: overrides?.publicName ?? `Biz ${id.slice(-4)}`,
    status: overrides?.status ?? "approved",
  };
}

export function buildTestOrder(
  overrides?: Partial<{
    id: string;
    orderNumber: string;
    totalCents: number;
    paymentStatus: string;
    userId: string | null;
    businessId: string | null;
  }>,
) {
  const id = overrides?.id ?? factoryId("order");
  return {
    id,
    orderNumber: overrides?.orderNumber ?? `LCA-TEST-${id.slice(-6).toUpperCase()}`,
    totalCents: overrides?.totalCents ?? 15900,
    paymentStatus: overrides?.paymentStatus ?? "unpaid",
    userId: overrides?.userId ?? null,
    businessId: overrides?.businessId ?? null,
    currencyCode: "CAD" as const,
  };
}

export function buildTestWebhookEvent(
  overrides?: Partial<{
    id: string;
    providerEventId: string;
    processingStatus: "received" | "processing" | "processed" | "ignored" | "failed";
    lastAttemptAt: string | null;
    receivedAt: string;
  }>,
) {
  return {
    id: overrides?.id ?? factoryId("webhook"),
    providerEventId: overrides?.providerEventId ?? `evt_test_${nextSeq()}`,
    processingStatus: overrides?.processingStatus ?? "processing",
    lastAttemptAt: overrides?.lastAttemptAt ?? new Date().toISOString(),
    receivedAt: overrides?.receivedAt ?? new Date().toISOString(),
    attempts: 1,
  };
}

/** Marker used by cleanup helpers to identify disposable rows. */
export const TEST_DATA_MARKER = "lca_test_factory";
