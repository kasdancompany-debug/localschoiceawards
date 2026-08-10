"use client";

import { useEffect } from "react";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommunityErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function CommunityError({ error, reset }: CommunityErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell narrow>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        This community page failed to load
      </h1>
      <p className="mt-4 text-muted-foreground">
        Please try again. If the problem continues, return home and open another page.
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
          Community home
        </Link>
      </div>
    </PageShell>
  );
}
