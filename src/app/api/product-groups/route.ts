import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { ProductGroup, serializeProductGroup, DEFAULT_PRODUCT_GROUPS } from "@/lib/models/ProductGroup";
import { logActivity } from "@/lib/activity";

export async function GET() {
  await connectDB();
  // Seed the standard groups once, when none exist yet (fresh database).
  const count = await ProductGroup.estimatedDocumentCount();
  if (count === 0) {
    await ProductGroup.insertMany(DEFAULT_PRODUCT_GROUPS.map((name) => ({ name })));
  }
  const docs = await ProductGroup.find({}).sort({ name: 1 }).lean();
  return NextResponse.json(docs.map(serializeProductGroup));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  // Case-insensitive dedupe — return the existing one if it already exists.
  const existing = await ProductGroup.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }).lean();
  if (existing) return NextResponse.json(serializeProductGroup(existing), { status: 200 });

  const created = await ProductGroup.create({ name });
  await logActivity({
    action: "added",
    entityType: "product group",
    entityName: name,
    entityId: String(created._id),
  });
  return NextResponse.json(serializeProductGroup(created.toObject()), { status: 201 });
}
