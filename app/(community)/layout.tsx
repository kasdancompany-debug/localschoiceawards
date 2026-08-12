import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { CommunityUnavailable } from "@/components/communities/community-unavailable";
import { CommunityShell } from "@/components/layout/community-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  COMMUNITY_SUBDOMAIN_HEADER,
  getCurrentCommunity,
} from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { usesPathCommunityUrls } from "@/lib/communities/path-mode";
import { env } from "@/lib/env/server";

type CommunityLayoutProps = {
  children: ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  const community = await getCurrentCommunity();
  if (!community) {
    return {
      title: "Community not available",
      robots: { index: false, follow: false },
    };
  }
  return buildCommunityMetadata(community);
}

export default async function CommunityLayout({ children }: CommunityLayoutProps) {
  const community = await getCurrentCommunity();
  const headerStore = await headers();
  const subdomainHint = headerStore.get(COMMUNITY_SUBDOMAIN_HEADER);
  const centralSiteUrl = env.NEXT_PUBLIC_APP_URL;
  const pathPrefix =
    community && usesPathCommunityUrls() ? `/c/${community.subdomain}` : "";

  const withPrefix = (path: string) => {
    if (!pathPrefix) return path;
    if (path === "/") return pathPrefix;
    return `${pathPrefix}${path}`;
  };

  if (!community) {
    return (
      <>
        <SiteHeader
          brandHref={centralSiteUrl}
          brandLabel="Locals Choice Awards"
          navItems={[{ href: centralSiteUrl, label: "Central site" }]}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          <CommunityUnavailable subdomain={subdomainHint} reason="unknown" />
        </main>
        <SiteFooter
          linkGroups={[
            {
              title: "Explore",
              links: [
                { href: centralSiteUrl, label: "Central site" },
                { href: `${centralSiteUrl}/communities`, label: "Communities" },
              ],
            },
          ]}
        />
      </>
    );
  }

  const fullNavItems = [
    { href: withPrefix("/"), label: "Home" },
    { href: withPrefix("/categories"), label: "Categories" },
    { href: withPrefix("/search"), label: "Search" },
    { href: withPrefix("/order"), label: "Order & promote" },
    { href: withPrefix("/how-it-works"), label: "How it works" },
    { href: withPrefix("/winners"), label: "Winners" },
  ];

  return (
    <CommunityShell
      brandHref={withPrefix("/")}
      brandLabel={community.name}
      brandEyebrow="Locals Choice Awards"
      fullNavItems={fullNavItems}
      orderHref={withPrefix("/order")}
      searchAnotherHref={withPrefix("/order")}
      cartHref={withPrefix("/cart")}
      homeHref={withPrefix("/")}
      centralSiteUrl={centralSiteUrl}
    >
      {children}
    </CommunityShell>
  );
}
