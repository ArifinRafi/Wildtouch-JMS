import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Design, serializeDesign, DESIGN_STRING_FIELDS, DESIGN_STAGES, DESIGN_FINAL_STAGE } from "@/lib/models/Design";
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

  const existing = await Design.findById(id).lean();
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  for (const k of Object.keys(body)) {
    if (STR.has(k)) patch[k] = String(body[k] ?? "").trim();
    else if (k === "completed" || k === "riverAcknowledged") patch[k] = Boolean(body[k]);
  }

  // Stage is authoritative for completion: set it and sync `completed` (drives River).
  let historyEntry: { from: string; to: string; note: string; revert: boolean; at: Date } | null = null;
  if (body.stage !== undefined && DESIGN_STAGES.includes(body.stage)) {
    const prevStage = String(existing.stage || (existing.completed ? DESIGN_FINAL_STAGE : "New Design Request"));
    if (body.stage !== prevStage) {
      const fromIdx = DESIGN_STAGES.indexOf(prevStage as (typeof DESIGN_STAGES)[number]);
      const toIdx = DESIGN_STAGES.indexOf(body.stage);
      const isRevert = fromIdx > -1 && toIdx > -1 && toIdx < fromIdx;
      const note = String(body.stageNote ?? "").trim();
      // Moving a design back to an earlier stage requires a reason.
      if (isRevert && !note) {
        return NextResponse.json(
          { error: "A note is required when moving a design back to an earlier stage." },
          { status: 400 },
        );
      }
      historyEntry = { from: prevStage, to: body.stage, note, revert: isRevert, at: new Date() };
    }
    patch.stage = body.stage;
    const nowFinal = body.stage === DESIGN_FINAL_STAGE;
    patch.completed = nowFinal;
    // Newly reaching the final stage → surface it in River again as a new design to order.
    if (nowFinal && !existing.completed) patch.riverAcknowledged = false;
  }

  const update: Record<string, unknown> = { $set: patch };
  if (historyEntry) update.$push = { stageHistory: historyEntry };
  const updated = await Design.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  const reachedFinal = patch.completed === true;
  await logActivity({
    action: reachedFinal ? "completed" : "updated",
    entityType: "design",
    entityName: updated.name || "design",
    entityId: id,
    details: historyEntry
      ? `stage ${historyEntry.revert ? "reverted" : "→"} ${historyEntry.from} → ${historyEntry.to}${historyEntry.note ? ` (${historyEntry.note})` : ""}`
      : `changed ${Object.keys(patch).join(", ")}`,
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
