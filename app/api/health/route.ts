import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/database/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  let database: "ok" | "error" = "ok";
  let databaseMessage: string | null = null;

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("communities").select("id").limit(1);
    if (error) {
      database = "error";
      databaseMessage = error.message;
    }
  } catch (error) {
    database = "error";
    databaseMessage = error instanceof Error ? error.message : "Database check failed";
  }

  const ok = database === "ok";
  return NextResponse.json(
    {
      ok,
      service: "locals-choice-awards",
      timestamp,
      checks: {
        database,
        ...(databaseMessage ? { databaseMessage } : {}),
      },
    },
    { status: ok ? 200 : 503 },
  );
}
