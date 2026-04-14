"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const tasks = [
  { title: "Restock printer ink — Canon PG-545", assignedTo: null, priority: "high" },
  { title: "Update Gems & Grace delivery address", assignedTo: "Sarah", priority: "medium" },
  { title: "Send samples to North Wales Gifts", assignedTo: null, priority: "medium" },
  { title: "Chase branding card supplier for ETA", assignedTo: "Tom", priority: "low" },
];

const priorityStyles: Record<string, string> = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export function TaskTracker() {
  return (
    <AnimatedCard delay={0.58}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
              <CheckSquare className="h-4 w-4 text-sky-500" />
            </div>
            <h3 className="text-sm font-semibold">Ad-Hoc Tasks</h3>
          </div>
          <Badge variant="secondary" className="rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 text-[10px] font-bold">
            {tasks.length}
          </Badge>
        </div>

        {tasks.map((task, i) => (
          <motion.div
            key={task.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.06 }}
            className="flex items-center justify-between rounded-xl border border-border/30 p-3 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm truncate">{task.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {task.assignedTo ? `Assigned: ${task.assignedTo}` : "Unassigned — pick up"}
              </p>
            </div>
            <Badge variant="secondary" className={`text-[10px] rounded-full shrink-0 ${priorityStyles[task.priority]}`}>
              {task.priority}
            </Badge>
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  );
}
