import "server-only";

import type { Campaign } from "@/types/campaign";
import type { Community } from "@/types/community";
import { getCommunityCanonicalUrl } from "@/lib/communities/metadata";

export function buildCommunityJsonLd(input: {
  community: Community;
  campaign: Campaign | null;
  pathname?: string;
}) {
  const url = getCommunityCanonicalUrl(input.community, input.pathname ?? "/");
  const organization = {
    "@type": "Organization",
    name: input.community.displayName,
    url,
    parentOrganization: {
      "@type": "Organization",
      name: "Locals Choice Awards",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: input.community.name,
      addressRegion: input.community.region.code,
      addressCountry: input.community.country.isoCode,
    },
  };

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "WebSite",
      name: input.community.displayName,
      url,
      description: `Locals Choice Awards for ${input.community.name}.`,
      publisher: organization,
    },
  ];

  if (input.campaign) {
    graph.push({
      "@type": "Event",
      name: input.campaign.name,
      startDate: input.campaign.nominationOpensAt,
      endDate: input.campaign.resultsPublishAt,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: {
        "@type": "VirtualLocation",
        url,
      },
      organizer: organization,
      description: `${input.campaign.year} Locals Choice Awards season for ${input.community.name}.`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
