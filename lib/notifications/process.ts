import "server-only";

import { createSupabaseAdminClient } from "@/lib/database";
import { sendRenderedNotificationEmail } from "@/lib/notifications/render";
import { resolvePreferencesForRecipient } from "@/lib/notifications/preferences";
import {
  assertCampaignRecipientAllowed,
  buildDedupeKey,
  canRetryEvent,
  isPromotionalTemplate,
  nextRetryAt,
  renderSubject,
  shouldSendForPreferences,
} from "@/lib/notifications/rules";
import type { EmailTemplateCategory, NotificationEvent } from "@/types/notifications";
import type { Json } from "@/types/database";

type EventPayload = {
  templateKey?: string;
  recipientEmail?: string;
  userId?: string | null;
  subjectVars?: Record<string, string>;
  templateVars?: Record<string, string>;
  recipientSource?: "account" | "scraped_public" | "business_member" | "order_customer" | "supplier";
};

function asPayload(value: Json): EventPayload {
  return (value ?? {}) as EventPayload;
}

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

async function markSkipped(eventId: string, reason: string) {
  const admin = createSupabaseAdminClient();
  await admin
    .from("notification_events")
    .update({
      status: "skipped",
      processed_at: new Date().toISOString(),
      last_error: reason,
    })
    .eq("id", eventId);
}

async function markFailedForRetry(event: NotificationEvent, errorMessage: string) {
  const admin = createSupabaseAdminClient();
  const attempts = event.attempts + 1;
  if (!canRetryEvent({ attempts })) {
    await admin
      .from("notification_events")
      .update({
        status: "failed",
        attempts,
        processed_at: new Date().toISOString(),
        last_error: errorMessage,
      })
      .eq("id", event.id);
    return;
  }
  await admin
    .from("notification_events")
    .update({
      status: "queued",
      attempts,
      available_at: nextRetryAt(attempts).toISOString(),
      last_error: errorMessage,
    })
    .eq("id", event.id);
}

export async function processNotificationEvent(eventId: string): Promise<{
  ok: boolean;
  status: string;
  message?: string;
}> {
  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("notification_events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (!row) return { ok: false, status: "missing", message: "Event not found." };
  if (row.status === "cancelled" || row.status === "sent" || row.status === "skipped") {
    return { ok: true, status: row.status };
  }

  const claimed = await admin
    .from("notification_events")
    .update({ status: "processing" })
    .eq("id", eventId)
    .in("status", ["queued", "failed"])
    .select("*")
    .maybeSingle();

  if (!claimed.data) {
    return { ok: true, status: "busy" };
  }

  const event = mapEvent(claimed.data);
  const payload = asPayload(claimed.data.payload);
  const templateKey = payload.templateKey;
  const recipientEmail = payload.recipientEmail?.trim().toLowerCase();

  if (!templateKey || !recipientEmail) {
    await markSkipped(event.id, "Missing templateKey or recipientEmail in payload.");
    return { ok: true, status: "skipped", message: "Invalid payload." };
  }

  const { data: template } = await admin
    .from("email_templates")
    .select("*")
    .eq("key", templateKey)
    .maybeSingle();

  if (!template || !template.active) {
    await markSkipped(event.id, "Template missing or inactive.");
    return { ok: true, status: "skipped", message: "Template inactive." };
  }

  const preferences = await resolvePreferencesForRecipient({ userId: payload.userId });
  const recipientSource = payload.recipientSource ?? "account";

  if (isPromotionalTemplate(templateKey) || template.category === "marketing") {
    const allowed = assertCampaignRecipientAllowed({
      hasMarketingConsent: preferences.marketingEmails,
      source: recipientSource === "supplier" ? "account" : recipientSource,
    });
    if (!allowed.ok) {
      await markSkipped(event.id, "No legal basis / scraped public email blocked.");
      await admin.from("email_deliveries").insert({
        notification_event_id: event.id,
        user_id: payload.userId ?? null,
        recipient_email: recipientEmail,
        template_key: templateKey,
        status: "skipped",
        dedupe_key: null,
      });
      return { ok: true, status: "skipped", message: "Blocked without consent/legal basis." };
    }
  }

  const prefCheck = shouldSendForPreferences({
    templateKey,
    category: template.category as EmailTemplateCategory,
    preferences,
  });
  if (!prefCheck.ok) {
    await markSkipped(event.id, `Preference: ${prefCheck.reason}`);
    await admin.from("email_deliveries").insert({
      notification_event_id: event.id,
      user_id: payload.userId ?? null,
      recipient_email: recipientEmail,
      template_key: templateKey,
      status: "skipped",
      dedupe_key: null,
    });
    return { ok: true, status: "skipped", message: prefCheck.reason };
  }

  const deliveryDedupe = buildDedupeKey({
    eventType: event.eventType,
    aggregateId: event.aggregateId,
    recipientEmail,
    sequenceKey: templateKey,
  });

  const { data: existingDelivery } = await admin
    .from("email_deliveries")
    .select("id, status")
    .eq("dedupe_key", deliveryDedupe)
    .maybeSingle();

  if (existingDelivery && existingDelivery.status !== "failed" && existingDelivery.status !== "skipped") {
    await admin
      .from("notification_events")
      .update({
        status: "sent",
        processed_at: new Date().toISOString(),
        last_error: "Duplicate delivery prevented",
      })
      .eq("id", event.id);
    return { ok: true, status: "sent", message: "Duplicate suppressed." };
  }

  const subject = renderSubject(template.subject_template, {
    ...(payload.subjectVars ?? {}),
    ...(payload.templateVars ?? {}),
  });

  try {
    const result = await sendRenderedNotificationEmail({
      to: recipientEmail,
      subject,
      templateKey,
      vars: { ...(payload.subjectVars ?? {}), ...(payload.templateVars ?? {}) },
      userId: payload.userId,
    });

    if (result.error) {
      await markFailedForRetry(event, result.error.message);
      await admin.from("email_deliveries").insert({
        notification_event_id: event.id,
        user_id: payload.userId ?? null,
        recipient_email: recipientEmail,
        template_key: templateKey,
        status: "failed",
        dedupe_key: null,
      });
      return { ok: false, status: "failed", message: result.error.message };
    }

    const providerMessageId = result.data?.id ?? null;
    const { error: deliveryError } = await admin.from("email_deliveries").insert({
      notification_event_id: event.id,
      user_id: payload.userId ?? null,
      recipient_email: recipientEmail,
      template_key: templateKey,
      provider_message_id: providerMessageId,
      status: "sent",
      dedupe_key: deliveryDedupe,
      sent_at: new Date().toISOString(),
    });

    if (deliveryError?.code === "23505") {
      await admin
        .from("notification_events")
        .update({
          status: "sent",
          processed_at: new Date().toISOString(),
          last_error: "Duplicate delivery prevented on insert",
        })
        .eq("id", event.id);
      return { ok: true, status: "sent", message: "Duplicate suppressed." };
    }

    await admin
      .from("notification_events")
      .update({
        status: "sent",
        attempts: event.attempts + 1,
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", event.id);

    return { ok: true, status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    await markFailedForRetry(event, message);
    return { ok: false, status: "failed", message };
  }
}

export async function processQueuedNotificationEvents(limit = 25): Promise<{
  processed: number;
  results: Array<{ id: string; status: string; message?: string }>;
}> {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("notification_events")
    .select("id")
    .in("status", ["queued", "failed"])
    .lte("available_at", now)
    .order("available_at", { ascending: true })
    .limit(limit);

  const results: Array<{ id: string; status: string; message?: string }> = [];
  for (const row of data ?? []) {
    const result = await processNotificationEvent(row.id);
    results.push({ id: row.id, status: result.status, message: result.message });
  }
  return { processed: results.length, results };
}

export async function retryNotificationEvent(eventId: string): Promise<{ ok: boolean; message?: string }> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("notification_events")
    .update({
      status: "queued",
      available_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", eventId)
    .in("status", ["failed", "skipped"])
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Unable to retry event." };
  }
  return { ok: true };
}
