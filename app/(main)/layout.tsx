import type { ReactNode } from "react";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { toRoute } from "@/lib/routes";

export const metadata: Metadata = {
  title: {
    default: "Locals Choice Awards",
    template: "%s · Locals Choice Awards",
  },
};

type MainLayoutProps = {
  children: ReactNode;
};

const mainNav = [
  { href: toRoute("/communities"), label: "Communities" },
  { href: toRoute("/how-it-works"), label: "How it works" },
  { href: toRoute("/awards"), label: "Awards" },
  { href: toRoute("/about"), label: "About" },
  { href: toRoute("/cart"), label: "Cart" },
];

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <SiteHeader
        navItems={mainNav}
        cta={{ href: toRoute("/launch-a-community"), label: "Launch a community" }}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
