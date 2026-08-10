import "server-only";

import { softEmitNotificationEvent } from "@/lib/notifications/emit";
import type { BusinessClaimStatus, BusinessMembershipRole } from "@/types/business-access";
import type { EmailTemplateKey } from "@/types/notifications";

function claimTemplateForStatus(status: BusinessClaimStatus): EmailTemplateKey {
  switch (status) {
    case "evidence_required":
      return "business.claim_evidence_requested";
    case "approved":
      return "business.claim_approved";
    case "rejected":
      return "business.claim_rejected";
    default:
      return "business.claim_received";
  }
}

export async function sendBusinessClaimStatusEmail(input: {
  to: string;
  businessName: string;
  status: BusinessClaimStatus;
  notes?: string;
  claimId?: string;
  userId?: string | null;
}): Promise<void> {
  const templateKey = claimTemplateForStatus(input.status);
  await softEmitNotificationEvent({
    eventType: `business.claim.${input.status}`,
    aggregateType: "business_claim",
    aggregateId: input.claimId ?? `${input.to}:${input.businessName}:${input.status}`,
    templateKey,
    recipientEmail: input.to,
    userId: input.userId,
    recipientSource: "business_member",
    subjectVars: { businessName: input.businessName },
    templateVars: {
      businessName: input.businessName,
      notes: input.notes ?? "",
      status: input.status,
    },
  });
}

export async function sendBusinessInvitationEmail(input: {
  to: string;
  businessName: string;
  role: BusinessMembershipRole;
  acceptUrl: string;
  expiresAt: string;
  invitationId?: string;
  invitedByUserId?: string | null;
}): Promise<void> {
  await softEmitNotificationEvent({
    eventType: "business.team_invitation",
    aggregateType: "business_invitation",
    aggregateId: input.invitationId ?? `${input.to}:${input.businessName}`,
    templateKey: "business.team_invitation",
    recipientEmail: input.to,
    userId: null,
    recipientSource: "account",
    subjectVars: { businessName: input.businessName },
    templateVars: {
      businessName: input.businessName,
      role: input.role,
      acceptUrl: input.acceptUrl,
      expiresAt: input.expiresAt,
    },
  });
}
