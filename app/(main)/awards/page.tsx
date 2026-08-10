import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  formatMoney,
  listActiveCatalogProducts,
  listEligibilitiesForUser,
} from "@/lib/commerce";
import { placementLabel } from "@/lib/results/rules";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Awards shop",
  description:
    "Personalized recognition products for published Locals Choice winners. Shipping is charged separately at checkout.",
};

export default async function AwardsCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ eligibilityId?: string; currency?: string }>;
}) {
  const params = await searchParams;
  const session = await getAuthenticatedSession();
  const products = await listActiveCatalogProducts(
    params.currency === "USD" || params.currency === "CAD" ? params.currency : undefined,
  );
  const eligibilities = session?.userId
    ? await listEligibilitiesForUser(session.userId)
    : [];

  return (
    <PageShell>
      <PageIntro
        eyebrow="Winner shop"
        title="Awards"
        description="Choose an eligible published win, pick a made-to-order product, preview personalization, then add shipping as a separate checkout cost."
      />

      <section className="mt-10 space-y-4">
        <h2 className="font-heading text-2xl font-semibold">1. Choose eligible win</h2>
        {eligibilities.length ? (
          <ul className="space-y-3">
            {eligibilities.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="font-medium">
                    {placementLabel(item.placement)} · {item.personalized_category_name}
                  </p>
                  <p className="text-muted-foreground">
                    {item.personalized_business_name} · {item.personalized_community_name} ·{" "}
                    {item.personalized_campaign_year}
                  </p>
                </div>
                <Link
                  href={toRoute(
                    `/awards?eligibilityId=${item.id}${params.currency ? `&currency=${params.currency}` : ""}`,
                  )}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Shop this win
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={session ? "No active wins yet" : "Sign in to load your wins"}
            description="Published award eligibilities drive personalization. You can still browse products, then attach a win before adding protected items."
          />
        )}
        {params.eligibilityId ? (
          <p className="text-sm text-muted-foreground">
            Selected win ready — choose a product below to preview personalization.
          </p>
        ) : null}
      </section>

      <section className="mt-14 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold">2. Choose product</h2>
          <div className="flex gap-2 text-sm">
            <Link
              href={toRoute(
                `/awards?currency=CAD${params.eligibilityId ? `&eligibilityId=${params.eligibilityId}` : ""}`,
              )}
              className="underline-offset-4 hover:underline"
            >
              CAD
            </Link>
            <span aria-hidden>·</span>
            <Link
              href={toRoute(
                `/awards?currency=USD${params.eligibilityId ? `&eligibilityId=${params.eligibilityId}` : ""}`,
              )}
              className="underline-offset-4 hover:underline"
            >
              USD
            </Link>
            <Link href={toRoute("/cart")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Cart
            </Link>
          </div>
        </div>

        {!products.length ? (
          <EmptyState
            title="Catalog unavailable"
            description="Award products appear here once the commerce catalog is seeded."
          />
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2">
            {products.map((product) => {
              const variant = product.variants[0];
              const href = toRoute(
                `/awards/${product.slug}${
                  params.eligibilityId ? `?eligibilityId=${params.eligibilityId}` : ""
                }`,
              );
              return (
                <li key={product.id} className="space-y-3">
                  <h3 className="font-heading text-xl font-semibold">{product.name}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                  {variant ? (
                    <p className="text-sm font-medium">
                      From {formatMoney(variant.priceCents, variant.currencyCode)} · shipping
                      separate
                    </p>
                  ) : null}
                  <Link href={href} className={cn(buttonVariants())}>
                    View product
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
