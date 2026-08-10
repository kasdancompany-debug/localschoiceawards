import { NextResponse } from "next/server";
import { z } from "zod";

import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

const clickSchema = z.object({
  query: z.string().max(120).default(""),
  communityId: z.string().min(1),
  subdomain: z.string().min(1),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = clickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const distinctId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  await captureServerEvent(distinctId, ANALYTICS_EVENTS.communitySearchClick, {
    query: parsed.data.query,
    communityId: parsed.data.communityId,
    subdomain: parsed.data.subdomain,
    name: parsed.data.name,
  });

  return NextResponse.json({ ok: true });
}
