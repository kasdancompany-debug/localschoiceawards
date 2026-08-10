import { redirect } from "next/navigation";

import {
  unsubscribeMarketingEmails,
  verifyUnsubscribeToken,
} from "@/lib/notifications";
import { toRoute } from "@/lib/routes";

type UnsubscribePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const verified = verifyUnsubscribeToken(token);

  if (!verified.ok) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16">
        <h1 className="font-heading text-3xl font-semibold">Unsubscribe link invalid</h1>
        <p className="mt-3 text-muted-foreground">
          This unsubscribe link is invalid or expired. Sign in to manage email preferences from
          account settings.
        </p>
      </main>
    );
  }

  await unsubscribeMarketingEmails(verified.userId);
  redirect(toRoute("/unsubscribe/done"));
}
