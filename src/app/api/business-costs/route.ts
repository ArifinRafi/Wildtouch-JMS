import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { sessionUser } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { BusinessCost, serializeBusinessCost } from "@/lib/models/BusinessCost";
import { prepareBusinessCost, type BusinessCostInput } from "@/lib/business-cost";

export async function GET() {
  if (!await sessionUser()) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  await connectDB();
  const docs = await BusinessCost.find({}).sort({ date: -1, createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeBusinessCost));
}

export async function POST(request: NextRequest) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "manager") {
    return NextResponse.json({ error: "cost updates require admin or manager" }, { status: 403 });
  }
  let input: BusinessCostInput;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return NextResponse.json({ error: "invalid business cost" }, { status: 400 });
  }

  await connectDB();
  try {
    const prepared = prepareBusinessCost(input);
    const created = await BusinessCost.create(prepared);
    try { await logActivity({ action: "added", entityType: "business cost", entityName: prepared.productService, entityId: String(created._id), details: `supplier ${prepared.supplier.name}` }); }
    catch (error) { console.error("Business cost saved but activity logging failed", error); }
    return NextResponse.json(serializeBusinessCost(created), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not create business cost" }, { status: 400 });
  }
}
