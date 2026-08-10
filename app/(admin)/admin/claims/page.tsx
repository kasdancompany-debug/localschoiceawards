import { ClaimReviewForm } from "@/components/admin/claim-review-form";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { listClaimsForAdmin } from "@/lib/businesses/memberships";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";

export default async function AdminClaimsPage() {
  await requireAdminSession("/admin/claims");
  const claims = await listClaimsForAdmin();

  const supabase = await createSupabaseServerClient();
  const businessIds = [...new Set(claims.map((claim) => claim.businessId))];
  const { data: businesses } = businessIds.length
    ? await supabase.from("businesses").select("id, public_name").in("id", businessIds)
    : { data: [] };
  const nameById = new Map((businesses ?? []).map((row) => [row.id, row.public_name]));

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Business claim review"
        description="Domain-email matches never auto-approve. Review evidence and approve or reject with notes. Every status change is recorded and emailed."
      />

      <div className="mt-10 space-y-6">
        {claims.length ? (
          claims.map((claim) => (
            <article
              key={claim.id}
              className="grid gap-4 rounded-3xl border border-border/80 bg-card p-5 lg:grid-cols-[1.2fr_1fr]"
            >
              <div className="space-y-2 text-sm">
                <h2 className="font-heading text-xl font-semibold">
                  {nameById.get(claim.businessId) ?? claim.businessId}
                </h2>
                <p>
                  Status: <span className="font-medium">{claim.status}</span>
                </p>
                <p>Method: {claim.verificationMethod}</p>
                <p>Email: {claim.submittedEmail}</p>
                <p>Domain matched: {claim.domainEmailMatched ? "yes" : "no"}</p>
                <p>Requested: {new Date(claim.requestedAt).toLocaleString()}</p>
                <p>Expires: {new Date(claim.expiresAt).toLocaleString()}</p>
                {claim.evidenceStoragePath ? (
                  <p>Evidence path: {claim.evidenceStoragePath}</p>
                ) : null}
                {claim.reviewerNotes ? <p>Notes: {claim.reviewerNotes}</p> : null}
              </div>
              <ClaimReviewForm claimId={claim.id} />
            </article>
          ))
        ) : (
          <EmptyState
            title="No claims yet"
            description="Submitted claims from the business portal appear here for review."
          />
        )}
      </div>
    </PageShell>
  );
}
