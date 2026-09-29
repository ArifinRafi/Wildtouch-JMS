import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { isResponse, requireAdmin } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { WastageLog, serializeWastageLog } from "@/lib/models/WastageLog";
import { prepareWastage, type WastageInput } from "@/lib/wastage";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/wastage/[id]">) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  let input: WastageInput;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "invalid wastage entry" }, { status: 400 });

  await connectDB();
  try {
    const prepared = await prepareWastage(input);
    const updated = await WastageLog.findByIdAndUpdate(id, { $set: prepared }, { returnDocument: "after", runValidators: true });
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    try { await logActivity({ action: "updated", entityType: "wastage log", entityName: prepared.orderNumber, entityId: id }); }
    catch (error) { console.error("Wastage updated but activity logging failed", error); }
    return NextResponse.json(serializeWastageLog(updated));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not update wastage entry" }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/wastage/[id]">) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  await connectDB();
  const deleted = await WastageLog.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  try { await logActivity({ action: "deleted", entityType: "wastage log", entityName: deleted.orderNumber, entityId: id }); }
  catch (error) { console.error("Wastage deleted but activity logging failed", error); }
  return NextResponse.json({ ok: true });
}
