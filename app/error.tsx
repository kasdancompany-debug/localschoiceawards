"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">Error</p>
      <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight">Page failed to load</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        An unexpected problem interrupted this request. Retry the action, or head back to the public
        site while we investigate.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={cn(buttonVariants())}>
          Try again
        </button>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Return home
        </Link>
      </div>
    </div>
  );
}
