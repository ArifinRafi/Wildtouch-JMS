"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  Printer,
  Package,
  X,
  ChevronDown,
  ChevronUp,
  ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KEYRING_SECTIONS, ALL_PRODUCTS_COUNT } from "@/lib/data/large-keyrings";

// ─── State helpers ─────────────────────────────────────────────────────────────
type Quantities = Record<string, number>; // key = "sectionId:productIndex"

function qKey(sectionId: string, idx: number) {
  return `${sectionId}:${idx}`;
}

export default function AllDesignsLargeKeyringsPage() {
  const [quantities, setQuantities]   = useState<Quantities>({});
  const [search, setSearch]           = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [collapsed, setCollapsed]     = useState<Record<string, boolean>>({});
  const printRef = useRef<HTMLDivElement>(null);

  // ── Computed totals ──────────────────────────────────────────────────────────
  const grandTotal = useMemo(
    () => Object.values(quantities).reduce((a, b) => a + b, 0),
    [quantities]
  );

  const sectionTotals = useMemo(
    () =>
      Object.fromEntries(
        KEYRING_SECTIONS.map((sec) => [
          sec.id,
          sec.products.reduce(
            (sum, _, idx) => sum + (quantities[qKey(sec.id, idx)] ?? 0),
            0
          ),
        ])
      ),
    [quantities]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const setQty = (sectionId: string, idx: number, val: number) => {
    const clamped = Math.max(0, val);
    setQuantities((prev) => ({ ...prev, [qKey(sectionId, idx)]: clamped }));
  };

  const clearAll = () => setQuantities({});

  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Filter ───────────────────────────────────────────────────────────────────
  const searchLower = search.toLowerCase();
  const filteredSections = useMemo(
    () =>
      KEYRING_SECTIONS.map((sec) => ({
        ...sec,
        products: sec.products.filter(
          (p) =>
            (!search || p.name.toLowerCase().includes(searchLower)) &&
            (!activeSection || activeSection === sec.id)
        ),
      })).filter((sec) => sec.products.length > 0),
    [search, searchLower, activeSection]
  );

  // ── Print ────────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const orderedProducts = KEYRING_SECTIONS.flatMap((sec) =>
      sec.products
        .map((p, idx) => ({ ...p, section: sec.title, qty: quantities[qKey(sec.id, idx)] ?? 0 }))
        .filter((p) => p.qty > 0)
    );

    const rows = orderedProducts
      .map(
        (p, i) =>
          `<tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${p.section}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:600">${p.name}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700">${p.qty}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Large Keyrings Order</title>
<style>
  @page{size:A4;margin:20mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#111}
  header{border-bottom:2px solid #7c3aed;padding-bottom:8px;margin-bottom:16px}
  .brand{font-size:18px;font-weight:800;color:#7c3aed}
  .sub{font-size:12px;color:#555;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#7c3aed;color:#fff;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.06em;text-align:left}
  .total-row td{font-weight:800;border-top:2px solid #7c3aed;background:#f5f3ff!important}
</style></head><body>
<header>
  <div class="brand">Wildtouch JMS — All Designs Large Keyrings</div>
  <div class="sub">Order Form · ${new Date().toLocaleDateString("en-GB")} · Grand Total: ${grandTotal} units</div>
</header>
${orderedProducts.length === 0
  ? "<p style='color:#888;margin-top:20px'>No quantities entered.</p>"
  : `<table>
  <thead><tr><th>Section</th><th>Product</th><th style="text-align:center">Qty</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr class="total-row">
    <td colspan="2" style="padding:8px 10px">Grand Total</td>
    <td style="padding:8px 10px;text-align:center">${grandTotal}</td>
  </tr></tfoot>
</table>`}
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link
          href="/planogram"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Planograms
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              All Designs — Large Keyrings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {ALL_PRODUCTS_COUNT} designs across {KEYRING_SECTIONS.length} categories &middot;{" "}
              <span className="font-semibold text-primary">{grandTotal} ordered</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {grandTotal > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={clearAll}
                className="flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/70 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 px-3 py-2 text-xs font-semibold transition-colors shadow-sm"
              >
                <X className="h-3.5 w-3.5" /> Clear All
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 text-primary" /> Print Order
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Search + section filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="space-y-3"
      >
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search product name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/40 bg-card/70 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition placeholder:text-muted-foreground/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Section filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSection(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-all border",
              activeSection === null
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/60 border-border/40 text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {KEYRING_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(activeSection === sec.id ? null : sec.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all border",
                activeSection === sec.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card/60 border-border/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {sec.title}
              {sectionTotals[sec.id] > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-bold">
                  {sectionTotals[sec.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Sections ── */}
      <div className="space-y-6" ref={printRef}>
        <AnimatePresence initial={false}>
          {filteredSections.map((sec, secIdx) => {
            const isCollapsed = collapsed[sec.id];
            const secTotal = sectionTotals[sec.id];

            return (
              <motion.div
                key={sec.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: secIdx * 0.04 }}
                className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"
              >
                {/* Section header */}
                <button
                  onClick={() => toggleCollapse(sec.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${sec.color}`} />
                    <span className="font-semibold text-sm">{sec.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {sec.products.length} designs
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {secTotal > 0 && (
                      <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                        {secTotal} ordered
                      </span>
                    )}
                    {isCollapsed
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </button>

                {/* Product grid */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className={`h-0.5 bg-gradient-to-r ${sec.color} opacity-40`} />
                      <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                        {sec.products.map((product, idx) => {
                          const key = qKey(sec.id, idx);
                          // find original index in full section for correct key
                          const origSection = KEYRING_SECTIONS.find((s) => s.id === sec.id);
                          const origIdx = origSection
                            ? origSection.products.findIndex((p) => p.name === product.name)
                            : idx;
                          const trueKey = qKey(sec.id, origIdx);
                          const qty = quantities[trueKey] ?? 0;

                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: idx * 0.01 }}
                              className={cn(
                                "flex flex-col items-center rounded-xl border bg-background/50 p-2 gap-1.5 transition-all",
                                qty > 0
                                  ? "border-primary/40 shadow-sm shadow-primary/10 bg-primary/5"
                                  : "border-border/30 hover:border-border/60"
                              )}
                            >
                              {/* Product image */}
                              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-1"
                                    sizes="120px"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                                    <ImageOff className="h-5 w-5" />
                                  </div>
                                )}
                              </div>

                              {/* Name */}
                              <p className="text-[10px] text-center font-medium leading-tight text-foreground/80 line-clamp-2 w-full">
                                {product.name}
                              </p>

                              {/* Quantity input */}
                              <div className="flex items-center gap-1 mt-0.5">
                                <button
                                  onClick={() => setQty(sec.id, origIdx, qty - 1)}
                                  disabled={qty <= 0}
                                  className="h-5 w-5 rounded-md flex items-center justify-center text-xs font-bold border border-border/40 hover:bg-accent/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  value={qty === 0 ? "" : qty}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const v = parseInt(e.target.value, 10);
                                    setQty(sec.id, origIdx, isNaN(v) ? 0 : v);
                                  }}
                                  className={cn(
                                    "w-8 text-center text-xs font-bold tabular-nums bg-transparent focus:outline-none border-b",
                                    qty > 0
                                      ? "border-primary text-primary"
                                      : "border-border/40 text-muted-foreground"
                                  )}
                                />
                                <button
                                  onClick={() => setQty(sec.id, origIdx, qty + 1)}
                                  className="h-5 w-5 rounded-md flex items-center justify-center text-xs font-bold border border-border/40 hover:bg-accent/60 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredSections.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm">No products match your search</p>
            <button onClick={() => { setSearch(""); setActiveSection(null); }} className="text-xs text-primary underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Sticky grand total bar ── */}
      <AnimatePresence>
        {grandTotal > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-md shadow-xl px-6 py-3"
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Order Total</span>
            </div>
            <span className="text-xl font-black text-primary tabular-nums">{grandTotal}</span>
            <span className="text-xs text-muted-foreground">units</span>
            <button
              onClick={handlePrint}
              className="ml-2 flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
