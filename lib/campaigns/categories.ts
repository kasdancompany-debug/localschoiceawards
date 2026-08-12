import "server-only";

import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { withSoftTimeout } from "@/lib/async/soft-timeout";
import {
  mapCampaignCategory,
  mapCategoryGroup,
  mapMasterCategory,
  toPublicCampaignCategory,
} from "@/lib/campaigns/mappers";
import { resolveCampaignState } from "@/lib/campaigns/state";
import { findDuplicateCampaignCategorySlugs } from "@/lib/validation/campaigns";
import type { Campaign, PublicCampaignCategory } from "@/types/campaign";

export async function listPublicCampaignCategories(
  campaign: Campaign,
): Promise<PublicCampaignCategory[]> {
  const state = resolveCampaignState(campaign);
  if (!state.canPublicReadCampaign) {
    return [];
  }

  if (campaign.communityId.startsWith("pilot-")) {
    const { listPilotPublicCategories } = await import("@/lib/pilot/directory-catalog");
    return listPilotPublicCategories(campaign);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const query = supabase
      .from("campaign_categories")
      .select(
        `
      *,
      master_categories!inner (
        *,
        category_groups!inner (*)
      )
    `,
      )
      .eq("campaign_id", campaign.id)
      .eq("active", true)
      .order("display_order");

    const { data, error } = await withSoftTimeout(
      query,
      { data: null, error: null } as unknown as Awaited<typeof query>,
    );

    if (error || !data) {
      return [];
    }

    return data.flatMap((row) => {
      const masterRaw = row.master_categories as unknown;
      if (!masterRaw || typeof masterRaw !== "object") {
        return [];
      }
      const masterRow = masterRaw as {
        id: string;
        category_group_id: string;
        name: string;
        slug: string;
        description: string;
        active: boolean;
        display_order: number;
        created_at: string;
        updated_at: string;
        category_groups: {
          id: string;
          name: string;
          slug: string;
          description: string;
          display_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
      };

      if (!masterRow.active || !masterRow.category_groups?.active) {
        return [];
      }

      const category = mapCampaignCategory({
        id: row.id,
        campaign_id: row.campaign_id,
        master_category_id: row.master_category_id,
        local_name: row.local_name,
        local_slug: row.local_slug,
        local_description: row.local_description,
        finalist_limit: row.finalist_limit,
        minimum_nomination_count: row.minimum_nomination_count,
        active: row.active,
        display_order: row.display_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });

      return [
        toPublicCampaignCategory(
          category,
          mapMasterCategory(masterRow),
          mapCategoryGroup(masterRow.category_groups),
        ),
      ];
    });
  } catch {
    return [];
  }
}

export function assertUniqueCampaignCategorySlugs(
  categories: Array<{ id?: string; localSlug: string | null | undefined }>,
): void {
  const duplicates = findDuplicateCampaignCategorySlugs(categories);
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate campaign category slugs: ${duplicates.join(", ")}`,
    );
  }
}

export async function getPublicCampaignCategoryBySlug(
  campaign: Campaign,
  categorySlug: string,
): Promise<PublicCampaignCategory | null> {
  const normalized = categorySlug.trim().toLowerCase();
  const categories = await listPublicCampaignCategories(campaign);
  return (
    categories.find(
      (category) =>
        category.displaySlug === normalized || category.masterSlug === normalized,
    ) ?? null
  );
}
