import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verify your email",
};

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link to confirm your address. Open it to activate your Locals Choice
          Awards account, then sign in.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p>
          Did not receive the message? Check spam, wait a minute, then try signing in again or request
          another verification email from your inbox link.
        </p>
      </div>
      <Link href="/login" className={cn(buttonVariants())}>
        Back to sign in
      </Link>
    </div>
  );
}
