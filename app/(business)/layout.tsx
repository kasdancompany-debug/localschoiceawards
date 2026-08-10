import type { ReactNode } from "react";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireUser } from "@/lib/auth/session";
import { toRoute } from "@/lib/routes";

type BusinessLayoutProps = {
  children: ReactNode;
};

export default async function BusinessLayout({ children }: BusinessLayoutProps) {
  const session = await requireUser({ next: "/" });

  return (
    <>
      <SiteHeader
        brandHref={toRoute("/")}
        brandLabel="Business Portal"
        brandEyebrow="Locals Choice Awards"
        navItems={[
          { href: toRoute("/"), label: "Home" },
          { href: toRoute("/businesses"), label: "Businesses" },
          { href: toRoute("/settings"), label: "Settings" },
          { href: toRoute("/account"), label: "Account" },
        ]}
      />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-4 sm:px-6">
        <p className="text-sm text-muted-foreground">Signed in as {session.email}</p>
        <SignOutButton />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      <SiteFooter
        brandLabel="Locals Choice Awards Business"
        linkGroups={[
          {
            title: "Portal",
            links: [
              { href: "/", label: "Home" },
              { href: "/businesses", label: "Businesses" },
              { href: "/claims/new", label: "Claim a business" },
            ],
          },
        ]}
      />
      <div className="sr-only">
        <Link href={toRoute("/invitations/accept")}>Accept invitation</Link>
      </div>
    </>
  );
}
