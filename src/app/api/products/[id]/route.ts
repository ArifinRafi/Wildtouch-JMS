import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Product, serializeProduct } from "@/lib/models/Product";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/products/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const doc = await Product.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeProduct(doc));
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/products/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.segment !== undefined) patch.segment = String(body.segment).trim();
  if (body.code !== undefined) patch.code = String(body.code).trim();
  if (body.image !== undefined) patch.image = body.image ? String(body.image) : null;
  if (body.defaultQty !== undefined) patch.defaultQty = Math.max(0, Number(body.defaultQty) || 0);
  if (Array.isArray(body.components)) {
    patch.components = body.components.map((c: { code?: string; label?: string; qtyPerUnit?: number }) => ({
      code: String(c.code ?? "").trim(),
      label: String(c.label ?? "").trim(),
      qtyPerUnit: Math.max(0, Number(c.qtyPerUnit) || 1),
    }));
  }

  const updated = await Product.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeProduct(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/products/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await Product.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
