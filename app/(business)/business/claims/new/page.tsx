import { ClaimBusinessForm } from "@/components/businesses/claim-business-form";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";

type Props = {
  searchParams: Promise<{ businessId?: string }>;
};

export default async function ClaimBusinessPage({ searchParams }: Props) {
  const session = await requireUser({ next: "/claims/new" });
  const params = await searchParams;

  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <PageIntro
          eyebrow="Claims"
          title="Claim a business"
          description="Matching a business-domain email helps reviewers, but never auto-approves. Manual evidence and admin review are required."
        />
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
          <ClaimBusinessForm
            businessId={params.businessId}
            defaultEmail={session.email}
          />
        </div>
      </div>
    </PageShell>
  );
}
