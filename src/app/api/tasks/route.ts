import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Task, serializeTask, TASK_STATUS, TASK_PRIORITY } from "@/lib/models/Task";
import { Client } from "@/lib/models/Client";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  await connectDB();
  const date = request.nextUrl.searchParams.get("date");
  const query = date ? { date } : {};
  const docs = await Task.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeTask));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const status = TASK_STATUS.includes(body.status) ? body.status : "pending";
  const priority = TASK_PRIORITY.includes(body.priority) ? body.priority : "medium";
  const clientId = String(body.clientId ?? "").trim();
  const client = clientId ? await Client.findById(clientId, { name: 1 }).lean() : null;
  if (!client) {
    return NextResponse.json({ error: "a valid client is required" }, { status: 400 });
  }
  const created = await Task.create({
    date: String(body.date ?? "").trim(),
    employeeName: String(body.employeeName ?? "").trim(),
    clientId,
    clientName: String(client.name ?? "").trim(),
    taskName: String(body.taskName ?? "").trim(),
    note: String(body.note ?? "").trim(),
    status,
    priority,
  });
  await logActivity({
    action: "added",
    entityType: "task",
    entityName: created.taskName || "task",
    entityId: String(created._id),
    details: `${created.employeeName ? `for ${created.employeeName}` : ""}${created.clientName ? ` · client ${created.clientName}` : ""} on ${created.date}`.trim(),
  });
  return NextResponse.json(serializeTask(created.toObject()), { status: 201 });
}
