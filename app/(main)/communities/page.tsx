import type { Metadata } from "next";

import { CommunitySearch } from "@/components/communities/community-search";
import { PageIntro, PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Communities",
  description:
    "Browse Locals Choice Awards communities across Canada and the United States by province, territory, or state.",
};

export default function CommunitiesPage() {
  return (
    <PageShell>
      <PageIntro
        eyebrow="Directory"
        title="Find a community"
        description="Search Canada and the United States. Active communities open on their own site. Planned markets show Coming Soon."
      />
      <div className="mt-10">
        <CommunitySearch showDirectory autoFocus />
      </div>
    </PageShell>
  );
}
