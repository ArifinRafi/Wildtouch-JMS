"use client";

import { motion } from "framer-motion";
import {
  ShoppingCart,
  Users,
  Package,
  PoundSterling,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrdersToday } from "@/components/dashboard/orders-today";
import { StockAlerts } from "@/components/dashboard/stock-alerts";
import { OutstandingInvoices } from "@/components/dashboard/outstanding-invoices";
import { SeasonalReminders } from "@/components/dashboard/seasonal-reminders";
import { BrandingCardAlerts } from "@/components/dashboard/branding-card-alerts";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wildtouch Business Management System
        </p>
      </motion.div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Orders"
          value={28}
          icon={ShoppingCart}
          description="6 dispatched today"
          trend={{ value: 12, label: "vs last week" }}
          index={0}
        />
        <StatCard
          title="Active Clients"
          value={147}
          icon={Users}
          description="3 new this month"
          trend={{ value: 4, label: "vs last month" }}
          index={1}
        />
        <StatCard
          title="Products"
          value={312}
          icon={Package}
          description="8 in development"
          index={2}
        />
        <StatCard
          title="Revenue (MTD)"
          value="£34,520"
          icon={PoundSterling}
          trend={{ value: 8, label: "vs last month" }}
          index={3}
        />
      </div>

      {/* Revenue Chart — Last 7 Days */}
      <RevenueChart />

      {/* Main Dashboard Panels */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <OrdersToday />
        <OutstandingInvoices />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <StockAlerts />
        <BrandingCardAlerts />
        <SeasonalReminders />
      </div>
    </div>
  );
}
