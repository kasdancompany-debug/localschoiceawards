"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { updateNotificationPreferences } from "@/lib/notifications/preferences";
import { toRoute } from "@/lib/routes";

export type NotificationPrefsActionState = {
  ok: boolean;
  message?: string;
};

export async function updateNotificationPreferencesAction(
  _prev: NotificationPrefsActionState,
  formData: FormData,
): Promise<NotificationPrefsActionState> {
  const session = await requireUser({ next: "/account/settings" });

  try {
    await updateNotificationPreferences({
      userId: session.userId,
      campaignUpdates: formData.get("campaignUpdates") === "on",
      businessUpdates: formData.get("businessUpdates") === "on",
      orderUpdates: formData.get("orderUpdates") === "on",
      marketingEmails: formData.get("marketingEmails") === "on",
      winnerSalesEmails: formData.get("winnerSalesEmails") === "on",
    });
    revalidatePath(toRoute("/account/settings"));
    return { ok: true, message: "Notification preferences saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save preferences.",
    };
  }
}
