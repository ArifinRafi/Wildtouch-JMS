import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { sessionUser } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { ProformaInvoice, nextProformaNumber, serializeProformaInvoice } from "@/lib/models/ProformaInvoice";
import { prepareProforma, type ProformaInput } from "@/lib/orders/proforma";

async function canRead() {
  const user = await sessionUser();
  return user?.role === "admin" || user?.role === "manager";
}

export async function GET() {
  if (!await canRead()) return NextResponse.json({ error: "proforma access requires admin or manager" }, { status: 403 });
  await connectDB();
  const docs = await ProformaInvoice.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(docs.map((doc) => serializeProformaInvoice(doc as Record<string, unknown>)));
}

export async function POST(request: NextRequest) {
  if (!await canRead()) return NextResponse.json({ error: "proforma access requires admin or manager" }, { status: 403 });
  await connectDB();
  try {
    const prepared = await prepareProforma(await request.json() as ProformaInput);
    const doc = await ProformaInvoice.create({ ...prepared, proformaNumber: await nextProformaNumber() });
    try { await logActivity({ action: "added", entityType: "proforma invoice", entityName: doc.proformaNumber, entityId: String(doc._id) }); }
    catch (error) { console.error("Proforma created but activity logging failed", error); }
    return NextResponse.json(serializeProformaInvoice(doc.toObject() as Record<string, unknown>), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not create proforma" }, { status: 400 });
  }
}
