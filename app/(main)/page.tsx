import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CommunitySearch } from "@/components/communities/community-search";
import { CommunityRequestForm } from "@/components/forms/public-forms";
import { PageShell } from "@/components/layout/page-shell";
import { toRoute } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Locals Choice Awards",
  description:
    "Celebrating the businesses communities love. Find your community awards across Canada and the United States.",
};

export default function MainHomePage() {
  return (
    <div>
      <section className="relative isolate min-h-[min(94vh,56rem)] overflow-hidden bg-ink">
        <Image
          src="/images/hero-main-street.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-pan object-cover object-[68%_40%]"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(100deg,oklch(0.11_0.03_50_/_0.88)_0%,oklch(0.12_0.03_50_/_0.55)_48%,oklch(0.14_0.02_50_/_0.18)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.1_0.02_50_/_0.55)_0%,transparent_38%)]"
          aria-hidden
        />

        <PageShell className="relative flex min-h-[min(94vh,56rem)] flex-col justify-end pb-14 pt-24 sm:pb-20 sm:pt-28">
          <div className="hero-rise max-w-4xl">
            <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-brass uppercase">
              Canada · United States
            </p>
            <h1 className="font-display mt-6 text-[clamp(3.4rem,12vw,8.5rem)] leading-[0.86] font-semibold tracking-[0.02em] text-white uppercase">
              Locals
              <br />
              Choice
              <br />
              Awards
            </h1>
            <p className="font-editorial mt-7 max-w-md text-xl leading-relaxed text-white/85 italic sm:text-2xl">
              Celebrating the businesses communities love.
            </p>
          </div>

          <div className="hero-rise-delay mt-10 h-px w-full max-w-2xl hairline" aria-hidden />

          <div className="hero-rise-late mt-8 max-w-2xl border border-white/20 bg-[oklch(0.97_0.006_95)] p-4 shadow-[0_30px_80px_-36px_oklch(0.05_0.02_50)] sm:p-5">
            <CommunitySearch
              inputClassName="rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        </PageShell>
      </section>

      <section className="border-b border-border bg-background">
        <PageShell className="grid gap-0 py-0 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Find your community",
              body: "Every awards season lives on its own local site — clear deadlines, categories, and winners.",
            },
            {
              step: "02",
              title: "Nominate and vote",
              body: "Residents celebrate the places they trust. Businesses earn recognition that means something.",
            },
            {
              step: "03",
              title: "Celebrate the winners",
              body: "Published results stay with the community — recognition that lasts beyond a single season.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className={`border-border py-12 md:px-8 md:py-16 ${index > 0 ? "md:border-l" : ""} border-t md:border-t-0`}
            >
              <p className="font-display text-sm tracking-[0.2em] text-brass">{item.step}</p>
              <h2 className="font-editorial mt-4 text-3xl leading-tight font-medium tracking-tight">
                {item.title}
              </h2>
              <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </PageShell>
      </section>

      <section className="bg-ink text-primary-foreground">
        <PageShell className="grid gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-24">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-brass uppercase">
              Next launch
            </p>
            <h2 className="font-display mt-5 text-5xl leading-[0.95] font-semibold tracking-[0.03em] uppercase sm:text-6xl">
              Request
              <br />
              your
              <br />
              community
            </h2>
            <p className="font-editorial mt-6 max-w-md text-lg leading-relaxed text-primary-foreground/75 italic">
              Don’t see your city or town yet? Tell us where the next season should open.
            </p>
            <Link
              href={toRoute("/how-it-works")}
              className="mt-10 inline-flex border border-brass/70 px-5 py-3 text-[0.75rem] font-semibold tracking-[0.16em] text-brass uppercase transition-colors hover:bg-brass hover:text-ink"
            >
              See how it works
            </Link>
          </div>
          <div className="border border-white/10 bg-background p-5 text-foreground sm:p-7">
            <CommunityRequestForm />
          </div>
        </PageShell>
      </section>
    </div>
  );
}
