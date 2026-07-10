import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  WhiteboardOrderModel,
  nextWhiteboardId,
  serializeWhiteboard,
  cleanWhiteboardBody,
} from "@/lib/models/WhiteboardOrder";
import { logActivity } from "@/lib/activity";

export async function GET() {
  await connectDB();
  const docs = await WhiteboardOrderModel.find({}).sort({ date: -1 }).lean();
  return NextResponse.json(docs.map(serializeWhiteboard));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const data = cleanWhiteboardBody(body);
  if (!data.customerName) return NextResponse.json({ error: "customerName is required" }, { status: 400 });
  const _id = await nextWhiteboardId();
  const created = await WhiteboardOrderModel.create({ _id, ...data });
  await logActivity({
    action: "added",
    entityType: "whiteboard order",
    entityName: String(data.customerName ?? "") || _id,
    entityId: _id,
  });
  return NextResponse.json(serializeWhiteboard(created.toObject()), { status: 201 });
}
