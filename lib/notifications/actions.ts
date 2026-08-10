"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth/session";
import {
  processNotificationEvent,
  processQueuedNotificationEvents,
  retryNotificationEvent,
} from "@/lib/notifications";
import { toRoute } from "@/lib/routes";

export async function retryNotificationAction(formData: FormData) {
  await requireAdminSession("/admin/notifications");
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await retryNotificationEvent(eventId);
  revalidatePath(toRoute("/admin/notifications"));
}

export async function processQueueAction() {
  await requireAdminSession("/admin/notifications");
  await processQueuedNotificationEvents(25);
  revalidatePath(toRoute("/admin/notifications"));
}

export async function processSingleEventAction(formData: FormData) {
  await requireAdminSession("/admin/notifications");
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;
  await processNotificationEvent(eventId);
  revalidatePath(toRoute("/admin/notifications"));
}
