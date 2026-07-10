import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { ProductGroup } from "@/lib/models/ProductGroup";
import { logActivity } from "@/lib/activity";

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  await connectDB();
  const deleted = await ProductGroup.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  await logActivity({
    action: "deleted",
    entityType: "product group",
    entityName: deleted.name || "group",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
