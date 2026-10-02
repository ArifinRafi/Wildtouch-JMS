import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse, sessionUser } from "@/lib/authz";
import { Order, serializeOrder } from "@/lib/models/Order";
import { Invoice } from "@/lib/models/Invoice";
import { restoreInvoiceCredit } from "@/lib/credit-notes";
import { logActivity } from "@/lib/activity";
import { normalizeOrderSource } from "@/lib/order-source";

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
  const serialized = serializeOrder(doc);
  const user = await sessionUser();

  // Viewers can use the order's planogram, but must not receive invoice/pricing data.
  if (user?.role === "viewer") {
    const safeOrder: Record<string, unknown> = { ...serialized };
    for (const field of ["subtotal", "shipping", "vatRate", "vat", "total", "amountInvoiced", "creditApplied"]) {
      delete safeOrder[field];
    }
    safeOrder.lineItems = serialized.lineItems.map((item) => {
      if (!item || typeof item !== "object") return item;
      const safeItem = { ...(item as Record<string, unknown>) };
      delete safeItem.unitPrice;
      delete safeItem.lineTotal;
      return safeItem;
    });
    return NextResponse.json(safeOrder);
  }

  return NextResponse.json(serialized);
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
  if (body.agent !== undefined) patch.agent = body.agent;
  if (body.orderSource !== undefined) patch.orderSource = normalizeOrderSource(body.orderSource);
  if (body.lineItems !== undefined) patch.lineItems = body.lineItems;
  if (body.componentRequirements !== undefined) {
    patch.componentRequirements = body.componentRequirements;
  }
  if (body.subtotal !== undefined) patch.subtotal = Number(body.subtotal) || 0;
  if (body.total !== undefined) patch.total = Number(body.total) || 0;
  if (body.poNumber !== undefined) patch.poNumber = String(body.poNumber);
  if (body.referenceNumber !== undefined) patch.referenceNumber = String(body.referenceNumber);
  if (body.inventoryDeducted !== undefined) {
    patch.inventoryDeducted = Boolean(body.inventoryDeducted);
  }

  if (["client", "lineItems", "subtotal", "total"].some((field) => field in patch)) {
    const existing = await Order.findById(id, { creditApplied: 1 }).lean();
    if (existing && (existing.creditApplied ?? 0) > 0) {
      return NextResponse.json({ error: "credited order pricing and client cannot be changed; void and reissue its invoice first" }, { status: 409 });
    }
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
  const existing = await Order.findById(id).lean();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  const invoices = await Invoice.find({ orderId: id }).lean();
  if (invoices.some((invoice) => invoice.creditFinalized === false)) {
    return NextResponse.json({ error: "credit allocation is in progress; try deleting again shortly" }, { status: 409 });
  }
  const creditedIds = invoices.filter((invoice) => (invoice.creditApplied ?? 0) > 0 || invoice.creditReversalPending).map((invoice) => String(invoice._id));
  if (creditedIds.length) {
    await Invoice.updateMany({ _id: { $in: creditedIds } }, { $set: { creditReversalPending: true } });
    for (const invoiceId of creditedIds) await restoreInvoiceCredit(invoiceId);
  }
  await Invoice.deleteMany({ orderId: id });
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
