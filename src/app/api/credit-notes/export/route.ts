import { NextResponse } from "next/server";
import { isResponse, requireAdmin } from "@/lib/authz";
import { buildCreditNotesExcel } from "@/lib/credit-note-export";
import { connectDB } from "@/lib/db";
import { CreditNote, serializeCreditNote } from "@/lib/models/CreditNote";

export async function GET() {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  await connectDB();
  const exportedAt = new Date();
  const notes = await CreditNote.find({}).sort({ date: -1, createdAt: -1 }).lean();
  const stamp = exportedAt.toISOString().replace(/[:.]/g, "-");

  return new NextResponse(buildCreditNotesExcel(notes.map(serializeCreditNote), exportedAt), {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="wildtouch-credit-notes-${stamp}.xls"`,
      "Cache-Control": "private, no-store",
    },
  });
}
