import "server-only";

import { emitNotificationEvent } from "@/lib/notifications/emit";
import { processNotificationEvent } from "@/lib/notifications/process";
import { sendRenderedNotificationEmail } from "@/lib/notifications/render";

async function enqueueAndProcess(input: Parameters<typeof emitNotificationEvent>[0]): Promise<void> {
  try {
    const result = await emitNotificationEvent(input);
    if (result.ok && result.event?.id) {
      await processNotificationEvent(result.event.id);
      return;
    }
  } catch {
    // Fall through to direct send when the notification queue is unavailable.
  }

  try {
    await sendRenderedNotificationEmail({
      to: input.recipientEmail,
      subject:
        input.templateKey === "campaign.business_nominated"
          ? `You've been nominated: ${input.subjectVars?.businessName || "Locals Choice Awards"}`
          : `Nomination received: ${input.subjectVars?.businessName || "Locals Choice Awards"}`,
      templateKey: String(input.templateKey),
      vars: {
        ...(input.subjectVars ?? {}),
        ...(input.templateVars ?? {}),
      },
      userId: input.userId,
    });
  } catch {
    // Email must not block nomination success.
  }
}

export async function sendNominationReceivedEmail(input: {
  to: string;
  userId?: string | null;
  businessName: string;
  categoryName: string;
  nominationId: string;
  communityName: string;
}): Promise<void> {
  await enqueueAndProcess({
    eventType: "campaign.nomination_received",
    aggregateType: "nomination",
    aggregateId: input.nominationId,
    templateKey: "campaign.nomination_received",
    recipientEmail: input.to,
    userId: input.userId,
    recipientSource: "account",
    subjectVars: { businessName: input.businessName },
    templateVars: {
      businessName: input.businessName,
      categoryName: input.categoryName,
      communityName: input.communityName,
    },
  });
}

export async function sendBusinessNominatedEmail(input: {
  to: string;
  businessName: string;
  categoryName: string;
  nominationId: string;
  communityName: string;
  claimUrl?: string;
}): Promise<void> {
  await enqueueAndProcess({
    eventType: "campaign.business_nominated",
    aggregateType: "nomination",
    aggregateId: `${input.nominationId}:business`,
    templateKey: "campaign.business_nominated",
    recipientEmail: input.to,
    userId: null,
    // Nominator-supplied or claimed business contact — operational notice, not marketing.
    recipientSource: "order_customer",
    subjectVars: { businessName: input.businessName },
    templateVars: {
      businessName: input.businessName,
      categoryName: input.categoryName,
      communityName: input.communityName,
      actionUrl: input.claimUrl ?? "",
    },
    dedupeKey: `campaign.business_nominated:${input.nominationId}:${input.to.trim().toLowerCase()}`,
  });
}
