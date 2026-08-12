import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth/session";
import { listActiveCampaignTemplates } from "@/lib/campaigns/service";
import { toRoute } from "@/lib/routes";

export default async function AdminHomePage() {
  const session = await requireAdminSession("/admin");
  const templates = await listActiveCampaignTemplates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Administration</h1>
        <p className="mt-2 text-muted-foreground">
          Signed in as {session.email}. Manage campaign templates and import business directories.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics & financials</CardTitle>
          <CardDescription>
            Community comparison, funnel conversion, claimed-business KPIs, and contribution margin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={toRoute("/admin/analytics")}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open analytics dashboard
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Event queue, Resend deliveries, retries, bounces, complaints, and template preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={toRoute("/admin/notifications")}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open notification dashboard
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results & eligibility</CardTitle>
          <CardDescription>
            Compute immutable audited result runs, approve publication, and manage award
            eligibilities without deleting history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={toRoute("/admin/results")}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open results tools
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Finalists & voting</CardTitle>
          <CardDescription>
            Generate and publish finalists, monitor ballots, fraud, invalidations, locks, and audit
            reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={toRoute("/admin/voting")}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open finalist and voting tools
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nominations</CardTitle>
          <CardDescription>
            Overview, missing-business queue, fraud flags, invalidations, category activity, and
            export. Voting is not available yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={toRoute("/admin/nominations")}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open nomination tools
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business directory</CardTitle>
          <CardDescription>
            Validate CSV rows, resolve duplicates manually, and import without overwriting existing
            businesses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={toRoute("/admin/businesses/import")}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open business CSV importer
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign templates</CardTitle>
          <CardDescription>
            Reusable schedules for creating one campaign per community per year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Nomination days</TableHead>
                  <TableHead>Review days</TableHead>
                  <TableHead>Voting days</TableHead>
                  <TableHead>Audit days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{template.defaultNominationDays}</TableCell>
                    <TableCell>{template.defaultReviewDays}</TableCell>
                    <TableCell>{template.defaultVotingDays}</TableCell>
                    <TableCell>{template.defaultAuditDays}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              className="border-0 py-8"
              title="No templates loaded"
              description="Apply the campaign seed migration to load the Standard Annual Awards template."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
