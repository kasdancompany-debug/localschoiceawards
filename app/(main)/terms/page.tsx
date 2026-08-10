import type { Metadata } from "next";

import { PageIntro, PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Locals Choice Awards.",
};

export default function TermsPage() {
  return (
    <PageShell narrow>
      <PageIntro eyebrow="Legal" title="Terms of use" />
      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          By using Locals Choice Awards websites and services, you agree to participate honestly,
          respect community guidelines, and avoid fraudulent nominations or votes.
        </p>
        <p>
          Community awards seasons may include additional promotion rules. When rules conflict with
          these terms, the published promotion rules for that community season control the contest
          mechanics.
        </p>
        <p>
          Platform features, schedules, and category lists may change as seasons progress. Historical
          published winners remain available for their communities.
        </p>
      </div>
    </PageShell>
  );
}
