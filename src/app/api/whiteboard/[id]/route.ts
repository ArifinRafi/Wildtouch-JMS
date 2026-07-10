import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  WhiteboardOrderModel,
  serializeWhiteboard,
  cleanWhiteboardBody,
} from "@/lib/models/WhiteboardOrder";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/whiteboard/[id]">,
) {
  const { id } = await ctx.params;
  await connectDB();
  const body = await request.json();
  const patch = cleanWhiteboardBody(body);
  const updated = await WhiteboardOrderModel.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "updated",
    entityType: "whiteboard order",
    entityName: (updated as { customerName?: string }).customerName || id,
    entityId: id,
  });
  return NextResponse.json(serializeWhiteboard(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/whiteboard/[id]">,
) {
  const { id } = await ctx.params;
  await connectDB();
  const deleted = await WhiteboardOrderModel.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "whiteboard order",
    entityName: (deleted as { customerName?: string }).customerName || id,
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
