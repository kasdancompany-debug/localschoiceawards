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
    <div className="surface-tint flex min-h-[70vh] w-full flex-1 items-center justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-2xl text-center">
        <p className="text-sm font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Locals Choice Awards
        </p>
        <h1 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          This page hit a snag
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
          An unexpected problem interrupted this request. Retry, or return home while we get things
          sorted.
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
        ) : null}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className={cn(buttonVariants({ size: "lg" }), "h-12 px-6")}>
            Try again
          </button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-6")}
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
