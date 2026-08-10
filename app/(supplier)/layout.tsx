import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { requireSupplierSession } from "@/lib/auth/session";

type SupplierLayoutProps = {
  children: ReactNode;
};

export default async function SupplierLayout({ children }: SupplierLayoutProps) {
  await requireSupplierSession("/supplier");

  return (
    <>
      <SiteHeader
        brandHref="/supplier"
        brandLabel="Supplier Portal"
        navItems={[
          { href: "/supplier", label: "Dashboard" },
          { href: "/supplier/orders/new", label: "New orders" },
          { href: "/supplier/remakes", label: "Remakes" },
          { href: "/supplier/products", label: "Products" },
          { href: "/supplier/invoices", label: "Invoices" },
          { href: "/supplier/team", label: "Team" },
          { href: "/account", label: "Account" },
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
