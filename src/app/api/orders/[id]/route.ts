import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Order, serializeOrder } from "@/lib/models/Order";
import { logActivity } from "@/lib/activity";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const doc = await Order.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeOrder(doc));
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.notes !== undefined) patch.notes = String(body.notes);
  if (body.client !== undefined) patch.client = body.client;
  if (body.lineItems !== undefined) patch.lineItems = body.lineItems;
  if (body.componentRequirements !== undefined) {
    patch.componentRequirements = body.componentRequirements;
  }
  if (body.subtotal !== undefined) patch.subtotal = Number(body.subtotal) || 0;
  if (body.total !== undefined) patch.total = Number(body.total) || 0;
  if (body.inventoryDeducted !== undefined) {
    patch.inventoryDeducted = Boolean(body.inventoryDeducted);
  }

  const updated = await Order.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "updated",
    entityType: "order",
    entityName: updated.orderNumber || id,
    entityId: id,
    details: `changed ${Object.keys(patch).join(", ")}`,
  });
  return NextResponse.json(serializeOrder(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/orders/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await Order.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "order",
    entityName: deleted.orderNumber || id,
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
