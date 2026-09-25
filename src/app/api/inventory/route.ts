import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component, serializeComponent } from "@/lib/models/Component";
import { logActivity } from "@/lib/activity";
import { isResponse, requireInventoryWriteAccess } from "@/lib/authz";
import { productNameOnly } from "@/lib/product-title";

export async function GET() {
  await connectDB();
  const docs = await Component.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeComponent));
}

export async function POST(request: NextRequest) {
  const gate = await requireInventoryWriteAccess();
  if (isResponse(gate)) return gate;

  await connectDB();
  const body = await request.json();
  const productLine = String(body.productLine ?? "").trim();
  const description = productNameOnly(productLine, body.description);
  if (!productLine || !description) {
    return NextResponse.json({ error: "productLine and description are required" }, { status: 400 });
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
    productLine,
    description,
    code: String(body.code ?? "").trim(),
    qtyAvailable: Math.max(0, Number(body.qtyAvailable) || 0),
    components,
  });

  await logActivity({
    action: "added",
    entityType: "component",
    entityName: created.description || created.code || "component",
    entityId: String(created._id),
    quantity: created.qtyAvailable,
  });

  return NextResponse.json(serializeComponent(created.toObject()), { status: 201 });
}
