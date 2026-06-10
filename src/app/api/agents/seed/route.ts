import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Agent } from "@/lib/models/Agent";
import { AGENTS_SEED } from "@/lib/data/agents-seed";

export async function POST(request: NextRequest) {
  await connectDB();
  const force = request.nextUrl.searchParams.get("force") === "1";
  const existing = await Agent.estimatedDocumentCount();
  if (existing > 0 && !force) return NextResponse.json({ seeded: false, count: existing });
  if (force) await Agent.deleteMany({});
  const docs = AGENTS_SEED.map(({ id, ...rest }) => ({ _id: id, ...rest }));
  await Agent.insertMany(docs);
  return NextResponse.json({ seeded: true, count: docs.length });
}
