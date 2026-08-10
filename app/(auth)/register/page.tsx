import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getOptionalUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const user = await getOptionalUser();
  if (user) {
    redirect("/account");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join Locals Choice Awards to vote, manage businesses, and follow community seasons.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
