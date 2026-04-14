"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const cardAlerts = [
  { client: "Silver Dreams", design: "SD-Logo-Gold", remaining: 15, threshold: 50 },
  { client: "The Bead Shop", design: "TBS-Classic", remaining: 8, threshold: 30 },
];

export function BrandingCardAlerts() {
  return (
    <AnimatedCard delay={0.5}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10">
              <CreditCard className="h-4 w-4 text-pink-500" />
            </div>
            <h3 className="text-sm font-semibold">Branding Card Alerts</h3>
          </div>
          <Badge variant="secondary" className="rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 text-[10px] font-bold">
            {cardAlerts.length}
          </Badge>
        </div>

        {cardAlerts.map((c, i) => (
          <motion.div
            key={c.client}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 + i * 0.08 }}
            className="flex items-center justify-between rounded-xl border border-border/30 p-3 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium">{c.client}</p>
              <p className="text-[10px] text-muted-foreground">{c.design}</p>
            </div>
            <Badge className="text-[10px] rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20">
              {c.remaining} left
            </Badge>
          </motion.div>
        ))}

        <p className="text-[10px] text-muted-foreground/70 italic">
          Batch reorder suggested — combine to save on shipping
        </p>
      </div>
    </AnimatedCard>
  );
}
