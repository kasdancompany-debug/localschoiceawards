import { notFound } from "next/navigation";

import { BusinessProfileForm } from "@/components/businesses/business-profile-form";
import { BusinessSectionNav } from "@/components/businesses/business-section-nav";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";

type Props = { params: Promise<{ businessId: string }> };

export default async function BusinessProfilePage({ params }: Props) {
  const session = await requireUser({ next: "/businesses" });
  const { businessId } = await params;
  try {
    await requireBusinessMembership(businessId, session.userId, { edit: true });
  } catch {
    notFound();
  }

  const business = await getManagedBusiness(businessId);
  if (!business) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: social } = await supabase
    .from("business_social_links")
    .select("platform, url")
    .eq("business_id", businessId);

  return (
    <PageShell>
      <BusinessSectionNav businessId={businessId} current="profile" />
      <PageIntro
        eyebrow="Profile"
        title={business.public_name}
        description="Edit public details. All changes are validated on the server."
      />
      <div className="mt-8">
        <BusinessProfileForm
          businessId={businessId}
          publicName={business.public_name}
          description={business.description}
          websiteUrl={business.website_url}
          primaryPhone={business.primary_phone}
          socialLinks={(social ?? []).map((row) => ({
            platform: row.platform,
            url: row.url,
          }))}
        />
      </div>
    </PageShell>
  );
}
