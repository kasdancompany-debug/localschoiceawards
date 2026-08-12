import { NextResponse } from "next/server";

import { businessAnalyticsToCsv, getBusinessAnalytics } from "@/lib/analytics/business-reports";
import { parseDateRange } from "@/lib/analytics/rules";
import { requireUser } from "@/lib/auth/session";
import {
  listMembershipsForUser,
  requireBusinessMembership,
} from "@/lib/businesses/memberships";

type Props = {
  params: Promise<{ businessId: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const session = await requireUser({ next: "/businesses" });
  const { businessId } = await params;
  await requireBusinessMembership(businessId, session.userId);
  const memberships = await listMembershipsForUser(session.userId);
  const url = new URL(request.url);
  const range = parseDateRange({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });

  const summary = await getBusinessAnalytics({
    actor: {
      kind: "business_member",
      userId: session.userId,
      businessIds: memberships.map((m) => m.businessId),
    },
    businessId,
    from: range.from,
    to: range.to,
  });

  if (!summary) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv = businessAnalyticsToCsv(summary);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="business-analytics-${businessId}.csv"`,
    },
  });
}
