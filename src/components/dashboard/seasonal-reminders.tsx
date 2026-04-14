"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const reminders = [
  { client: "The Gift Shop Cheltenham", lastYearOrder: "Easter Collection — 42 units", lastYearDate: "April 2025" },
  { client: "Gems & Grace", lastYearOrder: "Spring Display Refresh — 28 units", lastYearDate: "April 2025" },
  { client: "Silver Dreams", lastYearOrder: "Mother's Day Range — 56 units", lastYearDate: "March 2025" },
];

export function SeasonalReminders() {
  return (
    <AnimatedCard delay={0.55}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
              <CalendarDays className="h-4 w-4 text-teal-500" />
            </div>
            <h3 className="text-sm font-semibold">Seasonal Reminders</h3>
          </div>
          <Badge variant="secondary" className="rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 text-[10px] font-bold">
            {reminders.length}
          </Badge>
        </div>

        {reminders.map((r, i) => (
          <motion.div
            key={r.client}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            className="rounded-xl border border-border/30 p-3 space-y-1 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <p className="text-sm font-medium">{r.client}</p>
            <p className="text-[10px] text-muted-foreground">
              Last year ({r.lastYearDate}): {r.lastYearOrder}
            </p>
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  );
}
