import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "Locals Choice Awards celebrates the businesses communities love across Canada and the United States.",
};

export default function AboutPage() {
  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="About"
        title="Built for local pride"
        description="Locals Choice Awards helps communities recognize the businesses, professionals, and organizations people rely on every day."
      />
      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          We run city and region awards seasons with clear nomination, voting, and results timelines.
          Each community gets its own branded site on a dedicated subdomain, while the platform stays
          consistent and trustworthy.
        </p>
        <p>
          The experience is designed to be easy to understand: find your community, follow the season,
          nominate favourites, vote when ballots open, and celebrate winners when results publish.
        </p>
        <p>
          Exact public vote totals stay private unless a community campaign explicitly publishes them.
        </p>
      </div>
      <Link
        href={toRoute("/launch-a-community")}
        className={cn(buttonVariants({ size: "lg" }), "mt-10 inline-flex h-12 px-6")}
      >
        Launch a community
      </Link>
    </PageShell>
  );
}
