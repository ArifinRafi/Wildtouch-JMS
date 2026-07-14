import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Design, serializeDesign, DESIGN_STRING_FIELDS, DESIGN_STAGES, DESIGN_FINAL_STAGE } from "@/lib/models/Design";
import { logActivity } from "@/lib/activity";

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
  // Stage drives completion: the final stage marks the design finished → River.
  const stage = DESIGN_STAGES.includes(body.stage) ? body.stage : "New Design Request";
  data.stage = stage;
  data.completed = stage === DESIGN_FINAL_STAGE;
  const created = await Design.create(data);
  await logActivity({
    action: "added",
    entityType: "design",
    entityName: String(data.name || "design"),
    entityId: String(created._id),
  });
  return NextResponse.json(serializeDesign(created.toObject()), { status: 201 });
}
