import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { AdminRemakeForm } from "@/components/admin/remake-form";
import { requireAdminSession } from "@/lib/auth/session";
import { listFulfillmentsForAdmin } from "@/lib/fulfillment/service";

export default async function AdminRemakesPage() {
  await requireAdminSession("/admin/remakes");
  const remakes = await listFulfillmentsForAdmin();
  const items = remakes.filter(
    (item) =>
      item.parentFulfillmentId ||
      item.status === "remake_requested" ||
      item.status === "remake_in_progress",
  );

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin"
        title="Remakes"
        description="Damaged-item remake workflow. Creates a new idempotent fulfillment linked to the parent without restoring revoked award eligibility."
      />
      <div className="mt-10 space-y-6">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="space-y-2 border-b border-border/70 pb-4 text-sm">
              <p className="font-medium">{item.supplierOrderReference}</p>
              <p className="text-muted-foreground">
                {item.status} · {item.remakeReason || "No reason listed"}
              </p>
              <AdminRemakeForm fulfillmentId={item.parentFulfillmentId ?? item.id} />
            </article>
          ))
        ) : (
          <EmptyState title="No remakes" description="Request remakes from the fulfillment queue." />
        )}
      </div>
    </PageShell>
  );
}
