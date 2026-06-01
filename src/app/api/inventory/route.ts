import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component, serializeComponent } from "@/lib/models/Component";
import { INVENTORY_DATASETS } from "@/lib/data/inventory/catalog";

function slugForCategory(name: string): string {
  const ds = INVENTORY_DATASETS.find((d) => d.name === name);
  if (ds) return ds.slug;
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET(request: NextRequest) {
  await connectDB();
  const slug = request.nextUrl.searchParams.get("slug");
  const query = slug ? { slug } : {};
  const docs = await Component.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeComponent));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  const category = String(body.category ?? "").trim();
  if (!category) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }

  const components = Array.isArray(body.components)
    ? body.components
        .map((c: { label?: string; code?: string }) => ({
          label: String(c.label ?? "").trim(),
          code: String(c.code ?? "").trim(),
        }))
        .filter((c: { label: string; code: string }) => c.label || c.code)
    : [];

  const created = await Component.create({
    category,
    slug: body.slug ? String(body.slug) : slugForCategory(category),
    description: String(body.description ?? "").trim(),
    code: String(body.code ?? "").trim(),
    qtyAvailable: Math.max(0, Number(body.qtyAvailable) || 0),
    components,
  });

  return NextResponse.json(serializeComponent(created.toObject()), { status: 201 });
}
