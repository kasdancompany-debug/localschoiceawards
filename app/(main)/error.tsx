"use client";

import { useEffect } from "react";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MainErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function MainError({ error, reset }: MainErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell narrow>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-4 text-muted-foreground">
        We couldn’t load this page. Try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}
        >
          Try again
        </button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-6")}>
          Home
        </Link>
      </div>
    </PageShell>
  );
}
