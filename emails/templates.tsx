import { Link, Text } from "@react-email/components";

import { BrandEmailLayout, emailCta, emailParagraph } from "@/emails/brand-layout";
import type { EmailTemplateKey } from "@/types/notifications";

export type EmailTemplateVars = Record<string, string>;

type TemplateDefinition = {
  title: (vars: EmailTemplateVars) => string;
  preview: (vars: EmailTemplateVars) => string;
  body: (vars: EmailTemplateVars) => string[];
  cta?: (vars: EmailTemplateVars) => { href: string; label: string } | null;
};

const SITE = "https://localschoiceawards.com";

const DEFINITIONS: Record<EmailTemplateKey, TemplateDefinition> = {
  "account.verify_email": {
    title: () => "Verify your email",
    preview: () => "Confirm your Locals Choice Awards email address",
    body: () => [
      "Thanks for joining Locals Choice Awards.",
      "Please verify your email so we can keep your nominations and votes secure.",
    ],
    cta: (v) => (v.actionUrl ? { href: v.actionUrl, label: "Verify email" } : null),
  },
  "account.magic_link": {
    title: () => "Your sign-in link",
    preview: () => "Use this link to sign in to Locals Choice Awards",
    body: () => ["Click the button below to sign in. This link expires soon for your security."],
    cta: (v) => (v.actionUrl ? { href: v.actionUrl, label: "Sign in" } : null),
  },
  "account.password_reset": {
    title: () => "Reset your password",
    preview: () => "Reset your Locals Choice Awards password",
    body: () => [
      "We received a request to reset your password.",
      "If you did not request this, you can ignore this email.",
    ],
    cta: (v) => (v.actionUrl ? { href: v.actionUrl, label: "Reset password" } : null),
  },
  "business.claim_received": {
    title: (v) => `Claim received for ${v.businessName || "your business"}`,
    preview: (v) => `We received your claim for ${v.businessName || "your business"}`,
    body: (v) => [
      `We received your claim for ${v.businessName || "your business"}.`,
      v.notes || "An admin will review it shortly.",
    ],
  },
  "business.claim_evidence_requested": {
    title: (v) => `Evidence needed for ${v.businessName || "your business"}`,
    preview: () => "Additional evidence is requested for your claim",
    body: (v) => [
      `Please provide additional evidence for ${v.businessName || "your business"}.`,
      v.notes || "Upload documents from the business portal.",
    ],
    cta: (v) => ({ href: v.actionUrl || `${SITE}/business`, label: "Open business portal" }),
  },
  "business.claim_approved": {
    title: (v) => `${v.businessName || "Business"} claim approved`,
    preview: () => "Your business claim was approved",
    body: (v) => [
      `Your claim for ${v.businessName || "your business"} was approved.`,
      "You can now manage the profile and campaign tools.",
      v.notes || "",
    ].filter(Boolean),
    cta: () => ({ href: `${SITE}/business`, label: "Manage business" }),
  },
  "business.claim_rejected": {
    title: (v) => `Update on ${v.businessName || "your"} claim`,
    preview: () => "Your business claim was not approved",
    body: (v) => [
      `Your claim for ${v.businessName || "your business"} was not approved.`,
      v.notes || "Contact support if you have questions.",
    ].filter(Boolean),
  },
  "business.team_invitation": {
    title: (v) => `Invitation to manage ${v.businessName || "a business"}`,
    preview: (v) => `You're invited to manage ${v.businessName || "a business"}`,
    body: (v) => [
      `You have been invited as ${v.role || "a team member"} for ${v.businessName || "a Locals Choice business"}.`,
      v.expiresAt ? `This invitation expires on ${v.expiresAt}.` : "",
    ].filter(Boolean),
    cta: (v) => (v.acceptUrl ? { href: v.acceptUrl, label: "Accept invitation" } : null),
  },
  "campaign.nomination_received": {
    title: () => "Nomination received",
    preview: () => "Thanks for your nomination",
    body: (v) => [
      `Thanks for nominating ${v.businessName || "a local business"}${v.categoryName ? ` in ${v.categoryName}` : ""}.`,
      "We'll notify you when voting opens in your community.",
    ],
  },
  "campaign.business_nominated": {
    title: (v) => `${v.businessName || "Your business"} was nominated`,
    preview: () => "A customer nominated your business",
    body: (v) => [
      `${v.businessName || "Your business"} received a nomination${v.categoryName ? ` for ${v.categoryName}` : ""}.`,
      "Claim or manage your profile to stay involved during the campaign.",
    ],
  },
  "campaign.finalist_announced": {
    title: (v) => `Finalists are live in ${v.communityName || "your community"}`,
    preview: () => "Finalists have been announced",
    body: (v) => [
      `Finalists are now public in ${v.communityName || "your community"}.`,
      "Share the news and prepare for voting.",
    ],
  },
  "campaign.voting_opened": {
    title: (v) => `Voting is open in ${v.communityName || "your community"}`,
    preview: () => "Cast your Locals Choice vote",
    body: (v) => [
      `Voting is open in ${v.communityName || "your community"}.`,
      "Your vote helps celebrate outstanding local businesses.",
    ],
    cta: (v) => ({ href: v.actionUrl || SITE, label: "Vote now" }),
  },
  "campaign.voting_reminder": {
    title: () => "Reminder: cast your vote",
    preview: () => "Don't miss your chance to vote",
    body: (v) => [
      `Voting closes soon in ${v.communityName || "your community"}.`,
      "It only takes a minute to support your favourites.",
    ],
    cta: (v) => ({ href: v.actionUrl || SITE, label: "Finish voting" }),
  },
  "campaign.voting_closed": {
    title: (v) => `Voting closed in ${v.communityName || "your community"}`,
    preview: () => "Voting has ended",
    body: (v) => [
      `Voting has closed in ${v.communityName || "your community"}.`,
      "Winners will be announced after the audit period.",
    ],
  },
  "campaign.winner_announced": {
    title: (v) => `Winners are live in ${v.communityName || "your community"}`,
    preview: () => "See this year's Locals Choice winners",
    body: (v) => [
      `Winners are live in ${v.communityName || "your community"}.`,
      v.businessName ? `Congratulations to ${v.businessName}!` : "Explore the results and celebrate local excellence.",
    ],
    cta: (v) => ({ href: v.actionUrl || SITE, label: "View winners" }),
  },
  "commerce.cart_reminder": {
    title: () => "Your award products are waiting",
    preview: () => "Complete your Locals Choice Awards order",
    body: () => [
      "You left personalized award products in your cart.",
      "Complete checkout to lock in your recognition pieces.",
    ],
    cta: (v) => ({ href: v.actionUrl || `${SITE}/shop`, label: "Return to cart" }),
  },
  "commerce.order_received": {
    title: (v) => `Order ${v.orderNumber || ""} received`,
    preview: (v) => `We received order ${v.orderNumber || ""}`,
    body: (v) => [
      `We received order ${v.orderNumber || ""}.`,
      "We'll confirm payment and start fulfillment shortly.",
    ],
  },
  "commerce.payment_confirmed": {
    title: (v) => `Payment confirmed for ${v.orderNumber || "your order"}`,
    preview: () => "Your payment was successful",
    body: (v) => [
      `Payment is confirmed for order ${v.orderNumber || ""}.`,
      "We'll route your order for production next.",
    ],
  },
  "commerce.fulfillment_accepted": {
    title: (v) => `Production accepted for ${v.orderNumber || "your order"}`,
    preview: () => "Your order was accepted for production",
    body: (v) => [`Order ${v.orderNumber || ""} was accepted by our production partner.`],
  },
  "commerce.production_started": {
    title: (v) => `Production started for ${v.orderNumber || "your order"}`,
    preview: () => "Your award products are in production",
    body: (v) => [`Production has started for order ${v.orderNumber || ""}.`],
  },
  "commerce.order_shipped": {
    title: (v) => `Order ${v.orderNumber || ""} has shipped`,
    preview: () => "Your order is on the way",
    body: (v) => [
      `Good news — order ${v.orderNumber || ""} is on the way.`,
      v.carrier ? `Carrier: ${v.carrier}` : "",
      v.trackingNumber ? `Tracking: ${v.trackingNumber}` : "",
    ].filter(Boolean),
    cta: (v) =>
      v.trackingUrl ? { href: v.trackingUrl, label: "Track shipment" } : null,
  },
  "commerce.delivered": {
    title: (v) => `Order ${v.orderNumber || ""} delivered`,
    preview: () => "Your order was delivered",
    body: (v) => [`Order ${v.orderNumber || ""} was marked delivered. Enjoy your award products!`],
  },
  "commerce.delay": {
    title: (v) => `Update on order ${v.orderNumber || ""}`,
    preview: () => "There is a delay on your order",
    body: (v) => [
      `We're experiencing a delay on order ${v.orderNumber || ""}.`,
      v.notes || "We'll update you as soon as we have a new timeline.",
    ],
  },
  "commerce.damaged_claim_received": {
    title: () => "Damaged-item claim received",
    preview: () => "We received your damaged-item claim",
    body: (v) => [
      `We received your damaged-item claim${v.orderNumber ? ` for order ${v.orderNumber}` : ""}.`,
      "Our team will review it and follow up shortly.",
    ],
  },
  "commerce.refund_processed": {
    title: (v) => `Refund processed for ${v.orderNumber || "your order"}`,
    preview: () => "Your refund was processed",
    body: (v) => [
      `A refund was processed for order ${v.orderNumber || ""}.`,
      "It may take several business days to appear on your statement.",
    ],
  },
  "winner.day0_congrats": {
    title: () => "Congratulations — your digital assets are ready",
    preview: () => "Celebrate your Locals Choice win",
    body: (v) => [
      `Congratulations${v.businessName ? `, ${v.businessName}` : ""}!`,
      "Your free digital award assets are ready to download and share.",
    ],
    cta: (v) => ({ href: v.actionUrl || `${SITE}/business`, label: "Download assets" }),
  },
  "winner.day3_products": {
    title: (v) => `Personalized products for ${v.businessName || "winners"}`,
    preview: () => "See personalized award products",
    body: (v) => [
      `Explore recognition products personalized for ${v.businessName || "your win"}.`,
      "Plaques, glass awards, and more — ready with your official wording.",
    ],
    cta: (v) => ({ href: v.actionUrl || `${SITE}/shop`, label: "View products" }),
  },
  "winner.day10_reminder": {
    title: () => "Recognition products reminder",
    preview: () => "Still time to order recognition products",
    body: (v) => [
      `A quick reminder for ${v.businessName || "winners"}: personalized award products are still available.`,
    ],
    cta: (v) => ({ href: v.actionUrl || `${SITE}/shop`, label: "Shop awards" }),
  },
  "winner.day21_final": {
    title: () => "Final follow-up on your win",
    preview: () => "Last chance for personalized recognition products",
    body: (v) => [
      `This is our final follow-up about recognition products for ${v.businessName || "your Locals Choice win"}.`,
      "Order soon if you'd like physical awards this season.",
    ],
    cta: (v) => ({ href: v.actionUrl || `${SITE}/shop`, label: "Order now" }),
  },
};

export function renderEmailTemplateElement(input: {
  templateKey: EmailTemplateKey | string;
  vars?: EmailTemplateVars;
  unsubscribeUrl?: string | null;
}) {
  const key = input.templateKey as EmailTemplateKey;
  const def = DEFINITIONS[key];
  const vars = input.vars ?? {};
  if (!def) {
    return (
      <BrandEmailLayout preview="Locals Choice Awards" title="Notification">
        {emailParagraph("You have a new notification from Locals Choice Awards.")}
      </BrandEmailLayout>
    );
  }

  const cta = def.cta?.(vars) ?? null;
  return (
    <BrandEmailLayout
      preview={def.preview(vars)}
      title={def.title(vars)}
      unsubscribeUrl={input.unsubscribeUrl}
    >
      {def.body(vars).map((line) => (
        <Text
          key={line}
          style={{ margin: "0 0 16px", color: "#1A1A1A", fontSize: "16px", lineHeight: "1.6" }}
        >
          {line}
        </Text>
      ))}
      {cta ? emailCta(cta.href, cta.label) : null}
      {!cta && vars.actionUrl ? (
        <Text style={{ margin: "16px 0 0", fontSize: "14px" }}>
          <Link href={vars.actionUrl}>{vars.actionUrl}</Link>
        </Text>
      ) : null}
    </BrandEmailLayout>
  );
}

export function listEmailTemplateDefinitions(): EmailTemplateKey[] {
  return Object.keys(DEFINITIONS) as EmailTemplateKey[];
}

export function getEmailTemplateDefinition(key: EmailTemplateKey): TemplateDefinition {
  return DEFINITIONS[key];
}
