import type { Metadata } from "next";
import Link from "next/link";

import { CommunitySearch } from "@/components/communities/community-search";
import { CommunityRequestForm } from "@/components/forms/public-forms";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Locals Choice Awards",
  description:
    "Celebrating the businesses communities love. Find your community awards across Canada and the United States.",
};

export default function MainHomePage() {
  return (
    <div>
      <section className="surface-tint border-b border-border/60">
        <PageShell className="pb-20 pt-16 sm:pb-28 sm:pt-24">
          <p className="font-heading text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Canada &amp; United States
          </p>
          <h1 className="font-heading mt-5 max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Locals Choice Awards
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Celebrating the businesses communities love.
          </p>
          <div className="mt-10 max-w-2xl">
            <CommunitySearch />
          </div>
        </PageShell>
      </section>

      <PageShell className="space-y-20">
        <section className="grid gap-10 md:grid-cols-3">
          {[
            {
              title: "Find your community",
              body: "Every awards season lives on its own local site — clear deadlines, categories, and winners.",
            },
            {
              title: "Nominate and vote",
              body: "Residents celebrate the places they trust. Businesses earn recognition that means something.",
            },
            {
              title: "Built for growth",
              body: "One platform for thousands of communities across Canada and the United States.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border/80 bg-card px-6 py-10 sm:px-10 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight">
                Request your community
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Don’t see your city or town yet? Tell us where Locals Choice Awards should launch
                next. We’ll follow up when a season is planned for your area.
              </p>
              <Link
                href={toRoute("/how-it-works")}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-6 h-12 px-5")}
              >
                See how it works
              </Link>
            </div>
            <CommunityRequestForm />
          </div>
        </section>
      </PageShell>
    </div>
  );
}
