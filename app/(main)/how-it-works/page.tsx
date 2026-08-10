import type { Metadata } from "next";

import { PageIntro, PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Locals Choice Awards nomination, voting, and winners seasons work for communities across North America.",
};

const steps = [
  {
    title: "Find your community",
    body: "Search your city or town on the central site, then open the local awards homepage.",
  },
  {
    title: "Nominate favourites",
    body: "When nominations open, residents suggest the businesses and professionals they love.",
  },
  {
    title: "Vote in open categories",
    body: "During voting, cast your ballot in the categories that matter to you. Results stay private until publication.",
  },
  {
    title: "Celebrate winners",
    body: "When the season publishes, winners are listed by year so communities can revisit history anytime.",
  },
];

export default function HowItWorksPage() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="Process"
        title="How it works"
        description="A simple season for every community — nominations, voting, then published winners."
      />
      <ol className="mt-12 grid gap-6 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-3xl border border-border/80 bg-card px-6 py-8"
          >
            <p className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Step {index + 1}
            </p>
            <h2 className="font-heading mt-3 text-2xl font-semibold tracking-tight">{step.title}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
