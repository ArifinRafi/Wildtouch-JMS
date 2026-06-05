"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Search,
  Minus,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Box,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepNav } from "@/components/orders/step-nav";
import { useOrderDraft } from "@/lib/store/order-draft";
import { useInventory } from "@/lib/store/inventory-store";
import {
  getOrderablePlanograms,
  type OrderablePlanogram,
} from "@/lib/data/planograms";
import { useCustomPlanograms } from "@/lib/hooks/use-planograms";
import { matchInventoryByDescription } from "@/lib/orders/match";

interface Row {
  description: string;
  segment: string;
  qtyOrdered: number;
}

export default function PlanogramStepPage() {
  const { draft, patchDraft } = useOrderDraft();
  const { items, loading } = useInventory();
  const { planograms: custom } = useCustomPlanograms();

  const planograms = useMemo<OrderablePlanogram[]>(() => {
    const customMapped: OrderablePlanogram[] = custom.map((c) => {
      const products = c.sides.flatMap((s) =>
        s.rows
          .filter((r) => r.description.trim())
          .map((r) => ({
            description: r.description,
            segment: s.label,
            image: null,
            defaultQty: r.defaultQty,
          })),
      );
      return { id: c.id, name: c.name, products, productCount: products.length };
    });
    return [...customMapped, ...getOrderablePlanograms()];
  }, [custom]);

  const [rows, setRows] = useState<Row[]>(() =>
    draft.lineItems.length
      ? draft.lineItems.map((li) => ({
          description: li.description,
          segment: li.category || "",
          qtyOrdered: li.qtyOrdered,
        }))
      : [],
  );
  const [query, setQuery] = useState("");

  const selected = draft.planogram;

  // Live inventory match per product (by description).
  const matchMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof matchInventoryByDescription>>();
    for (const r of rows) m.set(r.description, matchInventoryByDescription(r.description, items));
    return m;
  }, [rows, items]);

  const selectPlanogram = (p: OrderablePlanogram) => {
    patchDraft({ planogram: { id: p.id, name: p.name } });
    setRows(
      p.products.map((pr) => ({
        description: pr.description,
        segment: pr.segment,
        qtyOrdered: pr.defaultQty,
      })),
    );
    setQuery("");
  };

  const changePlanogram = () => {
    patchDraft({ planogram: null, lineItems: [] });
    setRows([]);
  };

  const setQty = (idx: number, v: number) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, qtyOrdered: Math.max(0, v) } : r)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !q || r.description.toLowerCase().includes(q));
  }, [rows, query]);

  const includedCount = rows.filter((r) => r.qtyOrdered > 0).length;
  const matchedCount = rows.filter((r) => r.qtyOrdered > 0 && matchMap.get(r.description)).length;
  const unmatchedCount = includedCount - matchedCount;
  const totalUnits = rows.reduce((s, r) => s + r.qtyOrdered, 0);

  const handleNext = (): boolean => {
    if (!selected) return false;
    const lineItems = rows
      .filter((r) => r.qtyOrdered > 0)
      .map((r) => {
        const m = matchMap.get(r.description);
        return {
          description: r.description,
          code: m?.code || "",
          category: m?.category || r.segment,
          qtyOrdered: r.qtyOrdered,
        };
      });
    if (lineItems.length === 0) return false;
    patchDraft({ lineItems, stockChecked: false });
    return true;
  };

  // ── Planogram selector ──
  if (!selected) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Select a planogram</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Pick the planogram to build this order from. You can adjust each product&rsquo;s quantity next.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {planograms.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPlanogram(p)}
                className="group text-left rounded-2xl border border-border/40 bg-card/60 hover:border-primary/40 hover:bg-accent/30 transition-colors overflow-hidden"
              >
                <div className="h-20 bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center">
                  <Box className="h-9 w-9 text-white/85" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {p.productCount} products
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <StepNav backHref="/orders" nextDisabled nextLabel="Next" />
      </div>
    );
  }

  // ── Editable product list ──
  return (
    <div className="space-y-6">
      {/* Selected planogram + change */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/70 glass px-5 py-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
            <LayoutGrid className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{selected.name}</p>
            <p className="text-[11px] text-muted-foreground">{rows.length} products</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40" onClick={changePlanogram}>
          <RefreshCcw className="h-3.5 w-3.5" /> Change
        </Button>
      </motion.div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Products included", value: includedCount.toLocaleString(), color: "text-primary bg-primary/10 border-primary/20" },
          { label: "Total units", value: totalUnits.toLocaleString(), color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { label: "Matched", value: matchedCount.toLocaleString(), color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: "No match", value: unmatchedCount.toLocaleString(), color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
        ].map((chip) => (
          <div key={chip.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}>
            {chip.label}: {chip.value}
          </div>
        ))}
      </div>

      {unmatchedCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {unmatchedCount} included product{unmatchedCount === 1 ? "" : "s"} couldn&rsquo;t be matched to inventory by description.
            They&rsquo;ll be flagged in the inventory check. Set their quantity to 0 to exclude them.
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 rounded-xl bg-card/70 glass border-border/40"
        />
      </div>

      {/* Product table */}
      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading inventory…</span>
          </div>
        ) : (
          <div className="max-h-[460px] overflow-y-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border/30 bg-muted/40">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inventory</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-44">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-sm text-muted-foreground">No products match your search</td>
                  </tr>
                ) : (
                  filtered.map(({ r, i }) => {
                    const m = matchMap.get(r.description);
                    return (
                      <tr key={i} className={cn("border-b border-border/20 last:border-b-0", r.qtyOrdered === 0 && "opacity-50")}>
                        <td className="px-5 py-2.5 align-middle">
                          <p className="text-sm font-medium">{r.description}</p>
                          <p className="text-[10px] text-muted-foreground">{r.segment}</p>
                        </td>
                        <td className="px-5 py-2.5 align-middle">
                          {m ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {m.qtyAvailable.toLocaleString()} in stock
                              {m.code ? <span className="font-mono text-muted-foreground">· {m.code}</span> : null}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" /> Not in inventory
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2.5 align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setQty(i, r.qtyOrdered - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card hover:bg-accent/60 transition-colors disabled:opacity-30"
                              disabled={r.qtyOrdered <= 0}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={r.qtyOrdered}
                              onChange={(e) => setQty(i, parseInt(e.target.value, 10) || 0)}
                              className="h-8 w-16 rounded-lg border border-border/40 bg-muted/30 text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            />
                            <button
                              onClick={() => setQty(i, r.qtyOrdered + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card hover:bg-accent/60 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StepNav
        backHref="/orders"
        nextHref="/orders/new/inventory"
        onNext={handleNext}
        nextDisabled={includedCount === 0}
      />
    </div>
  );
}
