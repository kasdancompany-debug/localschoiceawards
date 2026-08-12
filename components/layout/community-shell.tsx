"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader, type SiteNavItem } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CommunityShellProps = {
  brandHref: string;
  brandLabel: string;
  brandEyebrow: string;
  fullNavItems: SiteNavItem[];
  orderHref: string;
  searchAnotherHref: string;
  cartHref: string;
  homeHref: string;
  centralSiteUrl: string;
  children: ReactNode;
};

function isCommercePath(pathname: string): boolean {
  return /(?:^|\/)(order|cart|checkout)(?:\/|$)/.test(pathname);
}

export function CommunityShell({
  brandHref,
  brandLabel,
  brandEyebrow,
  fullNavItems,
  orderHref,
  searchAnotherHref,
  cartHref,
  homeHref,
  centralSiteUrl,
  children,
}: CommunityShellProps) {
  const pathname = usePathname() || "";
  const commerce = isCommercePath(pathname);

  if (commerce) {
    return (
      <>
        <SiteHeader
          brandHref={brandHref}
          brandLabel={brandLabel}
          brandEyebrow={brandEyebrow}
          navItems={[
            { href: orderHref, label: "Promote & awards" },
            { href: searchAnotherHref, label: "Search another business" },
          ]}
        />
        <div className="border-b border-border/70 bg-muted/40">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm text-muted-foreground">
              No password needed — add awards, then pay with Stripe at the bottom.
            </p>
            <Link href={toRoute(cartHref)} className={cn(buttonVariants({ size: "sm" }))}>
              Cart & pay
            </Link>
          </div>
        </div>
        <main className="flex-1 pb-28">{children}</main>
        <footer className="border-t border-border/70 bg-background py-6 text-center text-sm text-muted-foreground">
          <Link href={toRoute(homeHref)} className="underline-offset-4 hover:underline">
            Back to {brandLabel}
          </Link>
          {" · "}
          <a href={centralSiteUrl} className="underline-offset-4 hover:underline">
            Locals Choice Awards
          </a>
        </footer>
      </>
    );
  }

  return (
    <>
      <SiteHeader
        brandHref={brandHref}
        brandLabel={brandLabel}
        brandEyebrow={brandEyebrow}
        navItems={fullNavItems}
        cta={{ href: orderHref, label: "Order awards" }}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        brandLabel={`${brandLabel} Locals Choice Awards`}
        description={`Celebrating the businesses ${brandLabel} loves.`}
        linkGroups={[
          {
            title: "This community",
            links: [
              { href: homeHref, label: "Home" },
              { href: orderHref, label: "Order & promote" },
            ],
          },
          {
            title: "Platform",
            links: [{ href: `${centralSiteUrl}/communities`, label: "All communities" }],
          },
        ]}
      />
    </>
  );
}
