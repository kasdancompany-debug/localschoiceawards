import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { listOrdersForAdmin, ordersToCsv } from "@/lib/orders/queries";

export async function GET(request: Request) {
  await requireAdminSession("/admin/orders");
  const url = new URL(request.url);
  const paymentStatus = url.searchParams.get("paymentStatus") ?? undefined;
  const orders = await listOrdersForAdmin({ paymentStatus: paymentStatus ?? undefined, limit: 500 });
  const csv = ordersToCsv(orders);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-export.csv"`,
    },
  });
}
