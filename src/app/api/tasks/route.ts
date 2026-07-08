import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Task, serializeTask, TASK_STATUS, TASK_PRIORITY } from "@/lib/models/Task";

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
  const created = await Task.create({
    date: String(body.date ?? "").trim(),
    employeeName: String(body.employeeName ?? "").trim(),
    taskName: String(body.taskName ?? "").trim(),
    status,
    priority,
  });
  return NextResponse.json(serializeTask(created.toObject()), { status: 201 });
}
