import type { Metadata } from "next";

import { PageIntro, PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy policy for Locals Choice Awards.",
};

export default function PrivacyPage() {
  return (
    <PageShell narrow>
      <PageIntro eyebrow="Legal" title="Privacy policy" />
      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Locals Choice Awards collects account details, community participation data, and form
          submissions needed to operate awards seasons. We use this information to run nominations,
          voting, support, and communications related to the platform.
        </p>
        <p>
          We do not sell personal information. Access to administrative data is limited to authorized
          operators. Community public pages show published campaign and category information only —
          never unpublished results or private vote totals.
        </p>
        <p>
          For privacy requests, contact us through the contact form and include enough detail for us
          to locate your account or submission.
        </p>
      </div>
    </PageShell>
  );
}
