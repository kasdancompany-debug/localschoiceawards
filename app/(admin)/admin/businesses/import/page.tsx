import Link from "next/link";

import { BusinessImportUploader } from "@/components/admin/business-import";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { listImportBatches } from "@/lib/businesses/import";
import { listCampaignsForCommunity } from "@/lib/campaigns/service";
import { PILOT_COMMUNITIES } from "@/lib/communities/pilot-catalog";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { toRoute } from "@/lib/routes";

export default async function AdminBusinessImportPage() {
  await requireAdminSession("/admin/businesses/import");

  let communities = PILOT_COMMUNITIES.map((community) => ({
    id: community.id,
    name: community.name,
  }));

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("communities")
      .select("id, name")
      .eq("is_public", true)
      .order("name");
    if (data?.length) {
      communities = data;
    }
  } catch {
    // Use pilot catalog.
  }

  const campaigns = (
    await Promise.all(
      communities.map(async (community) => {
        const list = await listCampaignsForCommunity(community.id);
        return list.map((campaign) => ({
          id: campaign.id,
          communityId: campaign.communityId,
          name: campaign.name,
          year: campaign.year,
        }));
      }),
    )
  ).flat();

  const batches = await listImportBatches();

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Business CSV import"
        description="Validate rows, preview duplicates, choose resolutions, then commit. Existing businesses are never silently overwritten."
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <BusinessImportUploader communities={communities} campaigns={campaigns} />
        <div>
          <h2 className="font-heading text-xl font-semibold tracking-tight">Import history</h2>
          {batches.length ? (
            <ul className="mt-4 space-y-3">
              {batches.map((batch) => (
                <li key={batch.id}>
                  <Link
                    href={toRoute(`/admin/businesses/import/${batch.id}`)}
                    className="block rounded-2xl border border-border/80 bg-card px-4 py-4"
                  >
                    <span className="font-medium">{batch.filename}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {batch.status} · {batch.row_count} rows · imported {batch.imported_count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="mt-4"
              title="No imports yet"
              description="Upload a CSV to create the first preview batch."
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
