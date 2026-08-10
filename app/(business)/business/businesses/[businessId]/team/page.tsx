import { notFound } from "next/navigation";

import { InviteTeamForm } from "@/components/businesses/invite-team-form";
import { BusinessSectionNav } from "@/components/businesses/business-section-nav";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  listInvitationsForBusiness,
  listTeamForBusiness,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";
import { isInvitationExpired as checkExpired } from "@/lib/businesses/access";

type Props = { params: Promise<{ businessId: string }> };

export default async function BusinessTeamPage({ params }: Props) {
  const session = await requireUser({ next: "/businesses" });
  const { businessId } = await params;
  let membership;
  try {
    membership = await requireBusinessMembership(businessId, session.userId, { team: true });
  } catch {
    notFound();
  }

  const business = await getManagedBusiness(businessId);
  if (!business) {
    notFound();
  }

  const [team, invitations] = await Promise.all([
    listTeamForBusiness(businessId),
    listInvitationsForBusiness(businessId),
  ]);

  return (
    <PageShell>
      <BusinessSectionNav businessId={businessId} current="team" />
      <PageIntro
        eyebrow="Team"
        title="People with access"
        description="Owners and administrators can invite teammates. Privilege escalation is blocked."
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="font-heading text-xl font-semibold">Members</h2>
          <ul className="mt-4 space-y-3">
            {team.map((member) => (
              <li key={member.id} className="rounded-2xl border border-border/80 bg-card px-4 py-3">
                <p className="text-sm font-medium">{member.userId}</p>
                <p className="text-sm capitalize text-muted-foreground">
                  {member.role} · {member.status}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="font-heading mt-8 text-xl font-semibold">Invitations</h2>
          <ul className="mt-4 space-y-3">
            {invitations.map((invite) => (
              <li key={invite.id} className="rounded-2xl border border-border/80 bg-card px-4 py-3 text-sm">
                <p className="font-medium">{invite.email}</p>
                <p className="text-muted-foreground capitalize">
                  {invite.role} ·{" "}
                  {invite.acceptedAt
                    ? "accepted"
                    : checkExpired(invite.expiresAt)
                      ? "expired"
                      : "pending"}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <InviteTeamForm businessId={businessId} actorRole={membership.role} />
      </div>
    </PageShell>
  );
}
