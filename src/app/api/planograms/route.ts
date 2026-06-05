import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  Planogram,
  serializePlanogram,
  slugify,
  computeTotalUnits,
} from "@/lib/models/Planogram";

interface SideInput {
  label?: string;
  rows?: { description?: string; defaultQty?: number }[];
}

function cleanSides(raw: unknown): { label: string; rows: { description: string; defaultQty: number }[] }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s: SideInput, i) => ({
    label: String(s.label ?? `Side ${i + 1}`).trim() || `Side ${i + 1}`,
    rows: Array.isArray(s.rows)
      ? s.rows
          .map((r) => ({
            description: String(r.description ?? "").trim(),
            defaultQty: Math.max(0, Number(r.defaultQty) || 0),
          }))
          .filter((r) => r.description || r.defaultQty > 0)
      : [],
  }));
}

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

  return NextResponse.json(serializePlanogram(created.toObject()), { status: 201 });
}
