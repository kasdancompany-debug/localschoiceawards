import type {
  EmailTemplateCategory,
  EmailTemplateKey,
  NotificationPreferences,
} from "@/types/notifications";

export type PreferenceGate =
  | "always"
  | "campaign_updates"
  | "business_updates"
  | "order_updates"
  | "marketing_emails"
  | "winner_sales_emails";

const TEMPLATE_GATES: Record<EmailTemplateKey, PreferenceGate> = {
  "account.verify_email": "always",
  "account.magic_link": "always",
  "account.password_reset": "always",
  "business.claim_received": "business_updates",
  "business.claim_evidence_requested": "business_updates",
  "business.claim_approved": "business_updates",
  "business.claim_rejected": "business_updates",
  "business.team_invitation": "always",
  "campaign.nomination_received": "campaign_updates",
  // Operational notice to the nominated business — always send when we have a contact email.
  "campaign.business_nominated": "always",
  "campaign.finalist_announced": "campaign_updates",
  "campaign.voting_opened": "campaign_updates",
  "campaign.voting_reminder": "campaign_updates",
  "campaign.voting_closed": "campaign_updates",
  "campaign.winner_announced": "campaign_updates",
  "commerce.cart_reminder": "marketing_emails",
  "commerce.order_received": "always",
  "commerce.payment_confirmed": "always",
  "commerce.fulfillment_accepted": "always",
  "commerce.production_started": "always",
  "commerce.order_shipped": "always",
  "commerce.delivered": "always",
  "commerce.delay": "always",
  "commerce.damaged_claim_received": "always",
  "commerce.refund_processed": "always",
  "winner.day0_congrats": "winner_sales_emails",
  "winner.day3_products": "winner_sales_emails",
  "winner.day10_reminder": "winner_sales_emails",
  "winner.day21_final": "winner_sales_emails",
};

export function preferenceGateForTemplate(templateKey: string): PreferenceGate {
  return TEMPLATE_GATES[templateKey as EmailTemplateKey] ?? "always";
}

/**
 * Transactional order/account emails may not be disabled.
 * Marketing and optional operational updates respect preferences.
 */
export function shouldSendForPreferences(input: {
  templateKey: string;
  category: EmailTemplateCategory;
  preferences: NotificationPreferences | null;
}): { ok: true } | { ok: false; reason: "preference_disabled" | "marketing_opt_out" } {
  const gate = preferenceGateForTemplate(input.templateKey);
  if (gate === "always" || input.category === "transactional") {
    return { ok: true };
  }

  const prefs = input.preferences ?? {
    id: "",
    userId: "",
    campaignUpdates: true,
    businessUpdates: true,
    orderUpdates: true,
    marketingEmails: false,
    winnerSalesEmails: false,
    updatedAt: "",
  };

  switch (gate) {
    case "campaign_updates":
      return prefs.campaignUpdates ? { ok: true } : { ok: false, reason: "preference_disabled" };
    case "business_updates":
      return prefs.businessUpdates ? { ok: true } : { ok: false, reason: "preference_disabled" };
    case "order_updates":
      return prefs.orderUpdates ? { ok: true } : { ok: false, reason: "preference_disabled" };
    case "marketing_emails":
      return prefs.marketingEmails
        ? { ok: true }
        : { ok: false, reason: "marketing_opt_out" };
    case "winner_sales_emails":
      return prefs.winnerSalesEmails && prefs.marketingEmails
        ? { ok: true }
        : { ok: false, reason: "marketing_opt_out" };
    default:
      return { ok: true };
  }
}

export function buildDedupeKey(input: {
  eventType: string;
  aggregateId: string;
  recipientEmail: string;
  sequenceKey?: string;
}): string {
  return [
    input.eventType,
    input.aggregateId,
    input.recipientEmail.trim().toLowerCase(),
    input.sequenceKey ?? "default",
  ].join(":");
}

export function nextRetryAt(attempts: number, now = new Date()): Date {
  const minutes = Math.min(60 * 12, 2 ** Math.max(0, attempts) ); // 1,2,4,... capped
  return new Date(now.getTime() + minutes * 60_000);
}

export function canRetryEvent(input: {
  attempts: number;
  maxAttempts?: number;
}): boolean {
  return input.attempts < (input.maxAttempts ?? 8);
}

export function renderSubject(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => vars[key] ?? "");
}

export function isPromotionalTemplate(templateKey: string): boolean {
  const gate = preferenceGateForTemplate(templateKey);
  return gate === "marketing_emails" || gate === "winner_sales_emails";
}

/** Scraped public directories must not receive campaigns without consent. */
export function assertCampaignRecipientAllowed(input: {
  hasMarketingConsent: boolean;
  source: "account" | "scraped_public" | "business_member" | "order_customer";
}): { ok: true } | { ok: false; reason: "no_legal_basis" } {
  if (input.source === "scraped_public") {
    return { ok: false, reason: "no_legal_basis" };
  }
  if (
    (input.source === "account" || input.source === "business_member") &&
    !input.hasMarketingConsent
  ) {
    return { ok: false, reason: "no_legal_basis" };
  }
  return { ok: true };
}

export const WINNER_SALES_SEQUENCE = [
  { day: 0, templateKey: "winner.day0_congrats" as const, delayDays: 0 },
  { day: 3, templateKey: "winner.day3_products" as const, delayDays: 3 },
  { day: 10, templateKey: "winner.day10_reminder" as const, delayDays: 10 },
  { day: 21, templateKey: "winner.day21_final" as const, delayDays: 21 },
];
