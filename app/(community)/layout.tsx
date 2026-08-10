import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { CommunityUnavailable } from "@/components/communities/community-unavailable";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  COMMUNITY_SUBDOMAIN_HEADER,
  getCurrentCommunity,
} from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
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

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/categories", label: "Categories" },
    { href: "/search", label: "Search" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/rules", label: "Rules" },
    { href: "/winners", label: "Winners" },
  ];

  return (
    <>
      <SiteHeader
        brandHref="/"
        brandLabel={community.name}
        brandEyebrow="Locals Choice Awards"
        navItems={navItems}
        cta={{ href: "/categories", label: "Browse categories" }}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        brandLabel={`${community.name} Locals Choice Awards`}
        description={`Celebrating the businesses ${community.name} loves.`}
        linkGroups={[
          {
            title: "This community",
            links: [
              { href: "/", label: "Home" },
              { href: "/categories", label: "Categories" },
              { href: "/winners", label: "Winners" },
              { href: "/rules", label: "Rules" },
            ],
          },
          {
            title: "Platform",
            links: [
              { href: "/how-it-works", label: "How it works" },
              { href: `${centralSiteUrl}/communities`, label: "All communities" },
            ],
          },
        ]}
      />
    </>
  );
}
