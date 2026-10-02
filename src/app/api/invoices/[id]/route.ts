import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse, sessionUser } from "@/lib/authz";
import { Invoice, serializeInvoice } from "@/lib/models/Invoice";
import { Order } from "@/lib/models/Order";
import { logActivity } from "@/lib/activity";
import { isInvoicePaymentStatus } from "@/lib/invoice-status";
import { finalizeInvoiceCredit, restoreInvoiceCredit } from "@/lib/credit-notes";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/invoices/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  let doc = await Invoice.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (doc.creditFinalized === false && !doc.creditReversalPending) {
    try { doc = (await finalizeInvoiceCredit(id)).toObject(); }
    catch (error) { console.error("Invoice credit finalization needs retry", error); }
  }
  return NextResponse.json(serializeInvoice(doc));
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/invoices/[id]">,
) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") {
    return NextResponse.json({ error: "invoice updates require admin or manager" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  let body: { status?: unknown; comment?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid update" }, { status: 400 });

  const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
  const hasComment = Object.prototype.hasOwnProperty.call(body, "comment");
  if (hasStatus === hasComment) {
    return NextResponse.json({ error: "send a status or a comment" }, { status: 400 });
  }

  await connectDB();
  if (hasStatus) {
    if (!isInvoicePaymentStatus(body.status)) {
      return NextResponse.json({ error: "invalid invoice status" }, { status: 400 });
    }
    const doc = await Invoice.findByIdAndUpdate(id, { $set: { status: body.status } }, { returnDocument: "after", runValidators: true }).lean();
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    try { await logActivity({ action: "updated", entityType: "invoice", entityName: doc.invoiceNumber, entityId: id, details: `payment status changed to ${body.status}` }); }
    catch (error) { console.error("Invoice status saved but activity logging failed", error); }
    return NextResponse.json(serializeInvoice(doc));
  }

  if (typeof body.comment !== "string" || !body.comment.trim() || body.comment.trim().length > 2000) {
    return NextResponse.json({ error: "comment must be 1–2000 characters" }, { status: 400 });
  }
  const doc = await Invoice.findByIdAndUpdate(
    id,
    { $push: { comments: { text: body.comment.trim(), createdAt: new Date(), createdBy: user.name || user.email || "User" } } },
    { returnDocument: "after", runValidators: true },
  ).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  try { await logActivity({ action: "updated", entityType: "invoice", entityName: doc.invoiceNumber, entityId: id, details: "comment added" }); }
  catch (error) { console.error("Invoice comment saved but activity logging failed", error); }
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
  const related = orderId && isValidObjectId(orderId)
    ? await Invoice.find({ orderId }).lean()
    : [invoice];
  if (related.some((item) => item.creditFinalized === false)) {
    return NextResponse.json({ error: "credit allocation is in progress; try deleting again shortly" }, { status: 409 });
  }

  const creditedIds = related.filter((item) => (item.creditApplied ?? 0) > 0 || item.creditReversalPending).map((item) => String(item._id));
  if (creditedIds.length) {
    await Invoice.updateMany({ _id: { $in: creditedIds } }, { $set: { creditReversalPending: true } });
    for (const creditedId of creditedIds) await restoreInvoiceCredit(creditedId);
  }

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
