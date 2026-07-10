import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { RiverOrder, serializeRiverOrder } from "@/lib/models/RiverOrder";
import { Component } from "@/lib/models/Component";
import { logActivity } from "@/lib/activity";

/**
 * Complete (fully or partially) a River order. `qty` units are moved into the
 * main inventory as a NEW component (created on the first receipt, topped up on
 * later ones) and deducted from the River order's outstanding quantity.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/river/[id]/receive">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();
  const qty = Math.floor(Math.max(0, Number(body.qty) || 0));
  if (qty <= 0) {
    return NextResponse.json({ error: "qty must be greater than 0" }, { status: 400 });
  }

  const order = await RiverOrder.findById(id);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Add qty to the main inventory: create the component on first receipt, else top up.
  if (order.componentId && isValidObjectId(order.componentId)) {
    await Component.updateOne({ _id: order.componentId }, { $inc: { qtyAvailable: qty } });
  } else {
    const name = [order.product, order.description].filter((s) => s && String(s).trim()).join(" - ")
      || order.orderNumber || "River component";
    const created = await Component.create({
      description: name,
      code: "",
      qtyAvailable: qty,
      components: [],
    });
    order.componentId = String(created._id);
    order.componentCode = created.code || "";
    order.componentLabel = name;
  }

  order.quantityReceived = Math.max(0, (order.quantityReceived ?? 0) + qty);
  await order.save();

  const outstanding = Math.max(0, (order.quantity ?? 0) - (order.quantityReceived ?? 0));
  await logActivity({
    action: "received",
    entityType: "river order",
    entityName: order.componentLabel || order.product || order.orderNumber || "river order",
    entityId: id,
    quantity: qty,
    details: outstanding > 0 ? `partial — ${outstanding} still outstanding` : "order fully received, added to inventory",
  });

  return NextResponse.json({ order: serializeRiverOrder(order.toObject()), componentUpdated: true });
}
