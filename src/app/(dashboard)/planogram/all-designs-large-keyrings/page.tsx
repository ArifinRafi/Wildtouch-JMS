"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Printer, Package, X, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { KEYRING_ROWS, TOTAL_PRODUCTS, type KeyringProduct } from "@/lib/data/large-keyrings";

// ─── Flat product list with row/col position for keying ──────────────────────
type Cell = { product: KeyringProduct; rowIdx: number; colIdx: number };

const ALL_CELLS: Cell[] = KEYRING_ROWS.flatMap((row, rowIdx) =>
  row
    .map((product, colIdx) => (product ? { product, rowIdx, colIdx } : null))
    .filter((c): c is Cell => c !== null)
);

function cellKey(rowIdx: number, colIdx: number) {
  return `${rowIdx}:${colIdx}`;
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  qty,
  onIncrement,
  onDecrement,
  onChange,
}: {
  product: KeyringProduct;
  qty: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border bg-background/50 p-2 gap-1.5 transition-all",
        qty > 0
          ? "border-primary/40 shadow-sm shadow-primary/10 bg-primary/5"
          : "border-border/30 hover:border-border/60"
      )}
    >
      {/* Image */}
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
          <ImageOff className="h-5 w-5 text-muted-foreground/30" />
        )}
      </div>

      {/* Name */}
      <p className="text-[10px] text-center font-medium leading-tight text-foreground/80 line-clamp-2 w-full">
        {product.name}
      </p>

      {/* Qty controls */}
      <div className="flex items-center gap-1 mt-0.5">
        <button
          onClick={onDecrement}
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
            onChange(isNaN(v) ? 0 : Math.max(0, v));
          }}
          className={cn(
            "w-8 text-center text-xs font-bold tabular-nums bg-transparent focus:outline-none border-b",
            qty > 0
              ? "border-primary text-primary"
              : "border-border/40 text-muted-foreground"
          )}
        />
        <button
          onClick={onIncrement}
          className="h-5 w-5 rounded-md flex items-center justify-center text-xs font-bold border border-border/40 hover:bg-accent/60 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AllDesignsLargeKeyringsPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const grandTotal = useMemo(
    () => Object.values(quantities).reduce((a, b) => a + b, 0),
    [quantities]
  );

  const setQty = (rowIdx: number, colIdx: number, val: number) =>
    setQuantities((prev) => ({ ...prev, [cellKey(rowIdx, colIdx)]: Math.max(0, val) }));

  const clearAll = () => setQuantities({});

  // Print order
  const handlePrint = () => {
    const ordered = ALL_CELLS.filter(
      ({ rowIdx, colIdx }) => (quantities[cellKey(rowIdx, colIdx)] ?? 0) > 0
    ).map(({ product, rowIdx, colIdx }) => ({
      name: product.name,
      qty: quantities[cellKey(rowIdx, colIdx)],
    }));

    const rows = ordered
      .map(
        (p, i) =>
          `<tr style="background:${i % 2 === 0 ? "#f9fafb" : "#fff"}">
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
${ordered.length === 0
      ? "<p style='color:#888;margin-top:20px'>No quantities entered.</p>"
      : `<table>
  <thead><tr><th>Product</th><th style="text-align:center;width:80px">Qty</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr class="total-row">
    <td style="padding:8px 10px">Grand Total</td>
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
    <div className="space-y-5 pb-20">
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
              {TOTAL_PRODUCTS} designs &middot;{" "}
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

      {/* ── 3-column grid — exact Excel layout ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-4"
      >
        <div className="grid grid-cols-3 gap-2">
          {KEYRING_ROWS.map((row, rowIdx) =>
            row.map((product, colIdx) => {
              const key = cellKey(rowIdx, colIdx);
              const qty = quantities[key] ?? 0;

              if (!product) {
                // Empty cell — keep the grid slot so alignment matches Excel
                return (
                  <div
                    key={`${rowIdx}-${colIdx}-empty`}
                    className="rounded-xl border border-dashed border-border/20 aspect-auto min-h-[120px]"
                  />
                );
              }

              return (
                <ProductCard
                  key={key}
                  product={product}
                  qty={qty}
                  onIncrement={() => setQty(rowIdx, colIdx, qty + 1)}
                  onDecrement={() => setQty(rowIdx, colIdx, Math.max(0, qty - 1))}
                  onChange={(v) => setQty(rowIdx, colIdx, v)}
                />
              );
            })
          )}
        </div>
      </motion.div>

      {/* ── Sticky floating total bar ── */}
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
