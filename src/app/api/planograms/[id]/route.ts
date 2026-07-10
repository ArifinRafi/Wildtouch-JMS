import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import {
  Planogram,
  serializePlanogram,
  computeTotalUnits,
  cleanSides,
} from "@/lib/models/Planogram";
import { logActivity } from "@/lib/activity";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/planograms/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const doc = await Planogram.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializePlanogram(doc));
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/planograms/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (Array.isArray(body.sides)) {
    const sides = cleanSides(body.sides);
    patch.sides = sides;
    patch.totalUnits = computeTotalUnits(sides);
  }

  const updated = await Planogram.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "updated",
    entityType: "planogram",
    entityName: updated.name || "planogram",
    entityId: id,
    details: `changed ${Object.keys(patch).join(", ")}`,
  });
  return NextResponse.json(serializePlanogram(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/planograms/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await Planogram.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "planogram",
    entityName: deleted.name || "planogram",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
