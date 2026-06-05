"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { AnimatedCard } from "./animated-card";

export interface StockAlertItem {
  name: string;
  current: number;
  threshold: number;
  unit: string;
}

export function StockAlerts({ items = [] }: { items?: StockAlertItem[] }) {
  const lowStockItems = items;
  return (
    <AnimatedCard delay={0.3}>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold">Stock Alerts</h3>
          </div>
          <Badge variant="secondary" className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
            {lowStockItems.length}
          </Badge>
        </div>

        {lowStockItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mb-2" />
            <p className="text-xs font-medium">No low-stock components</p>
          </div>
        )}

        {lowStockItems.map((item, i) => {
          const percentage = item.threshold > 0 ? Math.round((item.current / item.threshold) * 100) : 0;
          const isCritical = percentage < 25;

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate">{item.name}</span>
                <span className={`text-[10px] font-bold ${isCritical ? "text-destructive" : "text-amber-600 dark:text-amber-400"}`}>
                  {item.current}/{item.threshold}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.06, ease: "easeOut" }}
                  className={`h-full rounded-full ${isCritical ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-amber-500 to-amber-400"}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatedCard>
  );
}
