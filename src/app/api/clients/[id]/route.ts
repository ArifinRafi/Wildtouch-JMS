import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Client, serializeClient } from "@/lib/models/Client";
import { logActivity } from "@/lib/activity";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/clients/[id]">,
) {
  const { id } = await ctx.params;
  await connectDB();
  const doc = await Client.findById(id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeClient(doc));
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/clients/[id]">,
) {
  const { id } = await ctx.params;
  await connectDB();
  const body = await request.json();
  const { id: _ignore, _id: _ignore2, ...patch } = body;
  void _ignore;
  void _ignore2;

  const updated = await Client.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "updated",
    entityType: "client",
    entityName: (updated as { name?: string }).name || id,
    entityId: id,
    details: `changed ${Object.keys(patch).join(", ")}`,
  });
  return NextResponse.json(serializeClient(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/clients/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  await connectDB();
  const deleted = await Client.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "client",
    entityName: (deleted as { name?: string }).name || id,
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
