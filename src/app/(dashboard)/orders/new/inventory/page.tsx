"use client";

import { motion } from "framer-motion";
import { PackageCheck } from "lucide-react";
import { StepNav } from "@/components/orders/step-nav";

export default function InventoryStepPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-6 min-h-[280px] flex flex-col items-center justify-center text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4">
          <PackageCheck className="h-7 w-7 text-primary" />
        </div>
        <p className="text-base font-semibold">Inventory availability check</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          We&rsquo;ll verify every line against live stock and block if anything is short. (Phase 3)
        </p>
      </motion.div>

      <StepNav backHref="/orders/new/planogram" nextHref="/orders/new/client" />
    </div>
  );
}
