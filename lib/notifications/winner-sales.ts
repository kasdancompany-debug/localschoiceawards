import "server-only";

import { createSupabaseAdminClient } from "@/lib/database";
import { softEmitNotificationEvent } from "@/lib/notifications/emit";
import { WINNER_SALES_SEQUENCE } from "@/lib/notifications/rules";

/**
 * Schedule winner sales sequence. Only emits when consent flags allow —
 * processor also re-checks preferences at send time.
 */
export async function enqueueWinnerSalesSequence(input: {
  businessId: string;
  businessName: string;
  recipientEmail: string;
  userId: string;
  hasMarketingConsent: boolean;
  hasWinnerSalesConsent: boolean;
  communityName?: string;
  startedAt?: Date;
}): Promise<void> {
  if (!input.hasMarketingConsent || !input.hasWinnerSalesConsent) {
    return;
  }

  const start = input.startedAt ?? new Date();
  for (const step of WINNER_SALES_SEQUENCE) {
    const availableAt = new Date(start.getTime() + step.delayDays * 24 * 60 * 60 * 1000);
    await softEmitNotificationEvent({
      eventType: `winner.sales.day${step.day}`,
      aggregateType: "business",
      aggregateId: input.businessId,
      templateKey: step.templateKey,
      recipientEmail: input.recipientEmail,
      userId: input.userId,
      recipientSource: "business_member",
      availableAt,
      sequenceKey: `winner-sales-day${step.day}`,
      subjectVars: {
        businessName: input.businessName,
        communityName: input.communityName ?? "",
      },
      templateVars: {
        businessName: input.businessName,
        communityName: input.communityName ?? "",
        day: String(step.day),
      },
      extraPayload: { winnerSalesSequence: true, day: step.day },
    });
  }
}

/** Stop remaining winner sales reminders when an order is placed. */
export async function cancelWinnerSalesSequenceForUser(input: {
  userId: string;
  businessId?: string;
}): Promise<number> {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("notification_events")
    .select("id, payload, status")
    .eq("status", "queued")
    .like("event_type", "winner.sales.%");

  if (input.businessId) {
    query = query.eq("aggregate_id", input.businessId);
  }

  const { data } = await query.limit(500);
  const ids =
    data
      ?.filter((row) => {
        const payload = row.payload as { userId?: string | null };
        return payload?.userId === input.userId;
      })
      .map((row) => row.id) ?? [];

  if (!ids.length) return 0;

  await admin
    .from("notification_events")
    .update({
      status: "cancelled",
      processed_at: new Date().toISOString(),
      last_error: "Cancelled: order placed",
    })
    .in("id", ids);

  return ids.length;
}
