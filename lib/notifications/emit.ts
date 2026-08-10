import "server-only";

import { createSupabaseAdminClient } from "@/lib/database";
import { buildDedupeKey } from "@/lib/notifications/rules";
import type { Json } from "@/types/database";
import type { EmailTemplateKey, NotificationEvent } from "@/types/notifications";

export type EmitNotificationInput = {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  templateKey: EmailTemplateKey | string;
  recipientEmail: string;
  userId?: string | null;
  subjectVars?: Record<string, string>;
  templateVars?: Record<string, string>;
  /** Where the email address came from — scraped public emails are never campaigned. */
  recipientSource?: "account" | "scraped_public" | "business_member" | "order_customer" | "supplier";
  availableAt?: Date | string;
  sequenceKey?: string;
  dedupeKey?: string | null;
  extraPayload?: Record<string, unknown>;
};

function mapEvent(row: {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload: Json;
  status: NotificationEvent["status"];
  available_at: string;
  processed_at: string | null;
  attempts: number;
  last_error: string | null;
  dedupe_key: string | null;
  created_at: string;
}): NotificationEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    status: row.status,
    availableAt: row.available_at,
    processedAt: row.processed_at,
    attempts: row.attempts,
    lastError: row.last_error,
    dedupeKey: row.dedupe_key,
    createdAt: row.created_at,
  };
}

/**
 * Enqueue a notification event. Callers must not send email from page/UI code.
 * Duplicate `dedupe_key` inserts are ignored (unique index).
 */
export async function emitNotificationEvent(
  input: EmitNotificationInput,
): Promise<{ ok: true; event: NotificationEvent | null; duplicate?: boolean } | { ok: false; message: string }> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    return { ok: false, message: "Invalid recipient email." };
  }

  const dedupeKey =
    input.dedupeKey === null
      ? null
      : (input.dedupeKey ??
        buildDedupeKey({
          eventType: input.eventType,
          aggregateId: input.aggregateId,
          recipientEmail,
          sequenceKey: input.sequenceKey,
        }));

  const availableAt =
    typeof input.availableAt === "string"
      ? input.availableAt
      : (input.availableAt ?? new Date()).toISOString();

  const payload = {
    templateKey: input.templateKey,
    recipientEmail,
    userId: input.userId ?? null,
    subjectVars: input.subjectVars ?? {},
    templateVars: input.templateVars ?? {},
    recipientSource: input.recipientSource ?? "account",
    ...(input.extraPayload ?? {}),
  };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("notification_events")
    .insert({
      event_type: input.eventType,
      aggregate_type: input.aggregateType,
      aggregate_id: input.aggregateId,
      payload,
      status: "queued",
      available_at: availableAt,
      dedupe_key: dedupeKey,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: true, event: null, duplicate: true };
    }
    return { ok: false, message: error.message };
  }

  return { ok: true, event: data ? mapEvent(data) : null };
}

export async function softEmitNotificationEvent(input: EmitNotificationInput): Promise<void> {
  try {
    await emitNotificationEvent(input);
  } catch {
    // Notification enqueue must not block primary workflows.
  }
}
