import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Partner with Locals Choice Awards to support community recognition across Canada and the United States.",
};

export default function PartnersPage() {
  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="Partners"
        title="Grow with local recognition"
        description="Media groups, chambers, and sponsors help communities celebrate the businesses people trust."
      />
      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Partnerships can include season sponsorships, category underwriting, media collaboration,
          and local launch support. We keep public pages free of clutter and never invent
          testimonials.
        </p>
        <p>
          Interested in bringing Locals Choice Awards to more markets or supporting an existing
          community season? Reach out and we’ll share current opportunities.
        </p>
      </div>
      <Link
        href={toRoute("/contact")}
        className={cn(buttonVariants({ size: "lg" }), "mt-10 inline-flex h-12 px-6")}
      >
        Talk with our team
      </Link>
    </PageShell>
  );
}
