import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentCommunity } from "@/lib/communities/current";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Promotion started",
  description: "Your business promotion checkout completed.",
};

export default async function PromoteSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ promotionId?: string }>;
}) {
  const community = await getCurrentCommunity();
  const params = await searchParams;

  return (
    <PageShell>
      <PageIntro
        eyebrow={community?.name ?? "Locals Choice"}
        title="Promotion checkout complete"
        description="Stripe confirmed your session. Active promotions unlock after the subscription webhook — usually within a few seconds."
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Reference: {params.promotionId ?? "pending"}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={toRoute("/order")} className={cn(buttonVariants())}>
          Order another business
        </Link>
        <Link href={toRoute("/")} className={cn(buttonVariants({ variant: "outline" }))}>
          Back home
        </Link>
      </div>
    </PageShell>
  );
}
