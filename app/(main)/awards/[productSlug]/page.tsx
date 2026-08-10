import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WinnerShopPanel } from "@/components/commerce/winner-shop-panel";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth/session";
import {
  formatMoney,
  getCatalogProductBySlug,
  listEligibilitiesForUser,
} from "@/lib/commerce";
import { toRoute } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ productSlug: string }>;
  searchParams: Promise<{ eligibilityId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getCatalogProductBySlug(productSlug);
  if (!product) {
    return { title: "Award product" };
  }
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function AwardProductPage({ params, searchParams }: Props) {
  const { productSlug } = await params;
  const query = await searchParams;
  const product = await getCatalogProductBySlug(productSlug);
  if (!product) {
    notFound();
  }

  const session = await getAuthenticatedSession();
  const eligibilities = session?.userId
    ? (await listEligibilitiesForUser(session.userId)).map((item) => ({
        id: item.id,
        businessName: item.personalized_business_name,
        communityName: item.personalized_community_name,
        categoryName: item.personalized_category_name,
        campaignYear: item.personalized_campaign_year,
        placement: item.placement,
      }))
    : [];

  return (
    <PageShell>
      <div className="mb-6">
        <Link href={toRoute("/awards")} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          ← All awards
        </Link>
      </div>
      <PageIntro
        eyebrow={product.productType}
        title={product.name}
        description={product.description}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Product price does not include shipping. Physical and bundle items require a separate
        shipping line item calculated after postal or ZIP entry.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {product.variants.map((variant) => (
          <span key={variant.id}>
            {variant.currencyCode}: {formatMoney(variant.priceCents, variant.currencyCode)}
          </span>
        ))}
      </div>

      <div className="mt-12 max-w-xl">
        <WinnerShopPanel
          product={product}
          eligibilities={eligibilities}
          initialEligibilityId={query.eligibilityId}
          signedIn={Boolean(session)}
        />
      </div>
    </PageShell>
  );
}
