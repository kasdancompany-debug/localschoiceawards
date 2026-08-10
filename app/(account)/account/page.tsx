import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccountStatusLabel, getDisplayName } from "@/lib/auth/profile";
import { requireUser } from "@/lib/auth/session";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function AccountHomePage() {
  const session = await requireUser({ next: "/account" });
  const displayName = getDisplayName(session.profile, session.email);
  const status = getAccountStatusLabel({ emailConfirmed: session.emailConfirmed });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Account</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back{displayName ? `, ${displayName}` : ""}. Manage your Locals Choice Awards
          participation from this dashboard.
        </p>
      </div>

      {!session.emailConfirmed ? (
        <Alert>
          <AlertTitle>Verify your email</AlertTitle>
          <AlertDescription>
            Some features stay limited until your email address is confirmed. Check your inbox for a
            verification link.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your identity on Locals Choice Awards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span> {displayName}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {session.email}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span> {status}
            </p>
            <p>
              <span className="text-muted-foreground">Roles:</span>{" "}
              {session.roles.length ? session.roles.join(", ") : "user"}
            </p>
            <Link href="/account/settings" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}>
              Account settings
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification settings</CardTitle>
            <CardDescription>Email preferences for seasons and orders</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              className="border-0 py-6"
              title="Coming soon"
              description="Notification preferences will appear here in a later phase."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managed businesses</CardTitle>
            <CardDescription>Businesses you own or represent</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              className="border-0 py-6"
              title="No businesses yet"
              description="Business claims and nominations will be managed from this panel."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Sponsorships and award product purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={toRoute("/account/orders")} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View order history
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
