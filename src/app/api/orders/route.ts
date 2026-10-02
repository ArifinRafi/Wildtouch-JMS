import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, nextOrderNumber, serializeOrder } from "@/lib/models/Order";
import { ensureOrderOnWhiteboard } from "@/lib/models/WhiteboardOrder";
import { normalizeOrderSource } from "@/lib/order-source";
import { sessionUser } from "@/lib/authz";

export async function GET() {
  await connectDB();
  const docs = await Order.find({}).sort({ createdAt: -1 }).lean();
  const orders = docs.map(serializeOrder);
  const user = await sessionUser();
  if (user?.role === "viewer") {
    return NextResponse.json(orders.map((order) => {
      const safeOrder: Record<string, unknown> = { ...order };
      for (const field of ["subtotal", "shipping", "vatRate", "vat", "total", "amountInvoiced", "creditApplied"]) delete safeOrder[field];
      safeOrder.lineItems = order.lineItems.map((item) => {
        if (!item || typeof item !== "object") return item;
        const safeItem = { ...(item as Record<string, unknown>) };
        delete safeItem.unitPrice;
        delete safeItem.lineTotal;
        return safeItem;
      });
      return safeOrder;
    }));
  }
  return NextResponse.json(orders);
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
    agent: body.agent ?? {},
    orderSource: normalizeOrderSource(body.orderSource),
    lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
    componentRequirements: Array.isArray(body.componentRequirements)
      ? body.componentRequirements
      : [],
    subtotal: Number(body.subtotal) || 0,
    total: Number(body.total) || 0,
    poNumber: String(body.poNumber ?? ""),
    referenceNumber: String(body.referenceNumber ?? ""),
    notes: String(body.notes ?? ""),
  });

  try {
    await ensureOrderOnWhiteboard({
      orderId: String(created._id),
      orderNumber,
      customerName: String(body.client?.name || body.client?.clientId || "Client"),
      planogramName: String(body.planogram?.name ?? ""),
      agentName: String(body.agent?.name ?? ""),
      notes: String(body.notes ?? ""),
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
    });
  } catch (error) {
    await Order.deleteOne({ _id: created._id });
    console.error("Could not create Digital Whiteboard task", error);
    return NextResponse.json(
      { error: "could not add order to the digital whiteboard" },
      { status: 500 },
    );
  }

  return NextResponse.json(serializeOrder(created.toObject()), { status: 201 });
}
