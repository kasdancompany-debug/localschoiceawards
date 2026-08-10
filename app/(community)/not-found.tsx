import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CommunityNotFound() {
  return (
    <PageShell narrow>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        That community page doesn’t exist or isn’t public yet.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8 inline-flex h-12 px-6")}>
        Back to community home
      </Link>
    </PageShell>
  );
}
