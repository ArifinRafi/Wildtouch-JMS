"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Factory } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const productionItems = [
  { order: "ORD-1258", client: "Silver Dreams", maker: "Lisa M.", items: 24, collected: "2 days ago", estimatedReturn: "Tomorrow" },
  { order: "ORD-1260", client: "Gems & Grace", maker: "Tom W.", items: 18, collected: "Today", estimatedReturn: "In 3 days" },
  { order: "ORD-1262", client: "The Bead Shop", maker: "Sarah K.", items: 36, collected: "Yesterday", estimatedReturn: "In 2 days" },
];

export function ProductionQueue() {
  return (
    <AnimatedCard delay={0.45}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Factory className="h-4 w-4 text-violet-500" />
            </div>
            <h3 className="text-sm font-semibold">Production Queue</h3>
          </div>
          <Badge variant="secondary" className="rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[10px] font-bold">
            {productionItems.length} active
          </Badge>
        </div>

        {productionItems.map((item, i) => (
          <motion.div
            key={item.order}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className="rounded-xl border border-border/30 p-3 space-y-1.5 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{item.order}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{item.items} items</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.client} &middot; Maker: <span className="font-medium text-foreground/80">{item.maker}</span>
            </p>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Collected: {item.collected}</span>
              <Badge variant="outline" className="text-[10px] rounded-full border-border/40">
                Due: {item.estimatedReturn}
              </Badge>
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  );
}
