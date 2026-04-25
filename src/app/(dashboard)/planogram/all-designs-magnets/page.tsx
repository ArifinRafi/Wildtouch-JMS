"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Printer,
  Minus,
  Plus,
  ImageOff,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MAGNET_SEGMENTS } from "@/lib/data/magnets";

const SEGS = MAGNET_SEGMENTS;
const SEG_COUNT = SEGS.length; // 5

// ─── 3D cube animation ────────────────────────────────────────────────────────
const cubeVariants = {
  enter: (dir: number) => ({ opacity: 0, rotateY: dir > 0 ? 40 : -40, scale: 0.92, z: -60 }),
  center: { opacity: 1, rotateY: 0, scale: 1, z: 0 },
  exit:  (dir: number) => ({ opacity: 0, rotateY: dir > 0 ? -40 : 40, scale: 0.92, z: -60 }),
};

// ─── State: qty[segIdx][rowIdx][colIdx] ───────────────────────────────────────
function buildInitialQty(): number[][][] {
  return SEGS.map((seg) => seg.rows.map(() => [0, 0, 0]));
}

export default function AllDesignsMagnetsPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [qty, setQtyState] = useState(buildInitialQty);

  // ── Totals ──
  const segTotals = useMemo(
    () => qty.map((seg) => seg.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)),
    [qty]
  );
  const grandTotal = useMemo(() => segTotals.reduce((a, b) => a + b, 0), [segTotals]);

  const seg      = SEGS[activeIdx];
  const segSlots = qty[activeIdx];
  const segTotal = segTotals[activeIdx];

  // ── Mutation ──
  const setVal = useCallback(
    (segIdx: number, rowIdx: number, colIdx: number, value: number) => {
      const v = Math.max(0, value);
      setQtyState((prev) => {
        const next = prev.map((s) => s.map((r) => [...r]));
        next[segIdx][rowIdx][colIdx] = v;
        return next;
      });
    },
    []
  );

  const inc = (ri: number, ci: number) => setVal(activeIdx, ri, ci, segSlots[ri][ci] + 1);
  const dec = (ri: number, ci: number) => setVal(activeIdx, ri, ci, Math.max(0, segSlots[ri][ci] - 1));

  // ── Navigation ──
  const goTo = useCallback((idx: number) => {
    setDirection(idx > activeIdx ? 1 : -1);
    setActiveIdx(idx);
  }, [activeIdx]);

  const goPrev = () => { setDirection(-1); setActiveIdx((i) => (i === 0 ? SEG_COUNT - 1 : i - 1)); };
  const goNext = () => { setDirection(1);  setActiveIdx((i) => (i === SEG_COUNT - 1 ? 0 : i + 1)); };

  // ── Print ──
  const handlePrint = useCallback(() => {
    const rowsHtml = seg.rows.map((row, ri) => {
      const cells = row.map((product, ci) => {
        const v = segSlots[ri][ci];
        const name = product ? product.name : "—";
        return `<td class="cell">${name}</td><td class="qty">${v > 0 ? v : ""}</td>`;
      }).join("");
      const rowTot = segSlots[ri].reduce((a, b) => a + b, 0);
      return `<tr><td class="rn">${ri + 1}</td>${cells}<td class="tot">${rowTot > 0 ? rowTot : ""}</td></tr>`;
    }).join("");

    const colTotals = [0, 1, 2].map((ci) => segSlots.reduce((s, row) => s + row[ci], 0));

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Magnets — ${seg.title}</title>
<style>
  @page{size:A4 landscape;margin:15mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",Arial,sans-serif;font-size:10px;color:#111}
  header{border-bottom:2px solid #f59e0b;padding-bottom:6px;margin-bottom:12px}
  .brand{font-size:16px;font-weight:800;color:#d97706}
  .sub{font-size:11px;color:#555;margin-top:2px}
  table{width:100%;border-collapse:collapse}
  th{background:#d97706;color:#fff;padding:6px 8px;font-size:9px;text-transform:uppercase;letter-spacing:.05em}
  td{padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
  .rn{width:30px;text-align:center;font-weight:700;color:#d97706}
  .cell{font-weight:500;width:26%}
  .qty{text-align:center;font-weight:700;width:40px;color:#92400e}
  .tot{text-align:center;font-weight:700;color:#16a34a;width:50px}
  tfoot td{font-weight:800;border-top:2px solid #d97706;background:#fffbeb}
</style></head><body>
<header>
  <div class="brand">Wildtouch JMS — All Designs Magnets</div>
  <div class="sub">${seg.title} &nbsp;|&nbsp; Total: ${segTotal} units</div>
</header>
<table>
  <thead><tr>
    <th>#</th>
    <th colspan="2">Column 1</th>
    <th colspan="2">Column 2</th>
    <th colspan="2">Column 3</th>
    <th>Row Total</th>
  </tr></thead>
  <tbody>${rowsHtml}</tbody>
  <tfoot><tr>
    <td></td>
    ${colTotals.map((t) => `<td class="cell" style="font-weight:800">Column Total</td><td class="qty">${t}</td>`).join("")}
    <td class="tot">${segTotal}</td>
  </tr></tfoot>
</table>
</body></html>`;

    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }, [seg, segSlots, segTotal]);

  return (
    <div className="space-y-6 pb-12">
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
              All Designs — Magnets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              5 segments &middot; 17–18 rows each &middot;{" "}
              <span className="font-semibold text-primary">{grandTotal} total ordered</span>
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-primary" /> Print Segment
          </motion.button>
        </div>
      </motion.div>

      {/* ── Segment tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex items-center gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors shadow-sm shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.button>

        <div className="flex flex-1 gap-2">
          {SEGS.map((s, i) => {
            const isActive = i === activeIdx;
            return (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => goTo(i)}
                className={cn(
                  "relative flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all overflow-hidden",
                  isActive
                    ? "text-white shadow-lg"
                    : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mag-seg-bg"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${s.color}`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-0.5">
                  <span className="truncate max-w-full leading-tight">{s.shortTitle}</span>
                  <span className={cn(
                    "text-[10px] rounded-full px-1.5 font-bold leading-5",
                    isActive ? "bg-white/20" : "bg-muted/60"
                  )}>
                    {segTotals[i]}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={goNext}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors shadow-sm shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* ── 3D Segment card ── */}
      <div className="relative" style={{ perspective: "1200px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={seg.id}
            custom={direction}
            variants={cubeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            className={cn("rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden", seg.bgTint)}
          >
            {/* Segment header */}
            <div className={`bg-gradient-to-r ${seg.color} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <RotateCcw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{seg.title}</h2>
                  <p className="text-xs text-white/70">{seg.rows.length} rows &middot; 3 product columns</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white tabular-nums">{segTotal}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">segment total</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground w-8">#</th>
                    {[1, 2, 3].map((n) => (
                      <th key={n} className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground">
                        Column {n}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground w-16">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {seg.rows.map((row, ri) => {
                    const rowTotal = segSlots[ri].reduce((a, b) => a + b, 0);
                    return (
                      <tr key={ri} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                        {/* Row number */}
                        <td className="px-3 py-2 text-center">
                          <span className="text-[11px] font-bold text-muted-foreground">{ri + 1}</span>
                        </td>

                        {/* 3 product cells */}
                        {row.map((product, ci) => {
                          const v = segSlots[ri][ci];
                          return (
                            <td key={ci} className="px-2 py-1.5">
                              {product ? (
                                <div className="flex items-center gap-2">
                                  {/* 40px thumbnail */}
                                  <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center border border-border/20">
                                    {product.image ? (
                                      <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-contain p-0.5"
                                        sizes="40px"
                                        unoptimized
                                      />
                                    ) : (
                                      <ImageOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                                    )}
                                  </div>

                                  {/* Name + qty controls */}
                                  <div className="flex flex-col gap-1 min-w-0">
                                    <p className="text-[11px] font-medium leading-tight truncate max-w-[130px]">
                                      {product.name}
                                    </p>
                                    <div className="flex items-center gap-0.5">
                                      <button
                                        onClick={() => dec(ri, ci)}
                                        disabled={v <= 0}
                                        className="h-5 w-5 flex items-center justify-center rounded-md border border-border/40 hover:bg-accent/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <Minus className="h-2.5 w-2.5" />
                                      </button>
                                      <span className={cn(
                                        "w-6 text-center text-[11px] font-bold tabular-nums",
                                        v > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40"
                                      )}>
                                        {v || 0}
                                      </span>
                                      <button
                                        onClick={() => inc(ri, ci)}
                                        className="h-5 w-5 flex items-center justify-center rounded-md border border-border/40 hover:bg-accent/60 transition-colors"
                                      >
                                        <Plus className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-10 rounded-lg border border-dashed border-border/20" />
                              )}
                            </td>
                          );
                        })}

                        {/* Row total */}
                        <td className="px-3 py-2 text-center">
                          <span className={cn(
                            "text-sm font-bold tabular-nums",
                            rowTotal > 0 ? "text-primary" : "text-muted-foreground/30"
                          )}>
                            {rowTotal || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Column totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-border/40 bg-muted/20">
                    <td className="px-3 py-3" />
                    {[0, 1, 2].map((ci) => {
                      const colTotal = segSlots.reduce((s, row) => s + row[ci], 0);
                      return (
                        <td key={ci} className="px-2 py-3 text-center">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
                            Col {ci + 1}
                          </div>
                          <span className="text-sm font-bold tabular-nums">{colTotal}</span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">
                        Total
                      </div>
                      <span className="text-sm font-black tabular-nums text-primary">{segTotal}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Summary cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
      >
        {SEGS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              i === activeIdx
                ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
                : "border-border/30 bg-card/60 hover:bg-accent/30"
            )}
          >
            <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${s.color} mb-2`} />
            <p className="text-[10px] text-muted-foreground font-medium leading-snug mb-1">{s.shortTitle}</p>
            <p className="text-lg font-bold tabular-nums">{segTotals[i]}</p>
          </button>
        ))}
      </motion.div>

      {/* ── Grand total ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Grand Total — All Segments
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              5 segments · 3 columns each
            </p>
          </div>
        </div>
        <p className="text-2xl font-bold text-primary tabular-nums">{grandTotal}</p>
      </motion.div>
    </div>
  );
}
