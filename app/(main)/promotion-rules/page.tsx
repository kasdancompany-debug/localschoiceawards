import type { Metadata } from "next";

import { PageIntro, PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Promotion rules",
  description: "General promotion rules for Locals Choice Awards community seasons.",
};

export default function PromotionRulesPage() {
  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="Legal"
        title="Promotion rules"
        description="General rules for Locals Choice Awards seasons. Individual communities may publish additional local rules."
      />
      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Eligibility, nomination windows, voting periods, and winner publication follow each
          community campaign schedule. Exact vote totals are not shown publicly unless a campaign
          explicitly enables that setting after results publish.
        </p>
        <p>
          One person should participate under their own identity. Attempts to manipulate nominations
          or votes may result in disqualification. Businesses may encourage fair participation but
          must not buy or coerce votes.
        </p>
        <p>
          Decisions about finalists, audits, and published winners are made by authorized campaign
          operators according to the season process. Void where prohibited.
        </p>
      </div>
    </PageShell>
  );
}
