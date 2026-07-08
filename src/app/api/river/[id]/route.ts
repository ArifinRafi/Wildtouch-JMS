import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { RiverOrder, serializeRiverOrder } from "@/lib/models/RiverOrder";

const NUM = new Set(["quantity", "quantityReceived", "valueRmb", "valueGbp"]);
const STR = new Set([
  "orderNumber", "date", "product", "description", "priority", "shipmentMethod", "progressNotes",
  "dateRequested", "datePaid", "componentId", "componentCode", "componentLabel",
]);

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/river/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  for (const k of Object.keys(body)) {
    if (NUM.has(k)) patch[k] = Math.max(0, Number(body[k]) || 0);
    else if (STR.has(k)) patch[k] = String(body[k] ?? "").trim();
  }
  if (Array.isArray(body.notesLog)) {
    patch.notesLog = body.notesLog
      .map((n: { date?: string; note?: string }) => ({ date: String(n?.date ?? "").trim(), note: String(n?.note ?? "").trim() }))
      .filter((n: { date: string; note: string }) => n.date || n.note);
  }

  const updated = await RiverOrder.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeRiverOrder(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/river/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await RiverOrder.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
