import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Design, serializeDesign, DESIGN_STRING_FIELDS } from "@/lib/models/Design";

export async function GET(request: NextRequest) {
  await connectDB();
  const completed = request.nextUrl.searchParams.get("completed");
  const query = completed === "true" ? { completed: true } : {};
  const docs = await Design.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeDesign));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const k of DESIGN_STRING_FIELDS) data[k] = String(body[k] ?? "").trim();
  if (body.completed !== undefined) data.completed = Boolean(body.completed);
  const created = await Design.create(data);
  return NextResponse.json(serializeDesign(created.toObject()), { status: 201 });
}
