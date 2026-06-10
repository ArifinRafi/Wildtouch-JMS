import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { WhiteboardOrderModel } from "@/lib/models/WhiteboardOrder";
import { WHITEBOARD_SEED } from "@/lib/data/whiteboard-seed";

export async function POST(request: NextRequest) {
  await connectDB();
  const force = request.nextUrl.searchParams.get("force") === "1";
  const existing = await WhiteboardOrderModel.estimatedDocumentCount();
  if (existing > 0 && !force) return NextResponse.json({ seeded: false, count: existing });
  if (force) await WhiteboardOrderModel.deleteMany({});
  const docs = WHITEBOARD_SEED.map(({ id, ...rest }) => ({ _id: id, ...rest }));
  await WhiteboardOrderModel.insertMany(docs);
  return NextResponse.json({ seeded: true, count: docs.length });
}
