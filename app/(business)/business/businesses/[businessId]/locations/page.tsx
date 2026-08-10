import { notFound } from "next/navigation";

import { BusinessSectionNav } from "@/components/businesses/business-section-nav";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";

type Props = { params: Promise<{ businessId: string }> };

export default async function BusinessLocationsPage({ params }: Props) {
  const session = await requireUser({ next: "/businesses" });
  const { businessId } = await params;
  try {
    await requireBusinessMembership(businessId, session.userId, { locations: true });
  } catch {
    notFound();
  }

  const business = await getManagedBusiness(businessId);
  if (!business) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: locations } = await supabase
    .from("business_locations")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("location_name");

  return (
    <PageShell>
      <BusinessSectionNav businessId={businessId} current="locations" />
      <PageIntro
        eyebrow="Locations"
        title={`${business.public_name} locations`}
        description="Hours and location details can be updated by managers and above."
      />
      <div className="mt-8 space-y-4">
        {(locations ?? []).length ? (
          (locations ?? []).map((location) => (
            <div key={location.id} className="rounded-2xl border border-border/80 bg-card px-5 py-4">
              <p className="font-medium">{location.location_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {location.service_area_business
                  ? "Service area business"
                  : [location.address_line_1, location.city].filter(Boolean).join(", ")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Location ID: {location.id}</p>
            </div>
          ))
        ) : (
          <EmptyState title="No locations" description="Locations appear after directory import or setup." />
        )}
      </div>
    </PageShell>
  );
}
