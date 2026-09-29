import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Design, serializeDesign } from "@/lib/models/Design";

export const dynamic = "force-dynamic";

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  await connectDB();
  const today = localDateKey(new Date());
  const docs = await Design.find({ alertDate: { $ne: "", $lte: today } })
    .sort({ alertDate: 1, createdAt: -1 })
    .lean();
  const alerts = docs.map(serializeDesign).filter((design) => !design.completed);
  return NextResponse.json(alerts);
}
