import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { getOrderablePlanograms } from "@/lib/data/planograms";

export async function POST(request: NextRequest) {
  await connectDB();

  const force = request.nextUrl.searchParams.get("force") === "1";
  const existing = await Product.estimatedDocumentCount();

  if (existing > 0 && !force) {
    return NextResponse.json({ seeded: false, count: existing });
  }
  if (force) {
    await Product.deleteMany({});
  }

  const docs = getOrderablePlanograms().flatMap((pg) =>
    pg.products.map((p) => ({
      name: p.description,
      planogramId: pg.id,
      planogramName: pg.name,
      segment: p.segment,
      image: p.image,
      defaultQty: p.defaultQty,
      code: "",
      components: [],
    })),
  );

  await Product.insertMany(docs);
  return NextResponse.json({ seeded: true, count: docs.length });
}
