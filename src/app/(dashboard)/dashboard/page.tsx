"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ListChecks, PenTool, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrdersToday } from "@/components/dashboard/orders-today";
import { StockAlerts, type StockAlertItem } from "@/components/dashboard/stock-alerts";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { useRole } from "@/lib/hooks/use-role";
import DigitalWhiteboardPage from "../digital-whiteboard/page";

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
  pendingTasks: number;
  designWorkInProgress: number;
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
  pendingTasks: 0,
  designWorkInProgress: 0,
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY);
  const { isAdmin } = useRole();

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

      {/* The live Digital Whiteboard is the dashboard's primary workspace. */}
      <DigitalWhiteboardPage />

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {/* Total pending tasks across every date and employee. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between rounded-2xl border border-amber-500/25 bg-card/70 p-5 glass shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Tasks</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{summary.pendingTasks}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ListChecks className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Only the total number of live Design Tracker items. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center justify-between rounded-2xl border border-violet-500/25 bg-card/70 p-5 glass shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Design work in Progress</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{summary.designWorkInProgress}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <PenTool className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Revenue is financial information and is visible to admins only. */}
      {isAdmin && <RevenueChart series={summary.revenueSeries} />}

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
