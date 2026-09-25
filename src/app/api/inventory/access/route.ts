import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User, serializeUser } from "@/lib/models/User";
import { isResponse, requireAdmin } from "@/lib/authz";
import { logActivity } from "@/lib/activity";

/** List manager/viewer accounts and their current inventory permission. */
export async function GET() {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  await connectDB();
  const users = await User.find({ role: { $in: ["manager", "viewer"] } })
    .sort({ username: 1 })
    .lean();
  return NextResponse.json(users.map(serializeUser));
}

/** Grant or revoke inventory add/update access after verifying the admin password. */
export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  await connectDB();
  const body = await request.json();
  const userId = String(body.userId ?? "").trim();
  const password = String(body.password ?? "");
  const allowed = body.allowed === true;

  if (!userId || !password) {
    return NextResponse.json({ error: "user and admin password are required" }, { status: 400 });
  }

  const admin = await User.findById(gate.id);
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  const target = await User.findById(userId);
  if (!target) return NextResponse.json({ error: "user not found" }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ error: "Admin accounts already have inventory access." }, { status: 400 });
  }

  target.inventoryWriteAccess = allowed;
  await target.save();
  await logActivity({
    action: "updated",
    entityType: "inventory-access",
    entityName: target.username,
    entityId: String(target._id),
    details: allowed ? "inventory update access granted" : "inventory update access revoked",
  });

  return NextResponse.json(serializeUser(target.toObject()));
}
