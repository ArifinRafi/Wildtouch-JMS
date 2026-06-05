import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, nextOrderNumber, serializeOrder } from "@/lib/models/Order";

export async function GET() {
  await connectDB();
  const docs = await Order.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeOrder));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  const orderNumber = await nextOrderNumber();

  const created = await Order.create({
    orderNumber,
    status: body.status ?? "received",
    planogram: {
      id: String(body.planogram?.id ?? ""),
      name: String(body.planogram?.name ?? ""),
    },
    client: body.client ?? {},
    lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
    componentRequirements: Array.isArray(body.componentRequirements)
      ? body.componentRequirements
      : [],
    subtotal: Number(body.subtotal) || 0,
    total: Number(body.total) || 0,
    notes: String(body.notes ?? ""),
  });

  return NextResponse.json(serializeOrder(created.toObject()), { status: 201 });
}
