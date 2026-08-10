import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CommunityUnavailableProps = {
  subdomain?: string | null;
  reason?: "unknown" | "inactive";
  homeHref?: string;
};

export function CommunityUnavailable({
  subdomain,
  reason = "unknown",
  homeHref = "/",
}: CommunityUnavailableProps) {
  const title =
    reason === "inactive" ? "This community is not available" : "Community not found";
  const description =
    reason === "inactive"
      ? "This Locals Choice Awards market is paused or archived right now."
      : subdomain
        ? `We could not find an active Locals Choice Awards community for “${subdomain}”.`
        : "We could not find an active Locals Choice Awards community for this address.";

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
        Not available
      </p>
      <h1 className="font-heading mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Try the central site or one of the pilot communities such as saultstemarie, sudbury, or
        detroit.
      </p>
      <Link href={toRoute(homeHref)} className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
        Go to Locals Choice Awards
      </Link>
    </div>
  );
}
