import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdminSession } from "@/lib/auth/session";
import {
  processQueueAction,
  processSingleEventAction,
  retryNotificationAction,
} from "@/lib/notifications/actions";
import {
  getNotificationDashboardStats,
  listEmailDeliveriesForAdmin,
  listEmailTemplatesForAdmin,
  listNotificationEventsForAdmin,
} from "@/lib/notifications/admin";
import { toRoute } from "@/lib/routes";

type AdminNotificationsPageProps = {
  searchParams: Promise<{ status?: string; deliveryStatus?: string }>;
};

export default async function AdminNotificationsPage({ searchParams }: AdminNotificationsPageProps) {
  await requireAdminSession("/admin/notifications");
  const params = await searchParams;
  const [stats, events, deliveries, templates] = await Promise.all([
    getNotificationDashboardStats(),
    listNotificationEventsForAdmin({
      status: params.status as
        | "queued"
        | "processing"
        | "sent"
        | "failed"
        | "cancelled"
        | "skipped"
        | undefined,
      limit: 50,
    }),
    listEmailDeliveriesForAdmin({
      status: params.deliveryStatus as
        | "queued"
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "bounced"
        | "complained"
        | "failed"
        | "skipped"
        | undefined,
      limit: 50,
    }),
    listEmailTemplatesForAdmin(),
  ]);

  const summary = [
    { label: "Queued", value: stats.queued, href: toRoute("/admin/notifications?status=queued") },
    { label: "Sent", value: stats.sent, href: toRoute("/admin/notifications?status=sent") },
    { label: "Failed", value: stats.failed, href: toRoute("/admin/notifications?status=failed") },
    {
      label: "Bounced",
      value: stats.bounced,
      href: toRoute("/admin/notifications?deliveryStatus=bounced"),
    },
    {
      label: "Complaints",
      value: stats.complaints,
      href: toRoute("/admin/notifications?deliveryStatus=complained"),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-2 text-muted-foreground">
            Event queue, Resend deliveries, retries, and template registry.
          </p>
        </div>
        <form action={processQueueAction}>
          <Button type="submit">Process queue</Button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              </CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template preview</CardTitle>
          <CardDescription>
            Development previews render at{" "}
            <code className="text-xs">/dev/emails</code>. Active registry keys below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length ? (
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  href={toRoute(`/dev/emails?key=${encodeURIComponent(template.key)}`)}
                  className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
                >
                  {template.key}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              className="border-0 py-6"
              title="No templates"
              description="Apply the email template seed migration."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification events</CardTitle>
          <CardDescription>Queued, failed, and recent processed events.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Retry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="max-w-[220px] truncate text-sm">{event.eventType}</TableCell>
                    <TableCell>{event.status}</TableCell>
                    <TableCell>{event.attempts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(event.availableAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {event.lastError ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(event.status === "failed" || event.status === "skipped") && (
                          <form action={retryNotificationAction}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <Button type="submit" size="sm" variant="outline">
                              Retry
                            </Button>
                          </form>
                        )}
                        {event.status === "queued" && (
                          <form action={processSingleEventAction}>
                            <input type="hidden" name="eventId" value={event.id} />
                            <Button type="submit" size="sm" variant="secondary">
                              Send now
                            </Button>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              className="border-0 py-8"
              title="No events"
              description="Notification events appear here when domain actions enqueue them."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email deliveries</CardTitle>
          <CardDescription>Resend delivery, bounce, and complaint status.</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider ID</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="text-sm">{delivery.recipientEmail}</TableCell>
                    <TableCell className="text-xs">{delivery.templateKey}</TableCell>
                    <TableCell>{delivery.status}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                      {delivery.providerMessageId ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {delivery.sentAt ? new Date(delivery.sentAt).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              className="border-0 py-8"
              title="No deliveries yet"
              description="Processed events create delivery rows with provider message IDs."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
