import type { ReactNode } from "react";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
            Locals Choice Awards
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-10 sm:px-6">{children}</main>
      <SiteFooter />
    </>
  );
}
