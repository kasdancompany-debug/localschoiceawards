import { render } from "@react-email/render";
import { notFound } from "next/navigation";

import { listEmailTemplateDefinitions, renderEmailTemplateElement } from "@/emails/templates";
import { EMAIL_TEMPLATE_KEYS, type EmailTemplateKey } from "@/types/notifications";

type PreviewPageProps = {
  searchParams: Promise<{ key?: string }>;
};

const SAMPLE_VARS: Record<string, string> = {
  businessName: "Northern Lights Cafe",
  communityName: "Sault Ste. Marie",
  categoryName: "Best Cafe",
  orderNumber: "LCA-10042",
  carrier: "Canada Post",
  trackingNumber: "123456789CA",
  trackingUrl: "https://www.canadapost-postescanada.ca/",
  role: "manager",
  acceptUrl: "https://business.localschoiceawards.com/invitations/accept?token=demo",
  expiresAt: "2027-01-15",
  actionUrl: "https://localschoiceawards.com",
  notes: "Please upload a utility bill or business licence.",
  day: "3",
};

export default async function EmailPreviewPage({ searchParams }: PreviewPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const keys = listEmailTemplateDefinitions();
  const key = (params.key && EMAIL_TEMPLATE_KEYS.includes(params.key as EmailTemplateKey)
    ? params.key
    : keys[0]) as EmailTemplateKey;

  const html = await render(
    renderEmailTemplateElement({
      templateKey: key,
      vars: SAMPLE_VARS,
      unsubscribeUrl: "https://localschoiceawards.com/unsubscribe?token=preview",
    }),
  );

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Email template preview</h1>
        <p className="mt-2 text-muted-foreground">Development-only React Email previews.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {keys.map((item) => (
          <a
            key={item}
            href={`/dev/emails?key=${encodeURIComponent(item)}`}
            className={`rounded border px-2 py-1 text-xs ${item === key ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {item}
          </a>
        ))}
      </div>
      <iframe title={key} className="min-h-[720px] w-full rounded border bg-white" srcDoc={html} />
    </main>
  );
}
