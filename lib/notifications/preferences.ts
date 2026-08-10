import "server-only";

import { createSupabaseAdminClient } from "@/lib/database";
import type { NotificationPreferences } from "@/types/notifications";

const DEFAULT_PREFS = {
  campaignUpdates: true,
  businessUpdates: true,
  orderUpdates: true,
  marketingEmails: false,
  winnerSalesEmails: false,
} as const;

function mapPrefs(row: {
  id: string;
  user_id: string;
  campaign_updates: boolean;
  business_updates: boolean;
  order_updates: boolean;
  marketing_emails: boolean;
  winner_sales_emails: boolean;
  updated_at: string;
}): NotificationPreferences {
  return {
    id: row.id,
    userId: row.user_id,
    campaignUpdates: row.campaign_updates,
    businessUpdates: row.business_updates,
    orderUpdates: row.order_updates,
    marketingEmails: row.marketing_emails,
    winnerSalesEmails: row.winner_sales_emails,
    updatedAt: row.updated_at,
  };
}

export function defaultNotificationPreferences(userId = ""): NotificationPreferences {
  return {
    id: "",
    userId,
    ...DEFAULT_PREFS,
    updatedAt: new Date().toISOString(),
  };
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? mapPrefs(data) : null;
}

export async function getOrCreateNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const existing = await getNotificationPreferences(userId);
  if (existing) return existing;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("notification_preferences")
    .insert({
      user_id: userId,
      campaign_updates: DEFAULT_PREFS.campaignUpdates,
      business_updates: DEFAULT_PREFS.businessUpdates,
      order_updates: DEFAULT_PREFS.orderUpdates,
      marketing_emails: DEFAULT_PREFS.marketingEmails,
      winner_sales_emails: DEFAULT_PREFS.winnerSalesEmails,
    })
    .select("*")
    .single();

  if (error || !data) {
    return defaultNotificationPreferences(userId);
  }
  return mapPrefs(data);
}

export async function updateNotificationPreferences(input: {
  userId: string;
  campaignUpdates?: boolean;
  businessUpdates?: boolean;
  orderUpdates?: boolean;
  marketingEmails?: boolean;
  winnerSalesEmails?: boolean;
}): Promise<NotificationPreferences> {
  await getOrCreateNotificationPreferences(input.userId);
  const admin = createSupabaseAdminClient();
  const patch: {
    campaign_updates?: boolean;
    business_updates?: boolean;
    order_updates?: boolean;
    marketing_emails?: boolean;
    winner_sales_emails?: boolean;
  } = {};
  if (input.campaignUpdates !== undefined) patch.campaign_updates = input.campaignUpdates;
  if (input.businessUpdates !== undefined) patch.business_updates = input.businessUpdates;
  if (input.orderUpdates !== undefined) patch.order_updates = input.orderUpdates;
  if (input.marketingEmails !== undefined) patch.marketing_emails = input.marketingEmails;
  if (input.winnerSalesEmails !== undefined) patch.winner_sales_emails = input.winnerSalesEmails;

  const { data, error } = await admin
    .from("notification_preferences")
    .update(patch)
    .eq("user_id", input.userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update notification preferences.");
  }
  return mapPrefs(data);
}

/** Opt out of promotional / marketing emails (unsubscribe link). */
export async function unsubscribeMarketingEmails(userId: string): Promise<void> {
  await updateNotificationPreferences({
    userId,
    marketingEmails: false,
    winnerSalesEmails: false,
  });
}

export async function resolvePreferencesForRecipient(input: {
  userId?: string | null;
}): Promise<NotificationPreferences> {
  if (!input.userId) {
    return defaultNotificationPreferences();
  }
  return (await getNotificationPreferences(input.userId)) ?? defaultNotificationPreferences(input.userId);
}
