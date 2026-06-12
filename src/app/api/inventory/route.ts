import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component, serializeComponent } from "@/lib/models/Component";

export async function GET() {
  await connectDB();
  const docs = await Component.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeComponent));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  const components = Array.isArray(body.components)
    ? body.components
        .map((c: { label?: string; code?: string }) => ({
          label: String(c.label ?? "").trim(),
          code: String(c.code ?? "").trim(),
        }))
        .filter((c: { label: string; code: string }) => c.label || c.code)
    : [];

  const created = await Component.create({
    description: String(body.description ?? "").trim(),
    code: String(body.code ?? "").trim(),
    qtyAvailable: Math.max(0, Number(body.qtyAvailable) || 0),
    components,
  });

  return NextResponse.json(serializeComponent(created.toObject()), { status: 201 });
}
