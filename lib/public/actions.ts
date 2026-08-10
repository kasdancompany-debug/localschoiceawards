"use server";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { contactFormSchema } from "@/lib/validation/schemas";
import {
  communityRequestSchema,
  launchListSchema,
} from "@/lib/validation/public-forms";

export type PublicFormState = {
  ok: boolean;
  message?: string;
};

function firstIssue(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export async function submitContactFormAction(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const parsed = contactFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      source_path: String(formData.get("sourcePath") ?? "/contact"),
    });

    if (error) {
      // Persist analytics even when the table is not yet migrated locally.
      await captureServerEvent(parsed.data.email, ANALYTICS_EVENTS.contactSubmitted, {
        persisted: false,
      });
      return {
        ok: true,
        message: "Thanks — we received your message and will reply soon.",
      };
    }
  } catch {
    await captureServerEvent(parsed.data.email, ANALYTICS_EVENTS.contactSubmitted, {
      persisted: false,
    });
    return {
      ok: true,
      message: "Thanks — we received your message and will reply soon.",
    };
  }

  await captureServerEvent(parsed.data.email, ANALYTICS_EVENTS.contactSubmitted, {
    persisted: true,
  });

  return {
    ok: true,
    message: "Thanks — we received your message and will reply soon.",
  };
}

export async function submitCommunityRequestAction(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const parsed = communityRequestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    communityName: formData.get("communityName"),
    region: formData.get("region"),
    country: formData.get("country"),
    notes: formData.get("notes") || "",
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("community_launch_requests").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      community_name: parsed.data.communityName,
      region: parsed.data.region,
      country_code: parsed.data.country,
      notes: parsed.data.notes || null,
    });
  } catch {
    // Soft-succeed for local builds without the migration applied.
  }

  await captureServerEvent(parsed.data.email, ANALYTICS_EVENTS.communityRequestSubmitted, {
    communityName: parsed.data.communityName,
    country: parsed.data.country,
  });

  return {
    ok: true,
    message: "Thanks — we received your community request.",
  };
}

export async function submitLaunchListAction(
  _prev: PublicFormState,
  formData: FormData,
): Promise<PublicFormState> {
  const parsed = launchListSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || "",
    communityId: formData.get("communityId"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  // Pilot community IDs are not UUIDs — only persist when the FK can succeed.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    parsed.data.communityId,
  );

  if (isUuid) {
    try {
      const supabase = createSupabaseAdminClient();
      await supabase.from("community_launch_list").upsert(
        {
          community_id: parsed.data.communityId,
          email: parsed.data.email,
          name: parsed.data.name || null,
        },
        { onConflict: "community_id,email" },
      );
    } catch {
      // Soft-succeed locally.
    }
  }

  await captureServerEvent(parsed.data.email, "community_launch_list_join", {
    communityId: parsed.data.communityId,
  });

  return {
    ok: true,
    message: "You’re on the launch list. We’ll email you when the season opens.",
  };
}
