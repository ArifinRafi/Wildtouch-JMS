import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  Planogram,
  serializePlanogram,
  computeTotalUnits,
} from "@/lib/models/Planogram";

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
    const sides = body.sides.map((s: { label?: string; rows?: { description?: string; defaultQty?: number }[] }, i: number) => ({
      label: String(s.label ?? `Side ${i + 1}`).trim() || `Side ${i + 1}`,
      rows: Array.isArray(s.rows)
        ? s.rows.map((r) => ({
            description: String(r.description ?? "").trim(),
            defaultQty: Math.max(0, Number(r.defaultQty) || 0),
          }))
        : [],
    }));
    patch.sides = sides;
    patch.totalUnits = computeTotalUnits(sides);
  }

  const updated = await Planogram.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializePlanogram(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/planograms/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await Planogram.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
