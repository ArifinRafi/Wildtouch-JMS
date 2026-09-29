import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RiverOrder, serializeRiverOrder } from "@/lib/models/RiverOrder";
import { buildRiverExcel } from "@/lib/river-excel";

export const dynamic = "force-dynamic";

export async function GET() {
  await connectDB();
  const exportedAt = new Date();
  const docs = await RiverOrder.find({}).sort({ createdAt: -1 }).lean();
  const orders = docs.map(serializeRiverOrder);
  const stamp = exportedAt.toISOString().replace(/[:.]/g, "-");

  return new NextResponse(buildRiverExcel(orders, exportedAt), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="wildtouch-river-${stamp}.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
