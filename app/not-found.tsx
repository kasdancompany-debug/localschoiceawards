import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">404</p>
      <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        That address is not part of Locals Choice Awards. Check the community subdomain or return to
        the central site.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
        Back to localschoiceawards.com
      </Link>
    </div>
  );
}
