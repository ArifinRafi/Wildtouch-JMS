import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Client, nextClientId, serializeClient } from "@/lib/models/Client";
import { logActivity } from "@/lib/activity";
import { requireAdmin, isResponse } from "@/lib/authz";
import { normalizeCurrency } from "@/lib/currency";
import { normalizeAccountStatus } from "@/lib/client-status";
import { syncClientBarcodeFields, validateClientProfileFields } from "@/lib/client-profile-validation";

export async function GET() {
  await connectDB();
  const docs = await Client.find({}).sort({ _id: 1 }).lean();
  return NextResponse.json(docs.map(serializeClient));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const profileError = validateClientProfileFields(body);
  if (profileError) return NextResponse.json({ error: profileError }, { status: 400 });

  if ("categoryPrices" in body || "pricingCurrency" in body) {
    const gate = await requireAdmin();
    if (isResponse(gate)) return gate;
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Ignore any client-supplied id; always assign the next sequential one.
  const { id: _ignore, ...rest } = body;
  void _ignore;
  delete rest.topSellingAnimals;
  delete rest.slowSellerDesigns;
  syncClientBarcodeFields(rest);
  if ("pricingCurrency" in rest) rest.pricingCurrency = normalizeCurrency(rest.pricingCurrency);
  rest.accountStatus = normalizeAccountStatus(rest.accountStatus);
  const _id = await nextClientId();

  const created = await Client.create({ _id, ...rest, name });
  await logActivity({
    action: "added",
    entityType: "client",
    entityName: name,
    entityId: _id,
  });
  return NextResponse.json(serializeClient(created.toObject()), { status: 201 });
}
