import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Invoice, serializeInvoice } from "@/lib/models/Invoice";

export async function GET() {
  await connectDB();
  const docs = await Invoice.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeInvoice));
}
