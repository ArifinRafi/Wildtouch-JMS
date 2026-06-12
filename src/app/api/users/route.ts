import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User, serializeUser } from "@/lib/models/User";
import { requireAdmin, isResponse } from "@/lib/authz";

export async function GET() {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  await connectDB();
  const docs = await User.find({}).sort({ createdAt: 1 }).lean();
  return NextResponse.json(docs.map(serializeUser));
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  await connectDB();
  const body = await request.json();

  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = body.role === "admin" ? "admin" : "manager";

  if (!username || !email) {
    return NextResponse.json({ error: "username and email are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
  }
  const exists = await User.findOne({ $or: [{ username }, { email }] }).lean();
  if (exists) {
    return NextResponse.json({ error: "username or email already in use" }, { status: 409 });
  }

  const created = await User.create({
    username,
    email,
    role,
    passwordHash: await bcrypt.hash(password, 10),
  });
  return NextResponse.json(serializeUser(created.toObject()), { status: 201 });
}
