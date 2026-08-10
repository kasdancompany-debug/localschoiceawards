import "server-only";

import { createSupabaseServerClient } from "@/lib/database/supabase/server";
import { isReservedSubdomain } from "@/lib/communities/reserved";
import { mapCommunityRecord, type CommunityRecord } from "@/lib/communities/mappers";
import {
  getPilotCommunityBySubdomain,
  PILOT_COMMUNITIES,
} from "@/lib/communities/pilot-catalog";
import { isCommunityPubliclyAvailable, type Community } from "@/types/community";

const COMMUNITY_SELECT = `
  id,
  country_id,
  administrative_region_id,
  name,
  display_name,
  subdomain,
  slug,
  community_type,
  timezone,
  latitude,
  longitude,
  population,
  market_status,
  is_public,
  launched_at,
  created_at,
  updated_at,
  countries!inner (
    id,
    iso_code,
    name,
    currency_code,
    default_locale,
    active,
    created_at,
    updated_at
  ),
  administrative_regions!inner (
    id,
    country_id,
    code,
    name,
    region_type,
    active,
    created_at,
    updated_at
  )
`;

function asCommunityRecord(data: unknown): CommunityRecord | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  return data as CommunityRecord;
}

function allowPilotCatalogFallback(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.USE_PILOT_COMMUNITY_CATALOG === "true"
  );
}

export async function getCommunityBySubdomain(subdomain: string): Promise<Community | null> {
  const normalized = subdomain.trim().toLowerCase();
  if (!normalized || isReservedSubdomain(normalized)) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("communities")
      .select(COMMUNITY_SELECT)
      .eq("subdomain", normalized)
      .maybeSingle();

    if (!error && data) {
      const record = asCommunityRecord(data);
      if (record) {
        return mapCommunityRecord(record);
      }
    }
  } catch {
    // Fall through to pilot catalog in local/demo environments.
  }

  if (allowPilotCatalogFallback()) {
    return getPilotCommunityBySubdomain(normalized);
  }

  return null;
}

export async function getPublicCommunityBySubdomain(
  subdomain: string,
): Promise<Community | null> {
  const community = await getCommunityBySubdomain(subdomain);
  if (!community || !isCommunityPubliclyAvailable(community)) {
    return null;
  }
  return community;
}

export async function getCommunityById(communityId: string): Promise<Community | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("communities")
      .select(COMMUNITY_SELECT)
      .eq("id", communityId)
      .maybeSingle();

    if (!error && data) {
      const record = asCommunityRecord(data);
      if (record) {
        return mapCommunityRecord(record);
      }
    }
  } catch {
    // Fall through.
  }

  if (allowPilotCatalogFallback()) {
    return PILOT_COMMUNITIES.find((community) => community.id === communityId) ?? null;
  }

  return null;
}

/**
 * Resolve a community label from subdomain or alias. Never accepts a browser-supplied community ID.
 */
export async function resolveCommunityByHostLabel(label: string): Promise<Community | null> {
  const normalized = label.trim().toLowerCase();
  if (!normalized || isReservedSubdomain(normalized)) {
    return null;
  }

  const bySubdomain = await getCommunityBySubdomain(normalized);
  if (bySubdomain) {
    return bySubdomain;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: aliasRow, error } = await supabase
      .from("community_aliases")
      .select("community_id")
      .eq("normalized_alias", normalized)
      .maybeSingle();

    if (!error && aliasRow) {
      return getCommunityById(aliasRow.community_id);
    }
  } catch {
    // Fall through.
  }

  return null;
}
