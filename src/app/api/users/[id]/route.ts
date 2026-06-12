import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin, isResponse } from "@/lib/authz";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/users/[id]">,
) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  if (id === gate.id) {
    return NextResponse.json({ error: "you cannot delete your own account" }, { status: 400 });
  }

  await connectDB();
  const target = await User.findById(id).lean();
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (target.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "cannot delete the last admin" }, { status: 400 });
    }
  }

  await User.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
