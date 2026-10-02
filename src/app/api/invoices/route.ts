import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Invoice, serializeInvoice } from "@/lib/models/Invoice";
import { finalizeInvoiceCredit } from "@/lib/credit-notes";

export async function GET() {
  await connectDB();
  const pending = await Invoice.find({ creditFinalized: false, creditReversalPending: false }, { _id: 1 }).lean();
  for (const invoice of pending) {
    try { await finalizeInvoiceCredit(String(invoice._id)); }
    catch (error) { console.error("Invoice credit finalization needs retry", error); }
  }
  const docs = await Invoice.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeInvoice));
}
