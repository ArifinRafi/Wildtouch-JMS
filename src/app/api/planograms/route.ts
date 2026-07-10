import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  Planogram,
  serializePlanogram,
  slugify,
  computeTotalUnits,
  cleanSides,
} from "@/lib/models/Planogram";
import { logActivity } from "@/lib/activity";

export async function GET() {
  await connectDB();
  const docs = await Planogram.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializePlanogram));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const sides = cleanSides(body.sides);
  if (sides.length === 0) {
    return NextResponse.json({ error: "at least one side is required" }, { status: 400 });
  }

  // Unique-ish slug: append a short suffix if the base already exists.
  const base = slugify(name) || "planogram";
  let slug = base;
  if (await Planogram.exists({ slug })) {
    slug = `${base}-${Date.now().toString(36).slice(-4)}`;
  }

  const created = await Planogram.create({
    name,
    slug,
    sides,
    totalUnits: computeTotalUnits(sides),
    source: "custom",
  });

  await logActivity({
    action: "added",
    entityType: "planogram",
    entityName: name,
    entityId: String(created._id),
  });

  return NextResponse.json(serializePlanogram(created.toObject()), { status: 201 });
}
