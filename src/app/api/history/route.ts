import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Activity, serializeActivity } from "@/lib/models/Activity";

/**
 * Admin-only activity feed. Returns the most recent activities (newest first);
 * the History page groups/filters them by date in the viewer's timezone.
 */
export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(2000, Math.max(1, Number(searchParams.get("limit")) || 1000));

  const docs = await Activity.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  return NextResponse.json(docs.map(serializeActivity));
}
