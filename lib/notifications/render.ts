import "server-only";

import { render } from "@react-email/render";

import { renderEmailTemplateElement } from "@/emails/templates";
import { sendEmail } from "@/lib/email/client";
import { isPromotionalTemplate } from "@/lib/notifications/rules";
import { unsubscribeUrl } from "@/lib/notifications/unsubscribe";
import type { EmailTemplateKey } from "@/types/notifications";

export async function renderNotificationEmail(input: {
  templateKey: string;
  vars: Record<string, string>;
  userId?: string | null;
}): Promise<{ html: string; text: string }> {
  const unsub =
    input.userId && isPromotionalTemplate(input.templateKey)
      ? unsubscribeUrl(input.userId)
      : null;
  const element = renderEmailTemplateElement({
    templateKey: input.templateKey as EmailTemplateKey,
    vars: input.vars,
    unsubscribeUrl: unsub,
  });
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}

export async function sendRenderedNotificationEmail(input: {
  to: string;
  subject: string;
  templateKey: string;
  vars: Record<string, string>;
  userId?: string | null;
}) {
  const { html, text } = await renderNotificationEmail({
    templateKey: input.templateKey,
    vars: input.vars,
    userId: input.userId,
  });
  return sendEmail({
    to: input.to,
    subject: input.subject,
    html,
    text,
  });
}
