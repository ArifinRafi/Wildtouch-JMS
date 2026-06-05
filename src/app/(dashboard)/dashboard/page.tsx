"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShoppingCart,
  Users,
  Package,
  PoundSterling,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrdersToday } from "@/components/dashboard/orders-today";
import { StockAlerts, type StockAlertItem } from "@/components/dashboard/stock-alerts";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

interface DashboardSummary {
  activeOrders: number;
  totalOrders: number;
  ordersInProduction: number;
  activeClients: number;
  totalClients: number;
  totalProducts: number;
  revenueMTD: number;
  revenueSeries: number[];
  lowStock: StockAlertItem[];
}

const EMPTY: DashboardSummary = {
  activeOrders: 0,
  totalOrders: 0,
  ordersInProduction: 0,
  activeClients: 0,
  totalClients: 0,
  totalProducts: 0,
  revenueMTD: 0,
  revenueSeries: [0, 0, 0, 0, 0, 0, 0],
  lowStock: [],
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const data = await res.json();
        if (active) setSummary(data);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Wildtouch Business Management System
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link href="/orders/new">
            <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold">
              <Plus className="h-4 w-4" />
              Create New Order
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Orders"
          value={summary.activeOrders}
          icon={ShoppingCart}
          description={`${summary.totalOrders} total`}
          index={0}
        />
        <StatCard
          title="Active Clients"
          value={summary.activeClients}
          icon={Users}
          description={`${summary.totalClients} registered`}
          index={1}
        />
        <StatCard
          title="Products"
          value={summary.totalProducts}
          icon={Package}
          description="in catalog"
          index={2}
        />
        <StatCard
          title="Revenue (MTD)"
          value={`£${summary.revenueMTD.toLocaleString()}`}
          icon={PoundSterling}
          index={3}
        />
      </div>

      {/* Revenue Chart — Last 7 Days */}
      <RevenueChart series={summary.revenueSeries} />

      {/* Orders pipeline */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <OrdersToday
          activeOrders={summary.activeOrders}
          ordersInProduction={summary.ordersInProduction}
        />
      </div>

      {/* Stock alerts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <StockAlerts items={summary.lowStock} />
      </div>
    </div>
  );
}
