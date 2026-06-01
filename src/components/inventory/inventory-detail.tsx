"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Boxes,
  Package,
  PackageCheck,
  PackageX,
  Printer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/data/inventory/types";

// Quantity badge colour by stock level
function qtyClass(qty: number) {
  if (qty === 0) return "bg-red-500/10 border-red-500/25 text-red-500";
  if (qty < 30) return "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400";
  return "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400";
}

export function InventoryDetail({
  name,
  items,
}: {
  name: string;
  items: InventoryItem[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (it) =>
        it.description.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q) ||
        it.components.some(
          (c) => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q),
        ),
    );
  }, [items, search]);

  // Stats (over the full set, not filtered)
  const totalQty = items.reduce((s, it) => s + it.qtyAvailable, 0);
  const outOfStock = items.filter((it) => it.qtyAvailable === 0).length;
  const inStock = items.length - outOfStock;

  const printList = () => {
    const rowsHtml = filtered
      .map(
        (it) => `<tr>
          <td><strong>${it.description || "—"}</strong></td>
          <td>${it.code || "—"}</td>
          <td>${it.components.map((c) => c.code).join(" + ") || "—"}</td>
          <td class="num">${it.qtyAvailable}</td>
        </tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Wildtouch JMS — Inventory · ${name}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10px; color: #111; }
  header { border-bottom: 2px solid #6d28d9; padding-bottom: 8px; margin-bottom: 12px; }
  .brand { font-size: 17px; font-weight: 800; color: #6d28d9; }
  .sub { font-size: 11px; color: #555; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #6d28d9; color: #fff; }
  thead th { padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
  tbody tr:nth-child(even) { background: #f5f3ff; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; }
  td.num { text-align: right; font-weight: 700; }
</style></head><body>
<header><div class="brand">Wildtouch JMS — Inventory</div>
<div class="sub">${name} · ${filtered.length} products · Total Qty Available: ${totalQty.toLocaleString()}</div></header>
<table><thead><tr><th>Product Description</th><th>Finished Code</th><th>Components</th><th style="text-align:right">Qty Available</th></tr></thead>
<tbody>${rowsHtml}</tbody></table>
</body></html>`;
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Inventory
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              {name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Finished product codes & components ·{" "}
              <span className="font-semibold text-primary">{items.length} products</span>
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={printList}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
          </motion.button>
        </div>
      </motion.div>

      {/* Stat chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Package, label: "Total Products", value: items.length, color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Boxes, label: "Total Qty Available", value: totalQty, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { icon: PackageCheck, label: "In Stock", value: inStock, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: PackageX, label: "Out of Stock", value: outOfStock, color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" },
        ].map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}
          >
            <chip.icon className="h-4 w-4" />
            {chip.label}: {chip.value.toLocaleString()}
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search by description or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl bg-card/70 glass border-border/40"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product Description</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Finished Code</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Components</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty Available</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Package className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No products match your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((it, i) => (
                    <motion.tr
                      key={`${it.code}-${i}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.18, delay: Math.min(i, 15) * 0.015 }}
                      className="border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0"
                    >
                      {/* Row number */}
                      <td className="px-5 py-3 align-middle">
                        <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
                            <Boxes className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium">{it.description || "—"}</p>
                        </div>
                      </td>

                      {/* Finished code */}
                      <td className="px-5 py-3 align-middle">
                        {it.code ? (
                          <span className="inline-flex items-center rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-xs font-mono font-semibold">
                            {it.code}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Components */}
                      <td className="px-5 py-3 align-middle">
                        <div className="flex flex-wrap items-center gap-1">
                          {it.components.length > 0 ? (
                            it.components.map((c, ci) => (
                              <span
                                key={ci}
                                title={c.label}
                                className="inline-flex items-center rounded-md bg-muted/30 border border-border/30 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                              >
                                {c.code}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </div>
                      </td>

                      {/* Quantity available */}
                      <td className="px-5 py-3 align-middle text-right">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-xl px-3 py-1 text-sm font-bold tabular-nums border",
                            qtyClass(it.qtyAvailable),
                          )}
                        >
                          {it.qtyAvailable.toLocaleString()}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/20 bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
            <span className="font-semibold text-foreground">{items.length}</span> products
            {" · "}
            <span className="font-semibold text-violet-600 dark:text-violet-400">
              {totalQty.toLocaleString()}
            </span>{" "}
            total available
          </p>
        </div>
      </motion.div>
    </div>
  );
}
