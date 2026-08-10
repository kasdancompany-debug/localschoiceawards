import "server-only";

import { createSupabaseAdminClient } from "@/lib/database";
import type { EmailDelivery, EmailDeliveryStatus, NotificationEvent } from "@/types/notifications";
import type { Json } from "@/types/database";

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

function mapDelivery(row: {
  id: string;
  notification_event_id: string;
  user_id: string | null;
  recipient_email: string;
  template_key: string;
  provider_message_id: string | null;
  status: EmailDeliveryStatus;
  dedupe_key: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  created_at: string;
}): EmailDelivery {
  return {
    id: row.id,
    notificationEventId: row.notification_event_id,
    userId: row.user_id,
    recipientEmail: row.recipient_email,
    templateKey: row.template_key,
    providerMessageId: row.provider_message_id,
    status: row.status,
    dedupeKey: row.dedupe_key,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at,
    openedAt: row.opened_at,
    clickedAt: row.clicked_at,
    bouncedAt: row.bounced_at,
    complainedAt: row.complained_at,
    createdAt: row.created_at,
  };
}

export async function getNotificationDashboardStats() {
  const admin = createSupabaseAdminClient();
  const statuses = ["queued", "sent", "failed", "processing", "cancelled", "skipped"] as const;
  const counts: Record<string, number> = {};
  for (const status of statuses) {
    const { count } = await admin
      .from("notification_events")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    counts[status] = count ?? 0;
  }

  const deliveryStatuses = ["sent", "delivered", "bounced", "complained", "failed", "skipped"] as const;
  const deliveryCounts: Record<string, number> = {};
  for (const status of deliveryStatuses) {
    const { count } = await admin
      .from("email_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    deliveryCounts[status] = count ?? 0;
  }

  return {
    queued: counts.queued ?? 0,
    sent: counts.sent ?? 0,
    failed: counts.failed ?? 0,
    processing: counts.processing ?? 0,
    cancelled: counts.cancelled ?? 0,
    skipped: counts.skipped ?? 0,
    bounced: deliveryCounts.bounced ?? 0,
    complaints: deliveryCounts.complained ?? 0,
    deliveriesSent: deliveryCounts.sent ?? 0,
    deliveriesDelivered: deliveryCounts.delivered ?? 0,
  };
}

export async function listNotificationEventsForAdmin(input?: {
  status?: NotificationEvent["status"];
  limit?: number;
}): Promise<NotificationEvent[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("notification_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 100);
  if (input?.status) {
    query = query.eq("status", input.status);
  }
  const { data } = await query;
  return (data ?? []).map(mapEvent);
}

export async function listEmailDeliveriesForAdmin(input?: {
  status?: EmailDeliveryStatus;
  limit?: number;
}): Promise<EmailDelivery[]> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("email_deliveries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 100);
  if (input?.status) {
    query = query.eq("status", input.status);
  }
  const { data } = await query;
  return (data ?? []).map(mapDelivery);
}

export async function listEmailTemplatesForAdmin() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("email_templates").select("*").order("key");
  return data ?? [];
}

export async function applyResendWebhookEvent(input: {
  type: string;
  createdAt?: string;
  data: {
    email_id?: string;
    to?: string[];
  };
}): Promise<{ ok: boolean; message?: string }> {
  const messageId = input.data.email_id;
  if (!messageId) return { ok: false, message: "Missing email_id." };

  const admin = createSupabaseAdminClient();
  const { data: delivery } = await admin
    .from("email_deliveries")
    .select("*")
    .eq("provider_message_id", messageId)
    .maybeSingle();

  if (!delivery) {
    return { ok: true, message: "No matching delivery." };
  }

  const now = input.createdAt ?? new Date().toISOString();
  const patch: {
    status?: EmailDeliveryStatus;
    delivered_at?: string;
    opened_at?: string;
    clicked_at?: string;
    bounced_at?: string;
    complained_at?: string;
  } = {};

  switch (input.type) {
    case "email.delivered":
      patch.status = "delivered";
      patch.delivered_at = now;
      break;
    case "email.opened":
      patch.status = "opened";
      patch.opened_at = now;
      break;
    case "email.clicked":
      patch.status = "clicked";
      patch.clicked_at = now;
      break;
    case "email.bounced":
      patch.status = "bounced";
      patch.bounced_at = now;
      break;
    case "email.complained":
      patch.status = "complained";
      patch.complained_at = now;
      break;
    default:
      return { ok: true, message: "Ignored event type." };
  }

  await admin.from("email_deliveries").update(patch).eq("id", delivery.id);
  return { ok: true };
}
