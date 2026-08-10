import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we will send a secure link to choose a new password.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
