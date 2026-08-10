"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { env } from "@/lib/env/server";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import { toRoute } from "@/lib/routes";
import { assertAuthRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  forgotPasswordSchema,
  loginSchema,
  magicLinkSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/lib/validation/auth";

export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getRequestIp(): Promise<string | undefined> {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    undefined
  );
}

function fieldErrorsFromZod(error: {
  flatten: () => { fieldErrors: Record<string, string[] | undefined> };
}): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages?.length) {
      result[key] = messages;
    }
  }
  return result;
}

export async function loginWithPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    turnstileToken: formString(formData, "turnstileToken"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const ip = await getRequestIp();
  const rate = await assertAuthRateLimit({
    action: "login",
    identifier: parsed.data.email,
    ipAddress: ip,
  });

  if (!rate.allowed) {
    return {
      ok: false,
      message: "Too many login attempts. Please wait and try again.",
    };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: "Invalid email or password." };
  }

  if (data.user?.id) {
    const { mergeAnonymousCartIntoUser } = await import("@/lib/commerce/cart");
    await mergeAnonymousCartIntoUser({ userId: data.user.id });
  }

  const next = sanitizeRedirectPath(formString(formData, "next") || "/account");
  redirect(toRoute(next));
}

export async function registerWithPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
    turnstileToken: formString(formData, "turnstileToken"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const ip = await getRequestIp();
  const rate = await assertAuthRateLimit({
    action: "register",
    identifier: parsed.data.email,
    ipAddress: ip,
  });

  if (!rate.allowed) {
    return {
      ok: false,
      message: "Too many registration attempts. Please wait and try again.",
    };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent("/account")}`,
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        display_name: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect(toRoute("/verify-email"));
}

export async function requestMagicLinkAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = magicLinkSchema.safeParse({
    email: formString(formData, "email"),
    turnstileToken: formString(formData, "turnstileToken"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const ip = await getRequestIp();
  const rate = await assertAuthRateLimit({
    action: "login",
    identifier: parsed.data.email,
    ipAddress: ip,
  });

  if (!rate.allowed) {
    return {
      ok: false,
      message: "Too many login attempts. Please wait and try again.",
    };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  const next = sanitizeRedirectPath(formString(formData, "next") || "/account");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "Check your email for a magic link to sign in.",
  };
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formString(formData, "email"),
    turnstileToken: formString(formData, "turnstileToken"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const ip = await getRequestIp();
  const rate = await assertAuthRateLimit({
    action: "password_reset",
    identifier: parsed.data.email,
    ipAddress: ip,
  });

  if (!rate.allowed) {
    return {
      ok: false,
      message: "Too many password-reset attempts. Please wait and try again.",
    };
  }

  const turnstileOk = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstileOk) {
    return { ok: false, message: "Security check failed. Please try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on the way.",
  };
}

export async function updatePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect(toRoute("/account?password=updated"));
}

export async function updateProfileAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updateProfileSchema.safeParse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    displayName: formString(formData, "displayName"),
    preferredLocale: formString(formData, "preferredLocale"),
    preferredCurrency: formString(formData, "preferredCurrency"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to update your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      display_name: parsed.data.displayName,
      preferred_locale: parsed.data.preferredLocale,
      preferred_currency: parsed.data.preferredCurrency,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Profile updated." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function startGoogleOAuthAction(formData: FormData): Promise<void> {
  const next = sanitizeRedirectPath(formString(formData, "next") || "/account");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect(
      toRoute(`/login?error=${encodeURIComponent(error?.message ?? "Google sign-in failed.")}`),
    );
  }

  redirect(toRoute(data.url));
}
