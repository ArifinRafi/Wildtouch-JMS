import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, isResponse } from "@/lib/authz";
import { Client, serializeClient } from "@/lib/models/Client";
import { buildClientsExcel } from "@/lib/client-excel";

export const dynamic = "force-dynamic";

function safeFilename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "client";
}

export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  await connectDB();
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const docs = id
    ? await Client.find({ _id: id }).lean()
    : await Client.find({}).sort({ _id: 1 }).lean();

  if (id && docs.length === 0) {
    return NextResponse.json({ error: "client not found" }, { status: 404 });
  }

  const clients = docs.map(serializeClient);
  const single = clients.length === 1 && id;
  const title = single ? `Wildtouch Client - ${String(clients[0].name ?? clients[0].id)}` : "Wildtouch Clients";
  const filename = single
    ? `wildtouch-client-${safeFilename(String(clients[0].name ?? clients[0].id))}.xls`
    : `wildtouch-clients-${new Date().toISOString().slice(0, 10)}.xls`;

  return new NextResponse(buildClientsExcel(clients, title), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
