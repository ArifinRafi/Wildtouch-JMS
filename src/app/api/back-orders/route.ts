import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { BackOrder, nextBackOrderNumber, serializeBackOrder } from "@/lib/models/BackOrder";
import { normalizeOrderSource } from "@/lib/order-source";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  await connectDB();
  const docs = await BackOrder.find({}).sort({ deliveryDate: 1, createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeBackOrder));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const lineItems = Array.isArray(body.lineItems)
    ? body.lineItems
        .map((line: Record<string, unknown>) => ({
          code: String(line.code ?? ""),
          description: String(line.description ?? ""),
          category: String(line.category ?? ""),
          qtyOrdered: Math.max(0, Number(line.qtyOrdered) || 0),
        }))
        .filter((line: { description: string; qtyOrdered: number }) => line.description && line.qtyOrdered > 0)
    : [];

  if (!DATE_PATTERN.test(String(body.deliveryDate ?? ""))) {
    return NextResponse.json({ error: "a valid delivery date is required" }, { status: 400 });
  }
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (String(body.deliveryDate) <= todayKey) {
    return NextResponse.json({ error: "back order delivery must be a future date" }, { status: 400 });
  }
  if (!lineItems.length) return NextResponse.json({ error: "no line items" }, { status: 400 });
  if (!body.client?.name && !body.client?.clientId) {
    return NextResponse.json({ error: "client is required" }, { status: 400 });
  }

  const backOrderNumber = await nextBackOrderNumber();
  const doc = await BackOrder.create({
    backOrderNumber,
    deliveryDate: body.deliveryDate,
    status: "scheduled",
    planogram: body.planogram ?? {},
    client: body.client ?? {},
    agent: body.agent ?? {},
    orderSource: normalizeOrderSource(body.orderSource),
    lineItems,
    poNumber: String(body.poNumber ?? ""),
    referenceNumber: String(body.referenceNumber ?? ""),
    notes: String(body.notes ?? ""),
  });

  await logActivity({
    action: "added",
    entityType: "back order",
    entityName: backOrderNumber,
    entityId: String(doc._id),
    quantity: lineItems.reduce((sum: number, line: { qtyOrdered: number }) => sum + line.qtyOrdered, 0),
    details: `scheduled for ${body.deliveryDate} · ${body.client?.name || body.client?.clientId}`,
  });
  return NextResponse.json(serializeBackOrder(doc.toObject()), { status: 201 });
}
