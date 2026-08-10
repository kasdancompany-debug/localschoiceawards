import { EmptyState } from "@/components/empty-state";
import { SupplierSectionNav } from "@/components/supplier/supplier-section-nav";
import { listSupplierTeam } from "@/lib/fulfillment/service";
import { resolveSupplierContext } from "@/lib/fulfillment/supplier-context";

export default async function SupplierTeamPage() {
  const { primarySupplierId } = await resolveSupplierContext();
  const team = primarySupplierId ? await listSupplierTeam(primarySupplierId) : [];

  return (
    <div className="space-y-6">
      <SupplierSectionNav current="/supplier/team" />
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Team settings</h1>
        <p className="mt-2 text-muted-foreground">
          Membership is managed by platform administrators. Team members only see assigned
          fulfillments.
        </p>
      </div>
      {team.length ? (
        <ul className="space-y-3 text-sm">
          {team.map((member) => (
            <li key={member.id} className="border-b border-border/70 pb-3">
              <p className="font-medium">{member.user_id}</p>
              <p className="text-muted-foreground">
                {member.role} · {member.status}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No team members" description="Ask an admin to invite supplier users." />
      )}
    </div>
  );
}
