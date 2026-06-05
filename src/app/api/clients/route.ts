import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Client, nextClientId, serializeClient } from "@/lib/models/Client";

export async function GET() {
  await connectDB();
  const docs = await Client.find({}).sort({ _id: 1 }).lean();
  return NextResponse.json(docs.map(serializeClient));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Ignore any client-supplied id; always assign the next sequential one.
  const { id: _ignore, ...rest } = body;
  void _ignore;
  const _id = await nextClientId();

  const created = await Client.create({ _id, ...rest, name });
  return NextResponse.json(serializeClient(created.toObject()), { status: 201 });
}
