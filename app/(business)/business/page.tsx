import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listMembershipsForUser } from "@/lib/businesses/memberships";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function BusinessPortalHomePage() {
  const session = await requireUser({ next: "/" });
  const memberships = await listMembershipsForUser(session.userId);

  return (
    <PageShell>
      <PageIntro
        eyebrow="Business portal"
        title="Manage your listings"
        description="Claim businesses, invite teammates, and keep public profiles accurate for awards seasons."
      />

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href={toRoute("/businesses")} className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}>
          Your businesses
        </Link>
        <Link
          href={toRoute("/claims/new")}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-6")}
        >
          Claim a business
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Quick access</h2>
        {memberships.length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {memberships.slice(0, 6).map((membership) => (
              <li key={membership.id}>
                <Link
                  href={toRoute(`/businesses/${membership.businessId}`)}
                  className="block rounded-2xl border border-border/80 bg-card px-5 py-4"
                >
                  <span className="font-medium">{membership.businessName}</span>
                  <span className="mt-1 block text-sm text-muted-foreground capitalize">
                    {membership.role}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted-foreground">
            You do not manage any businesses yet. Submit a claim to get started.
          </p>
        )}
      </section>
    </PageShell>
  );
}
