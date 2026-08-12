import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FooterLink = {
  href: Route | string;
  label: string;
};

type SiteFooterProps = {
  className?: string;
  brandLabel?: string;
  description?: string;
  linkGroups?: Array<{
    title: string;
    links: FooterLink[];
  }>;
};

const defaultGroups: SiteFooterProps["linkGroups"] = [
  {
    title: "Explore",
    links: [
      { href: "/communities", label: "Communities" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/partners", label: "Partners" },
      { href: "/launch-a-community", label: "Launch a community" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/promotion-rules", label: "Promotion rules" },
    ],
  },
];

function FooterAnchor({ href, children }: { href: string; children: ReactNode }) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        className="text-sm tracking-wide text-primary-foreground/65 transition-colors hover:text-brass"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href as Route}
      className="text-sm tracking-wide text-primary-foreground/65 transition-colors hover:text-brass"
    >
      {children}
    </Link>
  );
}

export function SiteFooter({
  className,
  brandLabel = "Locals Choice Awards",
  description = "Celebrating the businesses communities love across Canada and the United States.",
  linkGroups = defaultGroups,
}: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("mt-auto bg-ink text-primary-foreground", className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-semibold tracking-[0.06em] uppercase">
            {brandLabel}
          </p>
          <p className="font-editorial mt-4 max-w-sm text-base leading-relaxed text-primary-foreground/65 italic">
            {description}
          </p>
        </div>
        {linkGroups?.map((group) => (
          <div key={group.title}>
            <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-brass uppercase">
              {group.title}
            </p>
            <ul className="mt-5 space-y-3">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.href}`}>
                  <FooterAnchor href={link.href}>{link.label}</FooterAnchor>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[0.7rem] tracking-[0.14em] text-primary-foreground/45 uppercase sm:px-6">
          © {year} Locals Choice Awards
        </p>
      </div>
    </footer>
  );
}
