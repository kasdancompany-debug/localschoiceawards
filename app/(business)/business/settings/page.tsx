import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";

export default async function BusinessSettingsPage() {
  const session = await requireUser({ next: "/settings" });

  return (
    <PageShell narrow>
      <PageIntro
        eyebrow="Settings"
        title="Portal settings"
        description="Account security and notification preferences stay in the shared account area for now."
      />
      <div className="mt-8 space-y-3 text-sm text-muted-foreground">
        <p>Signed in as {session.email}</p>
        <p>Email confirmed: {session.emailConfirmed ? "yes" : "no"}</p>
        <p>
          Use the Account link in the header to update your profile. Business-specific notification
          preferences will expand here later.
        </p>
      </div>
    </PageShell>
  );
}
