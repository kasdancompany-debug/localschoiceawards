export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export function welcomeEmailTemplate(name: string): EmailTemplate {
  const subject = "Welcome to Locals Choice Awards";
  const text = `Hi ${name},\n\nWelcome to Locals Choice Awards. Your account is ready.\n\n— The Locals Choice Awards team`;
  const html = `
    <div style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.6;">
      <h1 style="font-size: 24px; margin-bottom: 8px;">Welcome to Locals Choice Awards</h1>
      <p>Hi ${name},</p>
      <p>Your account is ready. Explore your community awards and cast your votes when the season opens.</p>
      <p style="margin-top: 24px;">— The Locals Choice Awards team</p>
    </div>
  `;

  return { subject, html, text };
}
