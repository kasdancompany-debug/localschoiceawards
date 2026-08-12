import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AwardProductShop } from "@/components/commerce/award-product-shop";
import { PromoteCheckoutPanel } from "@/components/commerce/promote-checkout-panel";
import { PageShell } from "@/components/layout/page-shell";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { getPublicBusinessBySlug } from "@/lib/businesses";
import { listCartLines } from "@/lib/commerce/cart";
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
  const [wins, products, promotionProduct, alreadyPromoted, cartView] = await Promise.all([
    listPublicBusinessWins({
      businessId: profile.business.id,
      communityId: community.id,
    }),
    listActiveCatalogProducts(currencyCode),
    getBusinessPromotionProduct(currencyCode),
    businessHasActivePromotion(profile.business.id),
    listCartLines({ userId: session?.userId ?? null }).catch(() => null),
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
  const productByVariantId = new Map(
    products.flatMap((product) =>
      product.variants.map((variant) => [variant.id, product] as const),
    ),
  );

  const initialQuantities =
    cartView?.lines
      .map((line) => {
        const product = productByVariantId.get(line.item.productVariantId);
        if (!product || !line.item.awardEligibilityId) return null;
        return {
          productId: product.id,
          productVariantId: line.item.productVariantId,
          eligibilityId: line.item.awardEligibilityId,
          quantity: line.item.quantity,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row)) ?? [];

  const initialItemCount =
    cartView?.lines.reduce((sum, line) => sum + line.item.quantity, 0) ?? 0;
  const initialSubtotalCents =
    cartView?.lines.reduce((sum, line) => sum + line.lineTotalCents, 0) ?? 0;

  return (
    <PageShell>
      <div className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {community.name}
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
          {profile.business.publicName}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Promote your business and order awards. Use + / − to fill the cart at the bottom, then
          pay by card.
        </p>
        <Link
          href={toRoute("/order")}
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Search for another business
        </Link>
      </div>

      <div className="mt-12 space-y-14">
        <AwardProductShop
          businessName={profile.business.publicName}
          wins={orderWins}
          products={products}
          currencyCode={currencyCode}
          currentYear={currentYear || undefined}
          initialQuantities={initialQuantities}
          initialItemCount={initialItemCount}
          initialSubtotalCents={initialSubtotalCents}
        />

        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Promote your business
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Monthly featured placement for this listing. Separate from trophy orders.
          </p>
          <div className="mt-6 max-w-md">
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
        </section>
      </div>
    </PageShell>
  );
}
