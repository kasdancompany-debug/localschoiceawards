export const NOTIFICATION_EVENT_STATUSES = [
  "queued",
  "processing",
  "sent",
  "failed",
  "cancelled",
  "skipped",
] as const;
export type NotificationEventStatus = (typeof NOTIFICATION_EVENT_STATUSES)[number];

export const EMAIL_TEMPLATE_CATEGORIES = [
  "transactional",
  "operational",
  "marketing",
] as const;
export type EmailTemplateCategory = (typeof EMAIL_TEMPLATE_CATEGORIES)[number];

export const EMAIL_DELIVERY_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "complained",
  "failed",
  "skipped",
] as const;
export type EmailDeliveryStatus = (typeof EMAIL_DELIVERY_STATUSES)[number];

export const EMAIL_TEMPLATE_KEYS = [
  "account.verify_email",
  "account.magic_link",
  "account.password_reset",
  "business.claim_received",
  "business.claim_evidence_requested",
  "business.claim_approved",
  "business.claim_rejected",
  "business.team_invitation",
  "campaign.nomination_received",
  "campaign.business_nominated",
  "campaign.finalist_announced",
  "campaign.voting_opened",
  "campaign.voting_reminder",
  "campaign.voting_closed",
  "campaign.winner_announced",
  "commerce.cart_reminder",
  "commerce.order_received",
  "commerce.payment_confirmed",
  "commerce.fulfillment_accepted",
  "commerce.production_started",
  "commerce.order_shipped",
  "commerce.delivered",
  "commerce.delay",
  "commerce.damaged_claim_received",
  "commerce.refund_processed",
  "winner.day0_congrats",
  "winner.day3_products",
  "winner.day10_reminder",
  "winner.day21_final",
] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type NotificationPreferences = {
  id: string;
  userId: string;
  campaignUpdates: boolean;
  businessUpdates: boolean;
  orderUpdates: boolean;
  marketingEmails: boolean;
  winnerSalesEmails: boolean;
  updatedAt: string;
};

export type NotificationEvent = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: NotificationEventStatus;
  availableAt: string;
  processedAt: string | null;
  attempts: number;
  lastError: string | null;
  dedupeKey: string | null;
  createdAt: string;
};

export type EmailDelivery = {
  id: string;
  notificationEventId: string;
  userId: string | null;
  recipientEmail: string;
  templateKey: string;
  providerMessageId: string | null;
  status: EmailDeliveryStatus;
  dedupeKey: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  createdAt: string;
};

export type EmailTemplateRecord = {
  id: string;
  key: EmailTemplateKey | string;
  name: string;
  subjectTemplate: string;
  category: EmailTemplateCategory;
  active: boolean;
};
