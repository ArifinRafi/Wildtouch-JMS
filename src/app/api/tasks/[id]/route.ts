import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { Task, serializeTask, TASK_STATUS, TASK_PRIORITY } from "@/lib/models/Task";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  if (body.date !== undefined) patch.date = String(body.date).trim();
  if (body.employeeName !== undefined) patch.employeeName = String(body.employeeName).trim();
  if (body.taskName !== undefined) patch.taskName = String(body.taskName).trim();
  if (body.status !== undefined && TASK_STATUS.includes(body.status)) patch.status = body.status;
  if (body.priority !== undefined && TASK_PRIORITY.includes(body.priority)) patch.priority = body.priority;

  const updated = await Task.findByIdAndUpdate(id, patch, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeTask(updated));
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/tasks/[id]">,
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await Task.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
