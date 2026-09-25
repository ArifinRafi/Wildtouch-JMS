import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { BackOrder, serializeBackOrder } from "@/lib/models/BackOrder";
import { createConfirmedOrder } from "@/lib/orders/create-confirmed-order";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/back-orders/[id]/deliver">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();

  const locked = await BackOrder.findOneAndUpdate(
    { _id: id, status: "scheduled" },
    { $set: { status: "delivering" } },
    { new: true },
  ).lean();
  if (!locked) {
    const existing = await BackOrder.findById(id).lean();
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ error: "back order is already delivered or being delivered" }, { status: 409 });
  }

  try {
    const result = await createConfirmedOrder({
      planogram: locked.planogram ?? undefined,
      client: locked.client as Record<string, unknown>,
      agent: locked.agent as Record<string, unknown>,
      orderSource: locked.orderSource,
      lineItems: locked.lineItems,
      componentRequirements: [],
      poNumber: locked.poNumber,
      referenceNumber: locked.referenceNumber,
      notes: locked.notes,
    });
    const delivered = await BackOrder.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "delivered",
          deliveredOrderId: result.order.id,
          deliveredOrderNumber: result.order.orderNumber,
          deliveredInvoiceId: result.invoice.id,
          deliveredAt: new Date(),
        },
      },
      { new: true },
    ).lean();
    await logActivity({
      action: "completed",
      entityType: "back order",
      entityName: locked.backOrderNumber,
      entityId: id,
      details: `converted to ${result.order.orderNumber}`,
    });
    return NextResponse.json({ backOrder: delivered ? serializeBackOrder(delivered) : null, ...result });
  } catch (error) {
    await BackOrder.updateOne({ _id: id, status: "delivering" }, { $set: { status: "scheduled" } });
    console.error("Could not deliver back order", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not deliver back order" }, { status: 500 });
  }
}
