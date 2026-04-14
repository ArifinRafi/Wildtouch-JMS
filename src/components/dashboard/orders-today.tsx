"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Package, Factory, Boxes } from "lucide-react";
import { AnimatedCard } from "./animated-card";
import { useAppStore } from "@/lib/store/app-store";

export function OrdersToday() {
  const { products, productionLogs } = useAppStore();

  const totalInStock = products.reduce((s, p) => s + p.inStock, 0);

  const totalInProduction = useMemo(() => {
    return productionLogs
      .filter((l) => !l.complete)
      .reduce((s, l) => s + (l.qtyOut ?? 0), 0);
  }, [productionLogs]);

  const rows = [
    {
      label: "In Stock",
      value: totalInStock,
      products: products.length,
      icon: Boxes,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "In Production",
      value: totalInProduction,
      products: productionLogs.filter((l) => !l.complete).length,
      icon: Factory,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      iconColor: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <AnimatedCard className="col-span-full lg:col-span-2" delay={0.2}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold">Product Pipeline</h3>
        </div>

        {/* Two stat cards */}
        <div className="grid grid-cols-2 gap-4">
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className={`flex flex-col gap-3 rounded-2xl border p-4 ${row.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {row.label}
                </span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${row.bg}`}>
                  <row.icon className={`h-4 w-4 ${row.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold tabular-nums tracking-tight">
                  {row.value.toLocaleString()}
                </p>
                <p className="text-[11px] mt-1 opacity-70">
                  {row.label === "In Stock"
                    ? `across ${row.products} product${row.products !== 1 ? "s" : ""}`
                    : `${row.products} active log${row.products !== 1 ? "s" : ""}`}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedCard>
  );
}
