import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "locals-choice-awards",
    timestamp: new Date().toISOString(),
  });
}
