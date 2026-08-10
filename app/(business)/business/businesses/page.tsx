import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listMembershipsForUser } from "@/lib/businesses/memberships";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function BusinessesListPage() {
  const session = await requireUser({ next: "/businesses" });
  const memberships = await listMembershipsForUser(session.userId);

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow="Directory"
          title="Your businesses"
          description="One account can manage multiple businesses. You only see businesses you belong to."
        />
        <Link
          href={toRoute("/claims/new")}
          className={cn(buttonVariants({ size: "lg" }), "h-12 px-5")}
        >
          Claim a business
        </Link>
      </div>

      <div className="mt-10">
        {memberships.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {memberships.map((membership) => (
              <li key={membership.id}>
                <Link
                  href={toRoute(`/businesses/${membership.businessId}`)}
                  className="block rounded-2xl border border-border/80 bg-card px-5 py-5 transition hover:border-primary/30"
                >
                  <span className="font-heading text-lg font-semibold">
                    {membership.businessName}
                  </span>
                  <span className="mt-2 block text-sm capitalize text-muted-foreground">
                    Role: {membership.role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No businesses yet"
            description="Approved claims create ownership memberships here."
          />
        )}
      </div>
    </PageShell>
  );
}
