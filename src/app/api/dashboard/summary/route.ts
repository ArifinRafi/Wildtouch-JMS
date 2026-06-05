import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Invoice } from "@/lib/models/Invoice";
import { Client } from "@/lib/models/Client";
import { Product } from "@/lib/models/Product";
import { Component } from "@/lib/models/Component";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 30;

export async function GET() {
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start7 = new Date(startOfToday);
  start7.setDate(start7.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeOrders,
    totalOrders,
    ordersInProduction,
    activeClients,
    totalClients,
    totalProducts,
    recentInvoices,
    monthInvoices,
    lowStockDocs,
  ] = await Promise.all([
    Order.countDocuments({ status: { $nin: ["delivered", "archived"] } }),
    Order.countDocuments(),
    Order.countDocuments({ status: "in_production" }),
    Client.countDocuments({ accountStatus: "active" }),
    Client.countDocuments(),
    Product.countDocuments(),
    Invoice.find({ createdAt: { $gte: start7 } }, { total: 1, createdAt: 1 }).lean(),
    Invoice.find({ createdAt: { $gte: startOfMonth } }, { total: 1 }).lean(),
    Component.find({ qtyAvailable: { $lt: LOW_STOCK_THRESHOLD } })
      .sort({ qtyAvailable: 1 })
      .limit(6)
      .lean(),
  ]);

  // Revenue series: last 7 days (oldest → newest)
  const revenueSeries = Array(7).fill(0) as number[];
  for (const inv of recentInvoices) {
    const created = inv.createdAt ? new Date(inv.createdAt as unknown as string) : null;
    if (!created) continue;
    const dayStart = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const idx = Math.floor((dayStart.getTime() - start7.getTime()) / 86400000);
    if (idx >= 0 && idx < 7) revenueSeries[idx] += Number(inv.total) || 0;
  }

  const revenueMTD = monthInvoices.reduce((s, inv) => s + (Number(inv.total) || 0), 0);

  const lowStock = lowStockDocs.map((c) => ({
    name: c.description || c.code || "Component",
    current: c.qtyAvailable ?? 0,
    threshold: LOW_STOCK_THRESHOLD,
    unit: "pcs",
  }));

  return NextResponse.json({
    activeOrders,
    totalOrders,
    ordersInProduction,
    activeClients,
    totalClients,
    totalProducts,
    revenueMTD,
    revenueSeries,
    lowStock,
  });
}
