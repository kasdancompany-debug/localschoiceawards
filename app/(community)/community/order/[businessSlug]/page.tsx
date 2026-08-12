import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AwardProductShop } from "@/components/commerce/award-product-shop";
import { PromoteCheckoutPanel } from "@/components/commerce/promote-checkout-panel";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { getPublicBusinessBySlug } from "@/lib/businesses";
import {
  getBusinessPromotionProduct,
  listActiveCatalogProducts,
} from "@/lib/commerce/catalog";
import { getCurrentCommunity } from "@/lib/communities/current";
import { buildCommunityMetadata } from "@/lib/communities/metadata";
import { usesPathCommunityUrls } from "@/lib/communities/path-mode";
import { businessHasActivePromotion } from "@/lib/promotions/service";
import { listPublicBusinessWins } from "@/lib/results/service";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { CommerceCurrency } from "@/types/commerce";

type OrderBusinessPageProps = {
  params: Promise<{ businessSlug: string }>;
};

export async function generateMetadata({ params }: OrderBusinessPageProps): Promise<Metadata> {
  const { businessSlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return { title: "Order" };
  }
  const profile = await getPublicBusinessBySlug(businessSlug, community.id);
  return buildCommunityMetadata(community, {
    title: profile
      ? `Order · ${profile.business.publicName}`
      : `Order · ${community.name}`,
    description: profile
      ? `Order winner awards or promote ${profile.business.publicName} — no password required.`
      : `Order awards in ${community.name}.`,
    pathname: `/order/${businessSlug}`,
  });
}

export default async function CommunityOrderBusinessPage({ params }: OrderBusinessPageProps) {
  const { businessSlug } = await params;
  const community = await getCurrentCommunity();
  if (!community) {
    return null;
  }

  const profile = await getPublicBusinessBySlug(businessSlug, community.id);
  if (!profile) {
    notFound();
  }

  const session = await getAuthenticatedSession();
  const currencyCode = community.country.currencyCode as CommerceCurrency;
  const [wins, products, promotionProduct, alreadyPromoted] = await Promise.all([
    listPublicBusinessWins({
      businessId: profile.business.id,
      communityId: community.id,
    }),
    listActiveCatalogProducts(currencyCode),
    getBusinessPromotionProduct(currencyCode),
    businessHasActivePromotion(profile.business.id),
  ]);

  const orderWins = wins
    .filter((win) => Boolean(win.eligibilityId))
    .map((win) => ({
      eligibilityId: win.eligibilityId as string,
      placement: win.placement,
      categoryName: win.categoryName,
      campaignYear: win.campaignYear,
      businessName: win.businessName || profile.business.publicName,
    }));

  const promoVariant =
    promotionProduct?.variants.find((variant) => variant.currencyCode === currencyCode) ??
    promotionProduct?.variants[0];

  const currentYear = orderWins.reduce((max, win) => Math.max(max, win.campaignYear), 0);

  return (
    <PageShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro
          eyebrow={community.name}
          title={`Promote ${profile.business.publicName}`}
          description="Order personalized trophies, plaques, and decals for every published win — or promote the listing monthly. No password required."
        />
        <div className="flex flex-wrap gap-2">
          <Link href={toRoute("/order")} className={cn(buttonVariants({ variant: "outline" }))}>
            Search again
          </Link>
          <Link href={toRoute("/cart")} className={cn(buttonVariants())}>
            Cart
          </Link>
        </div>
      </div>

      <div className="mt-12 space-y-14">
        <AwardProductShop
          businessName={profile.business.publicName}
          wins={orderWins}
          products={products}
          currencyCode={currencyCode}
          currentYear={currentYear || undefined}
        />

        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Promote your business
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Featured directory boost and ongoing visibility for this listing. Billed monthly —
                strong long-term indexing value alongside one-time award orders.
              </p>
            </div>
            <div>
              {promoVariant ? (
                <PromoteCheckoutPanel
                  businessId={profile.business.id}
                  communityId={community.id}
                  businessName={profile.business.publicName}
                  currencyCode={promoVariant.currencyCode}
                  priceCents={promoVariant.priceCents}
                  defaultEmail={session?.email ?? ""}
                  alreadyActive={alreadyPromoted}
                  returnPathPrefix={
                    usesPathCommunityUrls() ? `/c/${community.subdomain}` : ""
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Promotion checkout is temporarily unavailable.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Prefer the full profile?{" "}
        <Link
          href={toRoute(`/business/${profile.business.slug}`)}
          className="text-primary underline-offset-4 hover:underline"
        >
          View {profile.business.publicName}
        </Link>
      </p>
    </PageShell>
  );
}
