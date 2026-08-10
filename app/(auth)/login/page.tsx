import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import { getOptionalUser } from "@/lib/auth/session";
import { toRoute } from "@/lib/routes";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getOptionalUser();
  const next = sanitizeRedirectPath(params.next, "/account");

  if (user) {
    redirect(toRoute(next));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use email and password, a magic link, or Google to access your Locals Choice Awards
          account.
        </p>
      </div>
      <LoginForm next={next} errorMessage={params.error} />
    </div>
  );
}
