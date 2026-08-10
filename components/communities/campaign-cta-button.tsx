import Link from "next/link";
import type { Route } from "next";

import { buttonVariants } from "@/components/ui/button";
import type { CampaignPrimaryCta } from "@/lib/campaigns/cta";
import { cn } from "@/lib/utils";

type CampaignCtaButtonProps = {
  cta: CampaignPrimaryCta;
  className?: string;
};

export function CampaignCtaButton({ cta, className }: CampaignCtaButtonProps) {
  if (cta.disabled || !cta.href) {
    return (
      <span
        className={cn(
          buttonVariants({ variant: "secondary", size: "lg" }),
          "h-12 cursor-not-allowed px-6 text-base opacity-80",
          className,
        )}
        aria-disabled="true"
      >
        {cta.label}
      </span>
    );
  }

  const isHash = cta.href.startsWith("#");
  if (isHash) {
    return (
      <a
        href={cta.href}
        className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base", className)}
      >
        {cta.label}
      </a>
    );
  }

  return (
    <Link
      href={cta.href as Route}
      className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base", className)}
    >
      {cta.label}
    </Link>
  );
}
