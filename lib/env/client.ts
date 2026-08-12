import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().or(z.literal("")),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().or(z.literal("")),
});

export type ClientEnv = z.infer<typeof clientSchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function vercelPublicUrl(): string | undefined {
  const url = process.env.VERCEL_URL?.trim();
  if (!url) return undefined;
  return url.startsWith("http") ? url : `https://${url}`;
}

function placeholderClientEnv(): ClientEnv {
  const vercelUrl = vercelPublicUrl();
  return {
    NEXT_PUBLIC_APP_URL: vercelUrl ?? "http://localhost:3000",
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.VERCEL_URL?.trim() || "localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_placeholder",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    NEXT_PUBLIC_SENTRY_DSN: "",
    NEXT_PUBLIC_POSTHOG_KEY: "",
    NEXT_PUBLIC_POSTHOG_HOST: "",
  };
}

function readClientEnv(): Record<string, string | undefined> {
  const vercelUrl = vercelPublicUrl();
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || vercelUrl,
    NEXT_PUBLIC_ROOT_DOMAIN:
      process.env.NEXT_PUBLIC_ROOT_DOMAIN || process.env.VERCEL_URL || undefined,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}

function shouldSkipEnvValidation(): boolean {
  return (
    process.env.SKIP_ENV_VALIDATION === "true" ||
    // Allow `next build` / Vercel compile to finish before runtime secrets are injected.
    process.env.NEXT_PHASE === "phase-production-build" ||
    // Never take down Edge proxy / pages with a hard crash when env is incomplete on Vercel.
    process.env.VERCEL === "1"
  );
}

export function createClientEnv(): ClientEnv {
  const skipValidation = shouldSkipEnvValidation();
  const raw = readClientEnv();
  const parsed = clientSchema.safeParse(raw);

  if (parsed.success) {
    return parsed.data;
  }

  if (skipValidation) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
      console.error(
        `[env] Invalid public environment variables; using safe placeholders.\n${formatZodError(parsed.error)}`,
      );
    }
    return {
      ...placeholderClientEnv(),
      ...(raw.NEXT_PUBLIC_APP_URL ? { NEXT_PUBLIC_APP_URL: raw.NEXT_PUBLIC_APP_URL } : {}),
      ...(raw.NEXT_PUBLIC_ROOT_DOMAIN
        ? { NEXT_PUBLIC_ROOT_DOMAIN: raw.NEXT_PUBLIC_ROOT_DOMAIN }
        : {}),
    };
  }

  throw new Error(
    `Invalid public environment variables:\n${formatZodError(parsed.error)}\n\nCopy .env.example to .env.local and fill in real values.`,
  );
}

export const clientEnv = createClientEnv();
