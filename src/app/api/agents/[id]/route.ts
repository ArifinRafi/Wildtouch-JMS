import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Agent, serializeAgent } from "@/lib/models/Agent";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/agents/[id]">,
) {
  const { id } = await ctx.params;
  await connectDB();
  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const k of ["name", "address", "city", "contactNumber", "email"]) {
    if (body[k] !== undefined) patch[k] = String(body[k]).trim();
  }
  if (body.referredPoints !== undefined) patch.referredPoints = Math.max(0, Number(body.referredPoints) || 0);

  const updated = await Agent.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "updated",
    entityType: "agent",
    entityName: String(updated.name ?? "") || id,
    entityId: id,
    details: `changed ${Object.keys(patch).join(", ")}`,
  });
  return NextResponse.json(serializeAgent(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/agents/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  await connectDB();
  const deleted = await Agent.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "agent",
    entityName: String(deleted.name ?? "") || id,
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
