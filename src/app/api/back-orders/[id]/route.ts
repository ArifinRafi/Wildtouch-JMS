import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { BackOrder, serializeBackOrder } from "@/lib/models/BackOrder";
import { normalizeOrderSource } from "@/lib/order-source";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/back-orders/[id]">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const doc = await BackOrder.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeBackOrder(doc));
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/back-orders/[id]">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const existing = await BackOrder.findById(id).lean();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.status !== "scheduled") {
    return NextResponse.json({ error: "delivered back orders cannot be changed" }, { status: 409 });
  }

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (body.deliveryDate !== undefined) {
    if (!DATE_PATTERN.test(String(body.deliveryDate))) {
      return NextResponse.json({ error: "a valid delivery date is required" }, { status: 400 });
    }
    patch.deliveryDate = String(body.deliveryDate);
  }
  if (body.poNumber !== undefined) patch.poNumber = String(body.poNumber);
  if (body.referenceNumber !== undefined) patch.referenceNumber = String(body.referenceNumber);
  if (body.notes !== undefined) patch.notes = String(body.notes);
  if (body.orderSource !== undefined) patch.orderSource = normalizeOrderSource(body.orderSource);
  if (Array.isArray(body.lineItems)) {
    const lines = body.lineItems
      .map((line: Record<string, unknown>) => ({
        code: String(line.code ?? ""),
        description: String(line.description ?? ""),
        category: String(line.category ?? ""),
        qtyOrdered: Math.max(0, Number(line.qtyOrdered) || 0),
      }))
      .filter((line: { description: string; qtyOrdered: number }) => line.description && line.qtyOrdered > 0);
    if (!lines.length) return NextResponse.json({ error: "at least one item is required" }, { status: 400 });
    patch.lineItems = lines;
  }

  const updated = await BackOrder.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "updated",
    entityType: "back order",
    entityName: updated.backOrderNumber,
    entityId: id,
    details: `changed ${Object.keys(patch).join(", ")}`,
  });
  return NextResponse.json(serializeBackOrder(updated));
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/back-orders/[id]">) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const deleted = await BackOrder.findOneAndDelete({ _id: id, status: "scheduled" }).lean();
  if (!deleted) return NextResponse.json({ error: "only scheduled back orders can be deleted" }, { status: 409 });
  await logActivity({ action: "deleted", entityType: "back order", entityName: deleted.backOrderNumber, entityId: id });
  return NextResponse.json({ ok: true });
}
