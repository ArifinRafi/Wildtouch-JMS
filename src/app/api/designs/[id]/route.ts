import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Design, serializeDesign, DESIGN_STRING_FIELDS } from "@/lib/models/Design";
import { logActivity } from "@/lib/activity";

const STR = new Set<string>(DESIGN_STRING_FIELDS);

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/designs/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  for (const k of Object.keys(body)) {
    if (STR.has(k)) patch[k] = String(body[k] ?? "").trim();
    else if (k === "completed" || k === "riverAcknowledged") patch[k] = Boolean(body[k]);
  }

  const updated = await Design.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: patch.completed === true ? "completed" : "updated",
    entityType: "design",
    entityName: updated.name || "design",
    entityId: id,
    details: patch.completed === true ? "" : `changed ${Object.keys(patch).join(", ")}`,
  });
  return NextResponse.json(serializeDesign(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/designs/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await Design.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "design",
    entityName: deleted.name || "design",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
