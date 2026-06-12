import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin, isResponse } from "@/lib/authz";

/** Step 2: verify the emailed token and set the new password. */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const body = await request.json();
  const token = String(body.token ?? "").trim();
  const newPassword = String(body.newPassword ?? "");

  if (!/^\d{6}$/.test(token)) {
    return NextResponse.json({ error: "enter the 6-digit code" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(gate.id);
  if (!user?.resetTokenHash || !user.resetTokenExp) {
    return NextResponse.json({ error: "no pending verification — request a code first" }, { status: 400 });
  }
  if (user.resetTokenExp.getTime() < Date.now()) {
    return NextResponse.json({ error: "code expired — request a new one" }, { status: 400 });
  }
  const ok = await bcrypt.compare(token, user.resetTokenHash);
  if (!ok) {
    return NextResponse.json({ error: "incorrect code" }, { status: 400 });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetTokenHash = null;
  user.resetTokenExp = null;
  await user.save();

  return NextResponse.json({ ok: true });
}
