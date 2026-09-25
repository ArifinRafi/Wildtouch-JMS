import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BackOrder, serializeBackOrder } from "@/lib/models/BackOrder";

/** Alerts begin on day one of the delivery month and remain until delivery. */
export async function GET() {
  await connectDB();
  const now = new Date();
  const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  const docs = await BackOrder.find({ status: "scheduled", deliveryDate: { $lte: endOfMonth } })
    .sort({ deliveryDate: 1 })
    .limit(25)
    .lean();
  return NextResponse.json(docs.map(serializeBackOrder));
}
