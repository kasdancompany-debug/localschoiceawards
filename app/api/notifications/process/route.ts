import { NextResponse } from "next/server";

import { env } from "@/lib/env/server";
import { processQueuedNotificationEvents } from "@/lib/notifications/process";

function authorized(request: Request): boolean {
  const secret = env.NOTIFICATIONS_CRON_SECRET;
  if (!secret) return env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const query = new URL(request.url).searchParams.get("secret");
  return bearer === secret || query === secret;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const result = await processQueuedNotificationEvents(
    typeof body.limit === "number" ? body.limit : 25,
  );
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "25");
  const result = await processQueuedNotificationEvents(
    Number.isFinite(limit) ? limit : 25,
  );
  return NextResponse.json(result);
}
