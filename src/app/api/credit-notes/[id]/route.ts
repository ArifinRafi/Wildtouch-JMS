import { isValidObjectId } from "mongoose";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { isResponse, requireAdmin } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { CreditNote, serializeCreditNote } from "@/lib/models/CreditNote";

/** Void an unused note; used notes remain immutable for the financial audit trail. */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  let body: { action?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (body?.action !== "void") return NextResponse.json({ error: "only void is supported" }, { status: 400 });

  await connectDB();
  const updated = await CreditNote.findOneAndUpdate(
    { _id: id, status: "active", "applications.0": { $exists: false }, $expr: { $eq: ["$remainingCents", "$amountCents"] } },
    { $set: { status: "void" } },
    { returnDocument: "after", runValidators: true },
  );
  if (!updated) return NextResponse.json({ error: "only an unused active credit note can be voided" }, { status: 409 });
  try { await logActivity({ action: "updated", entityType: "credit note", entityName: updated.creditNoteNumber, entityId: id, details: "voided unused credit" }); }
  catch (error) { console.error("Credit note voided but activity logging failed", error); }
  return NextResponse.json(serializeCreditNote(updated));
}
