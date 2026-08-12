import Link from "next/link";
import { notFound } from "next/navigation";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";
import { toRoute } from "@/lib/routes";

type BusinessDetailProps = {
  params: Promise<{ businessId: string }>;
};

const sections = [
  { href: "analytics", label: "Analytics" },
  { href: "profile", label: "Profile" },
  { href: "locations", label: "Locations" },
  { href: "team", label: "Team" },
  { href: "campaigns", label: "Campaigns" },
  { href: "assets", label: "Assets" },
  { href: "awards", label: "Awards" },
  { href: "orders", label: "Orders" },
] as const;

export default async function BusinessDetailPage({ params }: BusinessDetailProps) {
  const session = await requireUser({ next: "/businesses" });
  const { businessId } = await params;

  try {
    await requireBusinessMembership(businessId, session.userId);
  } catch {
    notFound();
  }

  const business = await getManagedBusiness(businessId);
  if (!business) {
    notFound();
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow="Business"
        title={business.public_name}
        description={business.description || "Manage profile, locations, team, and season tools."}
      />
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Business sections">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={toRoute(`/businesses/${businessId}/${section.href}`)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent/40"
          >
            {section.label}
          </Link>
        ))}
      </nav>
    </PageShell>
  );
}
