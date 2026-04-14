"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const followups = [
  { prospect: "Hartley's Boutique", stage: "Samples Sent", dueDate: "Today", overdue: false },
  { prospect: "North Wales Gifts", stage: "First Call Made", dueDate: "Yesterday", overdue: true },
  { prospect: "Emerald & Co", stage: "Follow-Up in Progress", dueDate: "Today", overdue: false },
  { prospect: "Crown Jewels Retail", stage: "Initial Enquiry", dueDate: "2 days ago", overdue: true },
];

export function PendingFollowups() {
  return (
    <AnimatedCard delay={0.4}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold">Pending Follow-Ups</h3>
          </div>
          <Badge variant="secondary" className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-bold">
            {followups.length}
          </Badge>
        </div>

        {followups.map((item, i) => (
          <motion.div
            key={item.prospect}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 + i * 0.06 }}
            className="flex items-center justify-between rounded-xl border border-border/30 p-3 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium">{item.prospect}</p>
              <p className="text-[10px] text-muted-foreground">{item.stage}</p>
            </div>
            <Badge
              variant={item.overdue ? "destructive" : "outline"}
              className={`text-[10px] rounded-full ${!item.overdue ? "border-border/40" : ""}`}
            >
              {item.dueDate}
            </Badge>
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  );
}
