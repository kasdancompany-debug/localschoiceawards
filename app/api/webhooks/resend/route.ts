import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env/server";
import { applyResendWebhookEvent } from "@/lib/notifications/admin";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Resend delivers Svix-signed webhooks. We accept either:
 * - Exact shared secret via `x-resend-webhook-secret` / Bearer (for simple setups)
 * - Svix-style HMAC over `${svix-id}.${svix-timestamp}.${rawBody}` using the signing secret
 */
function authorizeResendWebhook(request: Request, rawBody: string): boolean {
  const configured = env.RESEND_WEBHOOK_SECRET?.trim();
  if (!configured) {
    // Never allow unauthenticated webhook writes in production.
    return env.NODE_ENV !== "production";
  }

  const sharedHeader = request.headers.get("x-resend-webhook-secret");
  if (sharedHeader && safeEqual(sharedHeader, configured)) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice(7);
    if (safeEqual(bearer, configured)) return true;
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Reject stale timestamps (>5 minutes).
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 60 * 5) {
    return false;
  }

  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", configured).update(signedContent).digest("base64");
  const candidates = svixSignature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.includes(",") ? part.split(",")[1]! : part.replace(/^v1,/, "")));

  return candidates.some((candidate) => {
    try {
      return safeEqual(candidate, expected);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!authorizeResendWebhook(request, rawBody)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    type?: string;
    created_at?: string;
    data?: { email_id?: string; to?: string[] };
  };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.type || !payload.data) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await applyResendWebhookEvent({
    type: payload.type,
    createdAt: payload.created_at,
    data: payload.data,
  });

  return NextResponse.json(result);
}
