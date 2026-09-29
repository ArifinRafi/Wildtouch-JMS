import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Design, serializeDesign, DESIGN_STRING_FIELDS } from "@/lib/models/Design";
import {
  DESIGN_DEFAULT_STAGE,
  DESIGN_FINAL_STAGE,
  isRiverReadyStage,
  isDesignStage,
} from "@/lib/design-stage";
import { logActivity } from "@/lib/activity";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  await connectDB();
  const completed = request.nextUrl.searchParams.get("completed");
  const riverReady = request.nextUrl.searchParams.get("riverReady");
  const docs = await Design.find({}).sort({ createdAt: -1 }).lean();
  let designs = docs.map(serializeDesign);
  if (completed === "true") designs = designs.filter((design) => design.completed);
  if (riverReady === "true") designs = designs.filter((design) => isRiverReadyStage(design.stage));
  return NextResponse.json(designs);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const k of DESIGN_STRING_FIELDS) data[k] = String(body[k] ?? "").trim();
  const alertDate = String(body.alertDate ?? "").trim();
  if (alertDate && !DATE_PATTERN.test(alertDate)) {
    return NextResponse.json({ error: "invalid alert date" }, { status: 400 });
  }
  data.alertDate = alertDate;
  // Template sends the design to River; Sample completes the tracker item.
  const stage = isDesignStage(body.stage) ? body.stage : DESIGN_DEFAULT_STAGE;
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
