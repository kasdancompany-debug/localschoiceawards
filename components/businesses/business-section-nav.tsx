import Link from "next/link";

import { cn } from "@/lib/utils";
import { toRoute } from "@/lib/routes";

const sections = [
  { href: "", label: "Overview" },
  { href: "analytics", label: "Analytics" },
  { href: "profile", label: "Profile" },
  { href: "locations", label: "Locations" },
  { href: "team", label: "Team" },
  { href: "campaigns", label: "Campaigns" },
  { href: "assets", label: "Assets" },
  { href: "awards", label: "Awards" },
  { href: "orders", label: "Orders" },
] as const;

export function BusinessSectionNav({
  businessId,
  current,
}: {
  businessId: string;
  current: string;
}) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Business sections">
      {sections.map((section) => {
        const href = section.href
          ? `/businesses/${businessId}/${section.href}`
          : `/businesses/${businessId}`;
        const active = current === section.href || (current === "overview" && !section.href);
        return (
          <Link
            key={section.label}
            href={toRoute(href)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium",
              active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
