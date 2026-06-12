import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, serializeUser } from "@/lib/models/User";
import { sessionUser } from "@/lib/authz";

/** The current signed-in user's live record (any role). */
export async function GET() {
  const u = await sessionUser();
  if (!u) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  await connectDB();
  const doc = await User.findById(u.id).lean();
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(serializeUser(doc));
}
