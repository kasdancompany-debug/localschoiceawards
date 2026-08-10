import { Suspense } from "react";

import { AcceptInvitationForm } from "@/components/businesses/accept-invitation-form";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";

export default async function AcceptInvitationPage() {
  await requireUser({ next: "/invitations/accept" });

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="Team"
        title="Accept invitation"
        description="Sign in with the invited email address. Expired invitations cannot be accepted."
      />
      <div className="mt-8 rounded-3xl border border-border/80 bg-card p-6">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </PageShell>
  );
}
