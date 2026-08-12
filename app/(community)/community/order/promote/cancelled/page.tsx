import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentCommunity } from "@/lib/communities/current";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Promotion cancelled",
  description: "Promotion checkout was cancelled.",
};

export default async function PromoteCancelledPage() {
  const community = await getCurrentCommunity();

  return (
    <PageShell>
      <PageIntro
        eyebrow={community?.name ?? "Locals Choice"}
        title="Promotion checkout cancelled"
        description="No charge was completed. You can restart promotion anytime from the business order page."
      />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={toRoute("/order")} className={cn(buttonVariants())}>
          Search businesses
        </Link>
        <Link href={toRoute("/")} className={cn(buttonVariants({ variant: "outline" }))}>
          Back home
        </Link>
      </div>
    </PageShell>
  );
}
