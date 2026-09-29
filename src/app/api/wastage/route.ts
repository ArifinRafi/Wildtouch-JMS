import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { isResponse, requireAdmin, sessionUser } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { WastageLog, serializeWastageLog } from "@/lib/models/WastageLog";
import { prepareWastage, type WastageInput } from "@/lib/wastage";

export async function GET() {
  if (!await sessionUser()) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  await connectDB();
  const docs = await WastageLog.find({}).sort({ date: -1, createdAt: -1 }).lean();
  return NextResponse.json(docs.map(serializeWastageLog));
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;
  let input: WastageInput;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "invalid wastage entry" }, { status: 400 });

  await connectDB();
  try {
    const prepared = await prepareWastage(input);
    const created = await WastageLog.create(prepared);
    try { await logActivity({ action: "added", entityType: "wastage log", entityName: prepared.orderNumber, entityId: String(created._id), details: `${prepared.staffName} · ${prepared.wasteQuantity} units` }); }
    catch (error) { console.error("Wastage saved but activity logging failed", error); }
    return NextResponse.json(serializeWastageLog(created), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "could not create wastage entry" }, { status: 400 });
  }
}
