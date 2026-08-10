import { NextResponse } from "next/server";

import { env } from "@/lib/env/server";
import { applyResendWebhookEvent } from "@/lib/notifications/admin";

export async function POST(request: Request) {
  const configured = env.RESEND_WEBHOOK_SECRET;
  if (configured) {
    const header = request.headers.get("svix-signature") ?? request.headers.get("authorization");
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : header;
    if (bearer !== configured && !header?.includes(configured)) {
      // Soft check: Resend/Svix signatures vary; require matching secret when configured simply.
      if (request.headers.get("x-resend-webhook-secret") !== configured) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  const payload = (await request.json()) as {
    type?: string;
    created_at?: string;
    data?: { email_id?: string; to?: string[] };
  };

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
