import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, serializeProduct } from "@/lib/models/Product";

export async function GET(request: NextRequest) {
  await connectDB();
  const planogramId = request.nextUrl.searchParams.get("planogramId");
  const query = planogramId ? { planogramId } : {};
  const docs = await Product.find(query).sort({ name: 1 }).lean();
  return NextResponse.json(docs.map(serializeProduct));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const components = Array.isArray(body.components)
    ? body.components.map((c: { code?: string; label?: string; qtyPerUnit?: number }) => ({
        code: String(c.code ?? "").trim(),
        label: String(c.label ?? "").trim(),
        qtyPerUnit: Math.max(0, Number(c.qtyPerUnit) || 1),
      }))
    : [];

  const created = await Product.create({
    name,
    planogramId: String(body.planogramId ?? "").trim(),
    planogramName: String(body.planogramName ?? "").trim(),
    segment: String(body.segment ?? "").trim(),
    image: body.image ?? null,
    defaultQty: Math.max(0, Number(body.defaultQty) || 1),
    code: String(body.code ?? "").trim(),
    components,
  });

  return NextResponse.json(serializeProduct(created.toObject()), { status: 201 });
}
