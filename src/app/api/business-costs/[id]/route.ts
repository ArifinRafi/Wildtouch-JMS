import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { sessionUser } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { BusinessCost, serializeBusinessCost } from "@/lib/models/BusinessCost";
import { prepareBusinessCost, type BusinessCostInput } from "@/lib/business-cost";

async function canWrite() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") {
    return NextResponse.json({ error: "cost updates require admin or manager" }, { status: 403 });
  }
  return null;
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await canWrite();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  let input: BusinessCostInput;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "invalid business cost" }, { status: 400 });
  }

  await connectDB();
  try {
    const prepared = prepareBusinessCost(input);
    const updated = await BusinessCost.findByIdAndUpdate(id, { $set: prepared }, { returnDocument: "after", runValidators: true });
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    try { await logActivity({ action: "updated", entityType: "business cost", entityName: prepared.productService, entityId: id, details: prepared.paid ? `paid ${prepared.paymentDate}` : "outstanding" }); }
    catch (error) { console.error("Business cost updated but activity logging failed", error); }
    return NextResponse.json(serializeBusinessCost(updated));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not update business cost" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = await canWrite();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const deleted = await BusinessCost.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  try { await logActivity({ action: "deleted", entityType: "business cost", entityName: deleted.productService, entityId: id }); }
  catch (error) { console.error("Business cost deleted but activity logging failed", error); }
  return NextResponse.json({ ok: true });
}
