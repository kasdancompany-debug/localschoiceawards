"use client";

import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SiteNavItem = {
  href: Route | string;
  label: string;
};

type SiteHeaderProps = {
  brandHref?: Route | string;
  brandLabel?: string;
  brandEyebrow?: string;
  navItems: SiteNavItem[];
  cta?: SiteNavItem;
  className?: string;
};

function isAbsoluteUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function NavLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  if (isAbsoluteUrl(href)) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function SiteHeader({
  brandHref = "/",
  brandLabel = "Locals Choice Awards",
  brandEyebrow,
  navItems,
  cta,
  className,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <NavLink href={brandHref} className="min-w-0" onClick={() => setOpen(false)}>
          {brandEyebrow ? (
            <span className="block text-[0.7rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {brandEyebrow}
            </span>
          ) : null}
          <span className="font-heading block truncate text-lg font-semibold tracking-tight sm:text-xl">
            {brandLabel}
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm")}
            >
              {item.label}
            </NavLink>
          ))}
          {cta ? (
            <NavLink
              href={cta.href}
              className={cn(buttonVariants({ size: "lg" }), "ml-2 h-11 px-5 text-sm")}
            >
              {cta.label}
            </NavLink>
          ) : null}
        </nav>

        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline", size: "icon-lg" }), "lg:hidden")}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-border/70 bg-background px-4 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <NavLink
                  href={item.href}
                  className="block rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {cta ? (
              <li className="pt-2">
                <NavLink
                  href={cta.href}
                  className={cn(buttonVariants({ size: "lg" }), "h-12 w-full text-base")}
                  onClick={() => setOpen(false)}
                >
                  {cta.label}
                </NavLink>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
