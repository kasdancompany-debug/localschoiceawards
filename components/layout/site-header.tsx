"use client";

import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

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

function BrandMark({ label }: { label: string }) {
  return (
    <span className="font-display block text-[1.35rem] leading-none font-semibold tracking-[0.04em] uppercase sm:text-[1.5rem]">
      {label}
    </span>
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
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const firstLink = panelRef.current?.querySelector<HTMLElement>("a[href], button");
    firstLink?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-white/10 bg-ink text-primary-foreground",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
        <NavLink
          href={brandHref}
          className="min-w-0 text-primary-foreground"
          onClick={() => setOpen(false)}
        >
          {brandEyebrow ? (
            <span className="mb-1 block text-[0.65rem] font-medium tracking-[0.22em] text-brass uppercase">
              {brandEyebrow}
            </span>
          ) : null}
          <BrandMark label={brandLabel} />
        </NavLink>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-[0.8rem] font-medium tracking-[0.12em] text-primary-foreground/75 uppercase transition-colors hover:text-brass"
            >
              {item.label}
            </NavLink>
          ))}
          {cta ? (
            <NavLink
              href={cta.href}
              className="ml-2 border border-brass/70 px-4 py-2.5 text-[0.75rem] font-semibold tracking-[0.14em] text-brass uppercase transition-colors hover:bg-brass hover:text-ink"
            >
              {cta.label}
            </NavLink>
          ) : null}
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-lg" }),
            "border-white/25 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground lg:hidden",
          )}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </div>

      {open ? (
        <nav
          ref={panelRef}
          id={menuId}
          className="border-t border-white/10 bg-ink px-4 py-4 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <NavLink
                  href={item.href}
                  className="block px-2 py-3 text-sm font-medium tracking-[0.12em] text-primary-foreground/85 uppercase hover:text-brass"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {cta ? (
              <li className="pt-3">
                <NavLink
                  href={cta.href}
                  className="block border border-brass/70 px-4 py-3 text-center text-sm font-semibold tracking-[0.14em] text-brass uppercase"
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
