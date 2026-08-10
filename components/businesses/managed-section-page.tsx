import { notFound } from "next/navigation";

import { BusinessSectionNav } from "@/components/businesses/business-section-nav";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";

type Props = {
  params: Promise<{ businessId: string }>;
  section: "campaigns" | "assets" | "awards" | "orders";
  title: string;
  description: string;
};

async function ManagedSectionPage({ params, section, title, description }: Props) {
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
      <BusinessSectionNav businessId={businessId} current={section} />
      <PageIntro eyebrow={business.public_name} title={title} description={description} />
      <div className="mt-8">
        <EmptyState
          title={`${title} coming soon`}
          description="This section is reserved for authorized business users. Nominations, media workflows, awards, and orders will expand here."
        />
      </div>
    </PageShell>
  );
}

export default ManagedSectionPage;
