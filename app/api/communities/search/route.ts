import { NextResponse } from "next/server";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { listPublicCommunitySearchRecords } from "@/lib/communities/catalog";
import { filterCommunitySearchRecords } from "@/lib/communities/search";
import { communitySearchQuerySchema } from "@/lib/validation/public-forms";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = communitySearchQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? "40",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search query." }, { status: 400 });
  }

  const catalog = await listPublicCommunitySearchRecords();
  const matches = filterCommunitySearchRecords(catalog, parsed.data.q).slice(
    0,
    parsed.data.limit,
  );

  const distinctId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";

  await captureServerEvent(distinctId, ANALYTICS_EVENTS.communitySearch, {
    query: parsed.data.q,
    resultCount: matches.length,
  });

  if (parsed.data.q.trim() && matches.length === 0) {
    await captureServerEvent(distinctId, ANALYTICS_EVENTS.communitySearchZeroResults, {
      query: parsed.data.q,
    });
  }

  return NextResponse.json({
    query: parsed.data.q,
    count: matches.length,
    results: matches,
  });
}
