import { notFound } from "next/navigation";
import Link from "next/link";

import { BusinessSectionNav } from "@/components/businesses/business-section-nav";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";
import { placementLabel } from "@/lib/results/rules";
import {
  getSignedAwardAssetUrl,
  listAwardAssets,
  listBusinessAwardEligibilities,
} from "@/lib/results/service";
import { toRoute } from "@/lib/routes";
import type { AwardEligibility } from "@/types/results";

type Props = { params: Promise<{ businessId: string }> };

type EligibilityCard = {
  item: AwardEligibility;
  assets: Array<{ assetType: string; url: string | null }>;
};

async function loadCard(item: AwardEligibility): Promise<EligibilityCard> {
  const assets = await listAwardAssets(item.id);
  const withUrls = await Promise.all(
    assets.map(async (asset) => ({
      assetType: asset.assetType,
      url: await getSignedAwardAssetUrl(asset.storagePath),
    })),
  );
  return { item, assets: withUrls };
}

export default async function BusinessAwardsPage({ params }: Props) {
  const session = await requireUser({ next: "/businesses" });
  const { businessId } = await params;
  try {
    await requireBusinessMembership(businessId, session.userId);
  } catch {
    notFound();
  }

  const business = await getManagedBusiness(businessId);
  if (!business) {
    notFound();
  }

  const eligibilities = await listBusinessAwardEligibilities(businessId);
  const currentYear = new Date().getFullYear();
  const currentItems = eligibilities.filter(
    (item) =>
      item.eligibilityStatus === "active" && item.personalizedCampaignYear >= currentYear - 1,
  );
  const historicalItems = eligibilities.filter((item) => !currentItems.includes(item));

  const [current, historical] = await Promise.all([
    Promise.all(currentItems.map(loadCard)),
    Promise.all(historicalItems.map(loadCard)),
  ]);

  return (
    <PageShell>
      <BusinessSectionNav businessId={businessId} current="awards" />
      <PageIntro
        eyebrow={business.public_name}
        title="Awards"
        description="Current and historical wins with placements, personalization snapshots, and downloadable digital assets. Shop made-to-order recognition products from eligible wins."
      />

      <div className="mt-10 space-y-12">
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold">Current wins</h2>
          {current.length ? (
            current.map((card) => <EligibilityArticle key={card.item.id} card={card} />)
          ) : (
            <EmptyState
              title="No current wins"
              description="Published award eligibilities for recent campaigns appear here."
            />
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold">Historical wins</h2>
          {historical.length ? (
            historical.map((card) => (
              <EligibilityArticle key={card.item.id} card={card} showShop={false} />
            ))
          ) : (
            <EmptyState
              title="No historical wins yet"
              description="Earlier campaign eligibilities are listed here after publication."
            />
          )}
        </section>
      </div>
    </PageShell>
  );
}

function EligibilityArticle({
  card,
  showShop = true,
}: {
  card: EligibilityCard;
  showShop?: boolean;
}) {
  const { item, assets } = card;
  return (
    <article className="space-y-4 rounded-3xl border border-border/80 bg-card p-5">
      <div className="space-y-1 text-sm">
        <p className="font-heading text-xl font-semibold">
          {placementLabel(item.placement)} · {item.personalizedCategoryName}
        </p>
        <p>
          {item.personalizedCommunityName} · {item.personalizedCampaignYear}
        </p>
        <p className="text-muted-foreground">Snapshot name: {item.personalizedBusinessName}</p>
        <p>Status: {item.eligibilityStatus}</p>
        {item.revocationReason ? (
          <p className="text-muted-foreground">Revoked: {item.revocationReason}</p>
        ) : null}
      </div>
      {item.eligibilityStatus === "active" ? <AssetDownloads assets={assets} /> : null}
      {showShop && item.eligibilityStatus === "active" ? (
        <Link
          href={toRoute(`/awards?eligibilityId=${item.id}`)}
          className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
        >
          Shop recognition products
        </Link>
      ) : null}
    </article>
  );
}

function AssetDownloads({
  assets,
}: {
  assets: Array<{ assetType: string; url: string | null }>;
}) {
  if (!assets.length) {
    return (
      <p className="text-sm text-muted-foreground">Digital assets are generating or unavailable.</p>
    );
  }

  const labels: Record<string, string> = {
    badge_png: "Transparent PNG badge",
    square_svg: "Square social graphic",
    story_svg: "Story graphic",
    certificate_pdf: "Printable PDF certificate",
    qr_png: "QR code to winner page",
  };

  return (
    <div className="flex flex-wrap gap-2">
      {assets.map((asset) =>
        asset.url ? (
          <a
            key={asset.assetType}
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm hover:bg-muted"
          >
            Download {labels[asset.assetType] ?? asset.assetType}
          </a>
        ) : null,
      )}
    </div>
  );
}
