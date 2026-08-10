import { getCampaignDeadlines } from "@/lib/campaigns/deadlines";
import type { Campaign } from "@/types/campaign";

type CampaignDeadlinesProps = {
  campaign: Campaign;
};

export function CampaignDeadlines({ campaign }: CampaignDeadlinesProps) {
  const deadlines = getCampaignDeadlines(campaign);

  return (
    <section aria-labelledby="campaign-deadlines-heading">
      <h2 id="campaign-deadlines-heading" className="font-heading text-2xl font-semibold tracking-tight">
        Key dates
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        All times are shown in {campaign.timezone.replace(/_/g, " ")}.
      </p>
      <ol className="mt-6 space-y-3">
        {deadlines.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium">{item.label}</span>
            <time dateTime={item.at} className="text-sm text-muted-foreground sm:text-right">
              {item.formatted}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
