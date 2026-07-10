import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Agent, nextAgentId, serializeAgent } from "@/lib/models/Agent";
import { logActivity } from "@/lib/activity";

export async function GET() {
  await connectDB();
  const docs = await Agent.find({}).sort({ _id: 1 }).lean();
  return NextResponse.json(docs.map(serializeAgent));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const _id = await nextAgentId();
  const created = await Agent.create({
    _id,
    name,
    address: String(body.address ?? "").trim(),
    city: String(body.city ?? "").trim(),
    contactNumber: String(body.contactNumber ?? "").trim(),
    email: String(body.email ?? "").trim(),
    referredPoints: Math.max(0, Number(body.referredPoints) || 0),
  });
  await logActivity({
    action: "added",
    entityType: "agent",
    entityName: name,
    entityId: _id,
  });
  return NextResponse.json(serializeAgent(created.toObject()), { status: 201 });
}
