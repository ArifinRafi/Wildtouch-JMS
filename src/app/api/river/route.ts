import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { RiverOrder, serializeRiverOrder } from "@/lib/models/RiverOrder";

export async function GET() {
  await connectDB();
  const docs = await RiverOrder.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeRiverOrder));
}

function cleanNotes(raw: unknown): { date: string; note: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((n) => ({ date: String((n as { date?: string })?.date ?? "").trim(), note: String((n as { note?: string })?.note ?? "").trim() }))
    .filter((n) => n.date || n.note);
}

function clean(body: Record<string, unknown>) {
  return {
    orderNumber: String(body.orderNumber ?? "").trim(),
    date: String(body.date ?? "").trim(),
    product: String(body.product ?? "").trim(),
    description: String(body.description ?? "").trim(),
    quantity: Math.max(0, Number(body.quantity) || 0),
    quantityReceived: Math.max(0, Number(body.quantityReceived) || 0),
    priority: String(body.priority ?? "").trim(),
    shipmentMethod: String(body.shipmentMethod ?? "").trim(),
    progressNotes: String(body.progressNotes ?? "").trim(),
    notesLog: cleanNotes(body.notesLog),
    dateRequested: String(body.dateRequested ?? "").trim(),
    datePaid: String(body.datePaid ?? "").trim(),
    valueRmb: Math.max(0, Number(body.valueRmb) || 0),
    valueGbp: Math.max(0, Number(body.valueGbp) || 0),
    componentId: String(body.componentId ?? "").trim(),
    componentCode: String(body.componentCode ?? "").trim(),
    componentLabel: String(body.componentLabel ?? "").trim(),
  };
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const data = clean(body);
  const created = await RiverOrder.create(data);
  return NextResponse.json(serializeRiverOrder(created.toObject()), { status: 201 });
}
