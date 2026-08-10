import type { PublicCampaignCategory } from "@/types/campaign";

export function groupPublicCategories(
  categories: PublicCampaignCategory[],
): Array<{
  groupSlug: string;
  groupName: string;
  categories: PublicCampaignCategory[];
}> {
  const map = new Map<
    string,
    { groupSlug: string; groupName: string; categories: PublicCampaignCategory[] }
  >();

  for (const category of categories) {
    const existing = map.get(category.groupSlug);
    if (existing) {
      existing.categories.push(category);
      continue;
    }
    map.set(category.groupSlug, {
      groupSlug: category.groupSlug,
      groupName: category.groupName,
      categories: [category],
    });
  }

  return [...map.values()].sort((a, b) => a.groupName.localeCompare(b.groupName));
}
