import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Component, serializeComponent } from "@/lib/models/Component";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/inventory/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  await connectDB();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (body.description !== undefined) patch.description = String(body.description).trim();
  if (body.code !== undefined) patch.code = String(body.code).trim();
  if (body.category !== undefined) patch.category = String(body.category).trim();
  if (body.slug !== undefined) patch.slug = String(body.slug);
  if (body.qtyAvailable !== undefined) {
    patch.qtyAvailable = Math.max(0, Number(body.qtyAvailable) || 0);
  }
  if (Array.isArray(body.components)) {
    patch.components = body.components
      .map((c: { label?: string; code?: string }) => ({
        label: String(c.label ?? "").trim(),
        code: String(c.code ?? "").trim(),
      }))
      .filter((c: { label: string; code: string }) => c.label || c.code);
  }

  const updated = await Component.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(serializeComponent(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/inventory/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  await connectDB();
  const deleted = await Component.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
