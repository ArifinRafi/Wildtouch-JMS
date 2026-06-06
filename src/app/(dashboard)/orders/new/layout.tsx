"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  LayoutGrid,
  PackageCheck,
  UserRound,
  ReceiptText,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDraftProvider } from "@/lib/store/order-draft";
import { NEW_ORDER_STEPS, stepIndexForPath } from "@/components/orders/steps";

const ICONS = [LayoutGrid, PackageCheck, UserRound, ReceiptText];

export default function NewOrderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = stepIndexForPath(pathname);

  return (
    <OrderDraftProvider>
      <div className="space-y-6 pb-24 w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Create New Order
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {current + 1} of {NEW_ORDER_STEPS.length} · {NEW_ORDER_STEPS[current].title}
          </p>
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          {NEW_ORDER_STEPS.map((s, i) => {
            const Icon = ICONS[i];
            const done = i < current;
            const active = i === current;
            return (
              <div key={s.key} className="flex items-center gap-2 sm:gap-3 flex-1 last:flex-none">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      active && "bg-primary text-white border-primary shadow-lg shadow-primary/20",
                      done && "bg-primary/15 text-primary border-primary/30",
                      !active && !done && "bg-muted/40 text-muted-foreground border-border/40",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold hidden sm:block truncate",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {i < NEW_ORDER_STEPS.length - 1 && (
                  <div className={cn("h-px flex-1 min-w-4", done ? "bg-primary/40" : "bg-border/50")} />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Step page content */}
        {children}
      </div>
    </OrderDraftProvider>
  );
}
