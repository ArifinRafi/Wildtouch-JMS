import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { sessionUser } from "@/lib/authz";
import { Agent } from "@/lib/models/Agent";
import { Order } from "@/lib/models/Order";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await connectDB();
  const agent = await Agent.findById(id, { name: 1 }).lean();
  if (!agent) return NextResponse.json({ error: "agent not found" }, { status: 404 });

  // Agent identity, order number, totals and timestamps are read from persisted Order documents.
  // The name fallback keeps older orders linked if they pre-date the agentId snapshot field.
  const docs = await Order.find({
    $or: [
      { "agent.agentId": id },
      { "agent.agentId": { $in: ["", null] }, "agent.name": String(agent.name ?? "") },
    ],
  }, { orderNumber: 1, total: 1, currency: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();
  const user = await sessionUser();
  const canSeeAmount = user?.role === "admin" || user?.role === "manager";

  return NextResponse.json(docs.map((order) => ({
    id: String(order._id),
    orderNumber: String(order.orderNumber ?? ""),
    date: order.createdAt ? new Date(order.createdAt as Date).toISOString() : null,
    amount: canSeeAmount ? Number(order.total) || 0 : null,
    currency: String(order.currency ?? "GBP"),
  })));
}
