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
      <a href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href as Route}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
    <footer className={cn("mt-auto border-t border-border/80 bg-muted/50", className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-heading text-lg font-semibold tracking-tight">{brandLabel}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {linkGroups?.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold">{group.title}</p>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.href}`}>
                  <FooterAnchor href={link.href}>{link.label}</FooterAnchor>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {year} Locals Choice Awards
        </p>
      </div>
    </footer>
  );
}
