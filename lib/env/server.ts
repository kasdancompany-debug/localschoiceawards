import "server-only";

import { z } from "zod";

import { clientEnv, type ClientEnv } from "@/lib/env/client";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const serverOnlySchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  NOTIFICATIONS_CRON_SECRET: z.string().min(1).optional().or(z.literal("")),
  RESEND_WEBHOOK_SECRET: z.string().min(1).optional().or(z.literal("")),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  SENTRY_AUTH_TOKEN: z.string().optional().or(z.literal("")),
  SENTRY_ORG: z.string().optional().or(z.literal("")),
  SENTRY_PROJECT: z.string().optional().or(z.literal("")),
  POSTHOG_API_KEY: z.string().optional().or(z.literal("")),
  SKIP_ENV_VALIDATION: booleanFromString,
});

export type ServerEnv = ClientEnv & z.infer<typeof serverOnlySchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function placeholderServerOnlyEnv(): z.infer<typeof serverOnlySchema> {
  return {
    NODE_ENV: (process.env.NODE_ENV as "development" | "test" | "production") || "development",
    SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-role-key",
    STRIPE_SECRET_KEY: "sk_test_placeholder",
    STRIPE_WEBHOOK_SECRET: "whsec_placeholder",
    RESEND_API_KEY: "re_placeholder",
    EMAIL_FROM: "noreply@localschoiceawards.com",
    NOTIFICATIONS_CRON_SECRET: "notifications-cron-placeholder",
    RESEND_WEBHOOK_SECRET: "resend-webhook-placeholder",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    SENTRY_DSN: "",
    SENTRY_AUTH_TOKEN: "",
    SENTRY_ORG: "",
    SENTRY_PROJECT: "",
    POSTHOG_API_KEY: "",
    SKIP_ENV_VALIDATION: true,
  };
}

function readServerOnlyEnv(): Record<string, string | undefined> {
  return {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NOTIFICATIONS_CRON_SECRET: process.env.NOTIFICATIONS_CRON_SECRET,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  };
}

function createServerEnv(): ServerEnv {
  const skipValidation = process.env.SKIP_ENV_VALIDATION === "true";
  const raw = readServerOnlyEnv();
  const parsed = serverOnlySchema.safeParse(raw);

  if (parsed.success) {
    return { ...clientEnv, ...parsed.data };
  }

  if (skipValidation) {
    return { ...clientEnv, ...placeholderServerOnlyEnv() };
  }

  throw new Error(
    `Invalid server environment variables:\n${formatZodError(parsed.error)}\n\nCopy .env.example to .env.local and fill in real values.`,
  );
}

export const env = createServerEnv();

/** Asserts code runs only on the server — never import service-role helpers into client components. */
export function assertServerOnly(context: string): void {
  if (typeof window !== "undefined") {
    throw new Error(`${context} must only be used on the server.`);
  }
}
