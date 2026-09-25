"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  LayoutGrid,
  PackageCheck,
  UserRound,
  ReceiptText,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderDraftProvider, useOrderDraft } from "@/lib/store/order-draft";
import { NEW_ORDER_STEPS } from "@/components/orders/steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ICONS = { planogram: LayoutGrid, inventory: PackageCheck, client: UserRound, review: ReceiptText };

export default function NewOrderLayout({ children }: { children: React.ReactNode }) {
  return <OrderDraftProvider><NewOrderFrame>{children}</NewOrderFrame></OrderDraftProvider>;
}

function NewOrderFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { draft, patchDraft } = useOrderDraft();
  const steps = draft.isBackOrder ? NEW_ORDER_STEPS.filter((step) => step.key !== "inventory") : [...NEW_ORDER_STEPS];
  const current = Math.max(0, steps.findIndex((step) => pathname.startsWith(step.path)));
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const toggleBackOrder = () => {
    patchDraft({
      isBackOrder: !draft.isBackOrder,
      backOrderDate: draft.isBackOrder ? "" : draft.backOrderDate,
      componentRequirements: [],
      stockChecked: false,
    });
  };

  return (
      <div className="space-y-6 pb-24 w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
                {draft.isBackOrder ? "Create Back Order" : "Create New Order"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Step {current + 1} of {steps.length} · {steps[current]?.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={draft.isBackOrder ? "default" : "outline"}
                onClick={toggleBackOrder}
                className="gap-2 rounded-xl"
              >
                <CalendarClock className="h-4 w-4" /> Back Order
              </Button>
              {draft.isBackOrder && (
                <Input
                  aria-label="Back order delivery date"
                  type="date"
                  min={minDate}
                  value={draft.backOrderDate}
                  onChange={(event) => patchDraft({ backOrderDate: event.target.value })}
                  className="w-auto rounded-xl border-amber-500/30 bg-amber-500/5"
                />
              )}
            </div>
          </div>
          {draft.isBackOrder && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
              Inventory availability will be skipped. This order will stay in Back Orders until it is marked delivered.
            </div>
          )}
        </motion.div>

        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          {steps.map((s, i) => {
            const Icon = ICONS[s.key];
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
                {i < steps.length - 1 && (
                  <div className={cn("h-px flex-1 min-w-4", done ? "bg-primary/40" : "bg-border/50")} />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Step page content */}
        {children}
      </div>
  );
}
