import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { isResponse, requireAdmin } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { CreditNote, serializeCreditNote } from "@/lib/models/CreditNote";
import { prepareCreditNote, type CreditNoteInput } from "@/lib/credit-note-input";

export async function GET() {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;
  await connectDB();
  const notes = await CreditNote.find({}).sort({ date: -1, createdAt: -1 }).lean();
  return NextResponse.json(notes.map(serializeCreditNote));
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;
  let input: CreditNoteInput;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ error: "invalid credit note" }, { status: 400 });

  await connectDB();
  try {
    const prepared = await prepareCreditNote(input, gate.name || gate.email || "Admin");
    const created = await CreditNote.create(prepared);
    try { await logActivity({ action: "added", entityType: "credit note", entityName: created.creditNoteNumber, entityId: String(created._id), details: `for ${created.clientName} (${created.currency})` }); }
    catch (error) { console.error("Credit note saved but activity logging failed", error); }
    return NextResponse.json(serializeCreditNote(created), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not create credit note" }, { status: 400 });
  }
}
