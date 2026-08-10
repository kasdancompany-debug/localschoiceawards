import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage() {
  await requireUser({ next: "/reset-password" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your reset link is verified. Set a strong password to finish recovering your account.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
