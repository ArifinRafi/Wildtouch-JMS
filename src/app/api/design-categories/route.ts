import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { DesignCategory, serializeDesignCategory, DEFAULT_DESIGN_CATEGORIES } from "@/lib/models/DesignCategory";

export async function GET() {
  await connectDB();
  // Seed the default categories once, when none exist yet.
  const count = await DesignCategory.estimatedDocumentCount();
  if (count === 0) {
    await DesignCategory.insertMany(DEFAULT_DESIGN_CATEGORIES.map((name) => ({ name })));
  }
  const docs = await DesignCategory.find({}).sort({ name: 1 }).lean();
  return NextResponse.json(docs.map(serializeDesignCategory));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // Case-insensitive dedupe — return the existing one if it already exists.
  const existing = await DesignCategory.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).lean();
  if (existing) return NextResponse.json(serializeDesignCategory(existing), { status: 200 });

  const created = await DesignCategory.create({ name });
  return NextResponse.json(serializeDesignCategory(created.toObject()), { status: 201 });
}
