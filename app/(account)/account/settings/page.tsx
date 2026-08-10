import { ProfileSettingsForm } from "@/components/auth/profile-settings-form";
import { NotificationPreferencesForm } from "@/components/account/notification-preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getOrCreateNotificationPreferences } from "@/lib/notifications/preferences";

export default async function AccountSettingsPage() {
  const session = await requireUser({ next: "/account/settings" });

  const profile = session.profile ?? {
    id: session.userId,
    firstName: null,
    lastName: null,
    displayName: null,
    avatarUrl: null,
    preferredLocale: "en-CA",
    preferredCurrency: "CAD" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const preferences = await getOrCreateNotificationPreferences(session.userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Account settings</h1>
        <p className="mt-2 text-muted-foreground">
          Update how your name and preferences appear across Locals Choice Awards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Signed in as {session.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
          <CardDescription>
            Marketing consent is separate from operational and legally required transactional
            messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm preferences={preferences} />
        </CardContent>
      </Card>
    </div>
  );
}
