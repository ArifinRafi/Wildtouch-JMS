"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const designs = [
  { name: "Ocean Wave Pendant", stage: "Artwork", daysInStage: 5 },
  { name: "Rose Gold Hoop Set", stage: "Sample Production", daysInStage: 12 },
  { name: "Emerald Drop Earrings", stage: "Sign-Off", daysInStage: 3 },
  { name: "Celtic Knot Bracelet", stage: "Concept", daysInStage: 2 },
];

const stageColors: Record<string, string> = {
  Concept: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  Artwork: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Sample Production": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Sign-Off": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Launched: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
};

export function DesignPipeline() {
  return (
    <AnimatedCard delay={0.48}>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10">
            <Palette className="h-4 w-4 text-indigo-500" />
          </div>
          <h3 className="text-sm font-semibold">Design Pipeline</h3>
        </div>

        {designs.map((d, i) => (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            className="flex items-center justify-between rounded-xl border border-border/30 p-3 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium">{d.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {d.daysInStage} days in stage
                {d.daysInStage > 7 && (
                  <motion.span
                    className="text-amber-500 ml-1 font-medium"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    (stalled?)
                  </motion.span>
                )}
              </p>
            </div>
            <Badge variant="secondary" className={`text-[10px] rounded-full ${stageColors[d.stage] || ""}`}>
              {d.stage}
            </Badge>
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  );
}
