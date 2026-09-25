import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { sessionUser } from "@/lib/authz";

/** Return the live inventory permission for the signed-in account. */
export async function GET() {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  await connectDB();
  const liveUser = await User.findById(user.id, { inventoryWriteAccess: 1, role: 1 }).lean();
  if (!liveUser) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const inventoryWriteAccess = liveUser.role === "admin" || liveUser.inventoryWriteAccess === true;
  return NextResponse.json({
    role: liveUser.role,
    inventoryWriteAccess,
    canDeleteInventory: liveUser.role === "admin",
  });
}
