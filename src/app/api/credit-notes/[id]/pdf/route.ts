import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { isResponse, requireAdmin } from "@/lib/authz";
import { buildCreditNotePrintHtml } from "@/lib/credit-note-export";
import { connectDB } from "@/lib/db";
import { CreditNote, serializeCreditNote } from "@/lib/models/CreditNote";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  await connectDB();
  const note = await CreditNote.findById(id).lean();
  if (!note) return NextResponse.json({ error: "credit note not found" }, { status: 404 });

  return new NextResponse(buildCreditNotePrintHtml(serializeCreditNote(note)), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
