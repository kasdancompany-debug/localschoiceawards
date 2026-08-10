import { notFound } from "next/navigation";

import { BusinessSectionNav } from "@/components/businesses/business-section-nav";
import { BusinessCampaignTools } from "@/components/nominations/business-campaign-tools";
import { BusinessFinalistTools } from "@/components/voting/business-finalist-tools";
import { EmptyState } from "@/components/empty-state";
import { PageIntro, PageShell } from "@/components/layout/page-shell";
import { requireUser } from "@/lib/auth/session";
import {
  getManagedBusiness,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";
import { listCampaignsForCommunity } from "@/lib/campaigns/service";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import {
  buildNomineeShareCaption,
  buildQrDataUrl,
  buildSquareSocialSvg,
  buildStorySocialSvg,
  svgToDataUrl,
} from "@/lib/nominations/graphics";
import {
  buildNominationShareUrl,
  getBusinessNominationPresence,
} from "@/lib/nominations/service";
import {
  buildFinalistShareCaption,
  buildFinalistSquareSvg,
  buildFinalistStorySvg,
  buildVoteQrDataUrl,
  svgToDataUrl as voteSvgToDataUrl,
} from "@/lib/voting/graphics";
import {
  buildVoteShareUrl,
  getBusinessFinalistPresence,
} from "@/lib/voting/service";

type Props = { params: Promise<{ businessId: string }> };

export default async function BusinessCampaignsPage({ params }: Props) {
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

  const supabase = await createSupabaseServerClient();
  const { data: locations } = await supabase
    .from("business_locations")
    .select("id, community_id, location_name")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .eq("active", true);

  const primaryLocation = locations?.[0];
  if (!primaryLocation) {
    return (
      <PageShell>
        <BusinessSectionNav businessId={businessId} current="campaigns" />
        <PageIntro
          eyebrow={business.public_name}
          title="Campaigns"
          description="Add an active location before campaign tools unlock."
        />
        <div className="mt-8">
          <EmptyState
            title="No active locations"
            description="Campaign tools require at least one community location."
          />
        </div>
      </PageShell>
    );
  }

  const campaigns = await listCampaignsForCommunity(primaryLocation.community_id);
  const campaign =
    campaigns.find((item) => resolveCampaignState(item).canPublicReadCampaign) ?? campaigns[0];

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, subdomain")
    .eq("id", primaryLocation.community_id)
    .maybeSingle();

  if (!campaign || !community) {
    return (
      <PageShell>
        <BusinessSectionNav businessId={businessId} current="campaigns" />
        <PageIntro
          eyebrow={business.public_name}
          title="Campaigns"
          description="See which community seasons this business participates in."
        />
        <div className="mt-8">
          <EmptyState
            title="No campaign yet"
            description="Once a community campaign is published, nomination and finalist tools appear here."
          />
        </div>
      </PageShell>
    );
  }

  const presence = await getBusinessNominationPresence({
    businessId,
    campaignId: campaign.id,
  });
  const finalistPresence = await getBusinessFinalistPresence({
    businessId,
    campaignId: campaign.id,
  });

  const nominateUrl = buildNominationShareUrl({
    communitySubdomain: community.subdomain,
  });
  const voteUrl = buildVoteShareUrl({
    communitySubdomain: community.subdomain,
  });

  const nominateCaption = buildNomineeShareCaption({
    businessName: business.public_name,
    communityName: community.name,
    year: campaign.year,
    shareUrl: nominateUrl,
  });
  const finalistCaption = buildFinalistShareCaption({
    businessName: business.public_name,
    communityName: community.name,
    year: campaign.year,
    shareUrl: voteUrl,
  });

  const squareSvg = buildSquareSocialSvg({
    businessName: business.public_name,
    communityName: community.name,
    year: campaign.year,
  });
  const storySvg = buildStorySocialSvg({
    businessName: business.public_name,
    communityName: community.name,
    year: campaign.year,
  });
  const finalistSquare = buildFinalistSquareSvg({
    businessName: business.public_name,
    communityName: community.name,
    year: campaign.year,
  });
  const finalistStory = buildFinalistStorySvg({
    businessName: business.public_name,
    communityName: community.name,
    year: campaign.year,
  });

  const [nominateQr, voteQr] = await Promise.all([
    buildQrDataUrl(nominateUrl),
    buildVoteQrDataUrl(voteUrl),
  ]);

  return (
    <PageShell>
      <BusinessSectionNav businessId={businessId} current="campaigns" />
      <PageIntro
        eyebrow={business.public_name}
        title="Campaigns"
        description={`${community.name} · ${campaign.name}. Share tools never reveal exact nomination or vote totals.`}
      />
      <div className="mt-8 space-y-16">
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold">Nominations</h2>
          <BusinessCampaignTools
            businessName={business.public_name}
            communityName={community.name}
            year={campaign.year}
            shareUrl={nominateUrl}
            caption={nominateCaption}
            presence={presence.presence}
            squareSvgDataUrl={svgToDataUrl(squareSvg)}
            storySvgDataUrl={svgToDataUrl(storySvg)}
            qrDataUrl={nominateQr}
          />
        </section>
        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold">Finalists & voting</h2>
          <BusinessFinalistTools
            businessName={business.public_name}
            communityName={community.name}
            year={campaign.year}
            shareUrl={voteUrl}
            caption={finalistCaption}
            presence={finalistPresence.presence}
            squareSvgDataUrl={voteSvgToDataUrl(finalistSquare)}
            storySvgDataUrl={voteSvgToDataUrl(finalistStory)}
            qrDataUrl={voteQr}
          />
        </section>
      </div>
    </PageShell>
  );
}
