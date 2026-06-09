"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StepNav } from "@/components/orders/step-nav";
import { useOrderDraft } from "@/lib/store/order-draft";
import { useInventory } from "@/lib/store/inventory-store";
import { useProducts } from "@/lib/hooks/use-products";
import { normalizeName } from "@/lib/orders/match";

interface Requirement {
  code: string;
  label: string;
  qtyRequired: number;
  available: number;
}

export default function InventoryStepPage() {
  const { draft, patchDraft } = useOrderDraft();
  const { items, loading: invLoading } = useInventory();
  const { products, loading: prodLoading } = useProducts();

  const loading = invLoading || prodLoading;

  // Map: normalized product name -> Product (for BOM lookup)
  const productByName = useMemo(() => {
    const m = new Map<string, (typeof products)[number]>();
    for (const p of products) m.set(normalizeName(p.name), p);
    return m;
  }, [products]);

  // Map: component code -> available stock
  const stockByCode = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) if (it.code) m.set(it.code, (m.get(it.code) ?? 0) + it.qtyAvailable);
    return m;
  }, [items]);

  const { requirements, noBom } = useMemo(() => {
    const reqMap = new Map<string, Requirement>();
    const noBomList: { description: string; qtyOrdered: number }[] = [];

    for (const li of draft.lineItems) {
      const product = productByName.get(normalizeName(li.description));
      const comps = product?.components ?? [];
      if (!comps.length) {
        noBomList.push({ description: li.description, qtyOrdered: li.qtyOrdered });
        continue;
      }
      for (const c of comps) {
        if (!c.code) continue;
        const need = (c.qtyPerUnit || 1) * li.qtyOrdered;
        const existing = reqMap.get(c.code);
        if (existing) existing.qtyRequired += need;
        else reqMap.set(c.code, { code: c.code, label: c.label || c.code, qtyRequired: need, available: stockByCode.get(c.code) ?? 0 });
      }
    }
    const requirements = [...reqMap.values()].sort((a, b) => {
      const as = a.available < a.qtyRequired ? 0 : 1;
      const bs = b.available < b.qtyRequired ? 0 : 1;
      return as - bs || a.code.localeCompare(b.code);
    });
    return { requirements, noBom: noBomList };
  }, [draft.lineItems, productByName, stockByCode]);

  const shortCount = requirements.filter((r) => r.available < r.qtyRequired).length;
  const okCount = requirements.length - shortCount;
  const totalLines = draft.lineItems.length;

  // Can proceed if nothing is short. (No requirements yet → allowed, with a note.)
  const canProceed = totalLines > 0 && shortCount === 0;

  const handleNext = (): boolean => {
    patchDraft({
      componentRequirements: requirements.map((r) => ({
        code: r.code,
        label: r.label,
        qtyRequired: r.qtyRequired,
        deducted: false,
      })),
      stockChecked: true,
    });
    return true;
  };

  if (totalLines === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/40 bg-card/70 glass p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500/60 mx-auto mb-3" />
          <p className="text-sm font-medium">No products selected yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Go back and pick a planogram with quantities.</p>
        </div>
        <StepNav backHref="/orders/new/planogram" nextDisabled />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/70 glass px-5 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/15"><PackageCheck className="h-4 w-4 text-primary" /></div>
        <div>
          <p className="text-sm font-semibold">Inventory availability</p>
          <p className="text-[11px] text-muted-foreground">{totalLines} product line{totalLines === 1 ? "" : "s"} · components checked against stock</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Checking inventory…</span>
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Components needed", value: requirements.length, color: "text-primary bg-primary/10 border-primary/20" },
              { label: "Available", value: okCount, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              { label: "Short", value: shortCount, color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" },
            ].map((chip) => (
              <div key={chip.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}>
                {chip.label}: {chip.value}
              </div>
            ))}
          </div>

          {/* Status banner */}
          {requirements.length === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>None of the selected products have components defined yet, so there&rsquo;s nothing to deduct. You can continue — add component breakdowns to products to enable stock deduction.</span>
            </div>
          ) : shortCount === 0 ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>All required components are in stock. Inventory will be deducted when you confirm the order.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{shortCount} component{shortCount === 1 ? " is" : "s are"} short of the required quantity. Reduce quantities or restock before continuing.</span>
            </div>
          )}

          {/* Requirements table */}
          {requirements.length > 0 && (
            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Component</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Required</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Available</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requirements.map((r) => {
                    const short = r.available < r.qtyRequired;
                    return (
                      <tr key={r.code} className="border-b border-border/20 last:border-b-0">
                        <td className="px-5 py-3">
                          <span className="text-sm font-medium">{r.label}</span>
                          <span className="ml-2 text-xs font-mono text-muted-foreground">{r.code}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-semibold tabular-nums">{r.qtyRequired.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right text-sm tabular-nums">{r.available.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            short ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}>
                            {short ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {short ? "Short" : "OK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Products with no BOM */}
          {noBom.length > 0 && requirements.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{noBom.length} ordered product{noBom.length === 1 ? "" : "s"} have no components defined and won&rsquo;t deduct any stock.</span>
            </div>
          )}
        </>
      )}

      <StepNav backHref="/orders/new/planogram" nextHref="/orders/new/client" onNext={handleNext} nextDisabled={loading || !canProceed} />
    </div>
  );
}
