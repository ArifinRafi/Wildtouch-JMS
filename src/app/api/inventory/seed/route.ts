import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Component } from "@/lib/models/Component";
import { getAllCatalogItems } from "@/lib/data/inventory/catalog";

export async function POST(request: NextRequest) {
  await connectDB();

  const force = request.nextUrl.searchParams.get("force") === "1";
  const existing = await Component.estimatedDocumentCount();

  if (existing > 0 && !force) {
    return NextResponse.json({ seeded: false, count: existing });
  }

  if (force) {
    await Component.deleteMany({});
  }

  const docs = getAllCatalogItems().map((it) => ({
    description: it.description,
    code: it.code,
    components: it.components,
    qtyAvailable: it.qtyAvailable,
  }));

  await Component.insertMany(docs);
  return NextResponse.json({ seeded: true, count: docs.length });
}
