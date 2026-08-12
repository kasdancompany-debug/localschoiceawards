import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env/server";

function secret(): string {
  const value =
    env.UNSUBSCRIBE_TOKEN_SECRET?.trim() ||
    env.NOTIFICATIONS_CRON_SECRET?.trim() ||
    "";
  if (!value) {
    if (env.NODE_ENV === "production") {
      throw new Error("UNSUBSCRIBE_TOKEN_SECRET (or NOTIFICATIONS_CRON_SECRET) must be configured.");
    }
    // Dev/test only — never used when production secrets are present.
    return "dev-only-unsubscribe-secret";
  }
  return value;
}

export function createUnsubscribeToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, v: 1 }), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUnsubscribeToken(token: string): { ok: true; userId: string } | { ok: false } {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return { ok: false };
  let expected: string;
  try {
    expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  } catch {
    return { ok: false };
  }
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  } catch {
    return { ok: false };
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
    };
    if (!parsed.userId) return { ok: false };
    return { ok: true, userId: parsed.userId };
  } catch {
    return { ok: false };
  }
}

export function unsubscribeUrl(userId: string): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(userId))}`;
}
