import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { sessionUser } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { ProformaInvoice, serializeProformaInvoice } from "@/lib/models/ProformaInvoice";
import { Order } from "@/lib/models/Order";
import { prepareProforma, type ProformaInput } from "@/lib/orders/proforma";

async function canRead() {
  const user = await sessionUser();
  return user?.role === "admin" || user?.role === "manager";
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!await canRead()) return NextResponse.json({ error: "proforma access requires admin or manager" }, { status: 403 });
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const doc = await ProformaInvoice.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const approvalNeedsRetry = !!await Order.exists({ sourceProformaId: id });
  return NextResponse.json({ ...serializeProformaInvoice(doc as Record<string, unknown>), approvalNeedsRetry });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!await canRead()) return NextResponse.json({ error: "proforma access requires admin or manager" }, { status: 403 });
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  if (await Order.exists({ sourceProformaId: id })) {
    return NextResponse.json({ error: "approval has already created an order; retry approval to finish the conversion" }, { status: 409 });
  }
  try {
    const prepared = await prepareProforma(await request.json() as ProformaInput);
    const doc = await ProformaInvoice.findOneAndUpdate({ _id: id, status: "pending" }, prepared, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: "proforma is not available for editing" }, { status: 409 });
    try { await logActivity({ action: "updated", entityType: "proforma invoice", entityName: doc.proformaNumber, entityId: id }); }
    catch (error) { console.error("Proforma updated but activity logging failed", error); }
    return NextResponse.json(serializeProformaInvoice(doc as Record<string, unknown>));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not update proforma" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!await canRead()) return NextResponse.json({ error: "proforma access requires admin or manager" }, { status: 403 });
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  if (await Order.exists({ sourceProformaId: id })) {
    return NextResponse.json({ error: "approval has already created an order; retry approval to finish the conversion" }, { status: 409 });
  }
  const doc = await ProformaInvoice.findOneAndDelete({ _id: id, status: "pending" }).lean();
  if (!doc) return NextResponse.json({ error: "proforma is not available for deletion" }, { status: 409 });
  try { await logActivity({ action: "deleted", entityType: "proforma invoice", entityName: doc.proformaNumber, entityId: id }); }
  catch (error) { console.error("Proforma deleted but activity logging failed", error); }
  return NextResponse.json({ ok: true });
}
