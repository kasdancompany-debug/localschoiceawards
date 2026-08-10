import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireAdminSession } from "@/lib/auth/session";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdminSession("/admin");

  return (
    <>
      <SiteHeader
        brandHref="/admin"
        brandLabel="Admin"
        navItems={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/orders", label: "Orders" },
          { href: "/admin/notifications", label: "Notifications" },
          { href: "/admin/fulfillment", label: "Fulfillment" },
          { href: "/admin/suppliers", label: "Suppliers" },
          { href: "/admin/claims", label: "Claims" },
          { href: "/admin/businesses/import", label: "Business import" },
          { href: "/account", label: "Account" },
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
