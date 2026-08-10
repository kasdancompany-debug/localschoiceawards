import type { Metadata } from "next";

import { CommunityRequestForm } from "@/components/forms/public-forms";
import { PageIntro, PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Launch a community",
  description:
    "Request a Locals Choice Awards launch for your city or town in Canada or the United States.",
};

export default function LaunchCommunityPage() {
  return (
    <PageShell>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <PageIntro
          eyebrow="Expansion"
          title="Launch a community"
          description="Tell us where residents are ready to celebrate local favourites. We’ll review market readiness and follow up."
        />
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
          <CommunityRequestForm />
        </div>
      </div>
    </PageShell>
  );
}
