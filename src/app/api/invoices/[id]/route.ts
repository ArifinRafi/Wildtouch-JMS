import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Invoice, serializeInvoice } from "@/lib/models/Invoice";
import { Order } from "@/lib/models/Order";
import { logActivity } from "@/lib/activity";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/invoices/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const doc = await Invoice.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeInvoice(doc));
}

/**
 * Delete an invoice (admin only). Deleting an invoice also deletes the order it
 * was generated from — and every other invoice tied to that same order (e.g.
 * partial-payment invoices), so no invoice is left pointing at a deleted order.
 */
export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/invoices/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  await connectDB();
  const invoice = await Invoice.findById(id).lean();
  if (!invoice) return NextResponse.json({ error: "not found" }, { status: 404 });

  const orderId = invoice.orderId ? String(invoice.orderId) : "";

  let deletedInvoices = 1;
  let orderDeleted = false;
  if (orderId && isValidObjectId(orderId)) {
    // Remove every invoice for this order (main + partials), then the order itself.
    const invRes = await Invoice.deleteMany({ orderId });
    deletedInvoices = invRes.deletedCount ?? 1;
    const ordRes = await Order.deleteOne({ _id: orderId });
    orderDeleted = (ordRes.deletedCount ?? 0) > 0;
  } else {
    await Invoice.findByIdAndDelete(id);
  }

  await logActivity({
    action: "deleted",
    entityType: "invoice",
    entityName: invoice.invoiceNumber || id,
    entityId: id,
    details: orderDeleted
      ? `order ${invoice.orderNumber || orderId} and ${deletedInvoices} invoice(s) removed`
      : "invoice removed",
  });

  return NextResponse.json({ ok: true, orderDeleted, deletedInvoices });
}
