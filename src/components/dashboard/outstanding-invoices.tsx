"use client";

import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const ageing = [
  { period: "Current", amount: 12450, color: "from-emerald-500 to-emerald-400", dot: "bg-emerald-500" },
  { period: "30 days", amount: 8300, color: "from-amber-500 to-amber-400", dot: "bg-amber-500" },
  { period: "60 days", amount: 3200, color: "from-orange-500 to-orange-400", dot: "bg-orange-500" },
  { period: "90+ days", amount: 1800, color: "from-red-500 to-red-400", dot: "bg-red-500" },
];

const total = ageing.reduce((sum, a) => sum + a.amount, 0);

export function OutstandingInvoices() {
  return (
    <AnimatedCard delay={0.25}>
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Receipt className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold">Outstanding Invoices</h3>
        </div>

        <div className="text-center py-2">
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
            className="text-3xl font-bold tracking-tight"
          >
            £{total.toLocaleString()}
          </motion.p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total outstanding</p>
        </div>

        {/* Animated stacked bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/30">
          {ageing.map((a, i) => (
            <motion.div
              key={a.period}
              initial={{ width: 0 }}
              animate={{ width: `${(a.amount / total) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.4 + i * 0.1, ease: "easeOut" }}
              className={`bg-gradient-to-r ${a.color} first:rounded-l-full last:rounded-r-full`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ageing.map((a) => (
            <div key={a.period} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${a.dot}`} />
              <div className="flex-1 flex justify-between">
                <span className="text-[10px] text-muted-foreground">{a.period}</span>
                <span className="text-[10px] font-semibold">£{a.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedCard>
  );
}
