import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Client } from "@/lib/models/Client";
import { clients as seedClients } from "@/lib/mock-data/clients";

export async function POST(request: NextRequest) {
  await connectDB();

  const force = request.nextUrl.searchParams.get("force") === "1";
  const existing = await Client.estimatedDocumentCount();

  if (existing > 0 && !force) {
    return NextResponse.json({ seeded: false, count: existing });
  }
  if (force) {
    await Client.deleteMany({});
  }

  const docs = seedClients.map((c) => {
    const { id, ...rest } = c;
    return { _id: id, ...rest };
  });

  await Client.insertMany(docs);
  return NextResponse.json({ seeded: true, count: docs.length });
}
