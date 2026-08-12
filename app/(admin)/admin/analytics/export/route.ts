import { NextResponse } from "next/server";

import {
  adminAnalyticsToCsv,
  adminCommunityContributionToCsv,
  getAdminAnalyticsDashboard,
} from "@/lib/analytics/admin-reports";
import { parseDateRange } from "@/lib/analytics/rules";
import { requireAdminSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await requireAdminSession("/admin/analytics");
  const url = new URL(request.url);
  const range = parseDateRange({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  const communityId = url.searchParams.get("communityId");
  const dataset = url.searchParams.get("dataset") ?? "summary";

  const dashboard = await getAdminAnalyticsDashboard({
    actor: { kind: "admin", userId: session.userId },
    from: range.from,
    to: range.to,
    communityId,
  });

  if (!dashboard) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv =
    dataset === "communities"
      ? adminCommunityContributionToCsv(dashboard)
      : adminAnalyticsToCsv(dashboard);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="admin-analytics-${dataset}.csv"`,
    },
  });
}
