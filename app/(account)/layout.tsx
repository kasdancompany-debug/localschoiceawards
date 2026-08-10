import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireUser } from "@/lib/auth/session";

type AccountLayoutProps = {
  children: ReactNode;
};

export default async function AccountLayout({ children }: AccountLayoutProps) {
  await requireUser({ next: "/account" });

  return (
    <>
      <SiteHeader
        brandHref="/account"
        brandLabel="My Account"
        navItems={[
          { href: "/account", label: "Overview" },
          { href: "/account/orders", label: "Orders" },
          { href: "/account/settings", label: "Settings" },
          { href: "/", label: "Public site" },
        ]}
      />
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end px-4 pt-4 sm:px-6">
        <SignOutButton />
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      <SiteFooter />
    </>
  );
}
