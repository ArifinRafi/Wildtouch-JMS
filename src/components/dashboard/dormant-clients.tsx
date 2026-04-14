"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { UserX } from "lucide-react";
import { AnimatedCard } from "./animated-card";

const dormantClients = [
  { name: "Boutique Gems Ltd", lastOrder: "62 days ago", contact: "Sarah Johnson" },
  { name: "Coastal Jewellers", lastOrder: "78 days ago", contact: "Mark Davies" },
  { name: "The Gift Shop Cheltenham", lastOrder: "95 days ago", contact: "Emily Richards" },
];

export function DormantClients() {
  return (
    <AnimatedCard delay={0.35}>
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
              <UserX className="h-4 w-4 text-orange-500" />
            </div>
            <h3 className="text-sm font-semibold">Dormant Clients</h3>
          </div>
          <Badge variant="secondary" className="rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px] font-bold">
            {dormantClients.length}
          </Badge>
        </div>

        {dormantClients.map((client, i) => (
          <motion.div
            key={client.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-center justify-between rounded-xl border border-border/30 p-3 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium">{client.name}</p>
              <p className="text-[10px] text-muted-foreground">Contact: {client.contact}</p>
            </div>
            <Badge variant="outline" className="text-[10px] rounded-full text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/5">
              {client.lastOrder}
            </Badge>
          </motion.div>
        ))}
      </div>
    </AnimatedCard>
  );
}
