"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Box,
  Printer,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Static Planogram Config ─────────────────────────────────────────────────
interface SideConfig {
  side: number;
  label: string;
  productType: string;
  color: string;
  bgTint: string;
  rows: { description: string; defaultQty: number }[];
  charms: string;
  boysCharms?: string;
}

const SIDE_CONFIGS: SideConfig[] = [
  {
    side: 1, label: "Side 1", productType: "Keyrings",
    color: "from-violet-500 to-purple-600", bgTint: "bg-violet-500/5",
    rows: [
      { description: "Heart & Charms", defaultQty: 6 },
      { description: "Heart & Charms", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
    ],
    charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
  },
  {
    side: 2, label: "Side 2", productType: "Necklaces",
    color: "from-blue-500 to-cyan-500", bgTint: "bg-blue-500/5",
    rows: [
      { description: "Heart & Charms", defaultQty: 6 },
      { description: "Heart & Charms", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
    ],
    charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
  },
  {
    side: 3, label: "Side 3", productType: "Bracelets",
    color: "from-emerald-500 to-teal-500", bgTint: "bg-emerald-500/5",
    rows: [
      { description: "Heart & Charms", defaultQty: 6 },
      { description: "Heart & Charms", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
    ],
    charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
  },
  {
    side: 4, label: "Side 4", productType: "Bracelets",
    color: "from-amber-500 to-orange-500", bgTint: "bg-amber-500/5",
    rows: [
      { description: "Beaded Bracelet & Charms", defaultQty: 6 },
      { description: "Beaded Bracelet & Charms", defaultQty: 6 },
      { description: "Charm Bracelet", defaultQty: 6 },
      { description: "Charm Bracelet", defaultQty: 6 },
      { description: "Glass Bracelets & Charms", defaultQty: 6 },
      { description: "Glass Bracelets & Charms", defaultQty: 6 },
      { description: "Boys Bracelets & Charms", defaultQty: 6 },
      { description: "Boys Bracelets & Charms", defaultQty: 6 },
    ],
    charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
    boysCharms: "Shark, Turtle, Anchor, Skull, 3D Penguin, Clownfish",
  },
];

// Build initial slot values: [sideIdx][rowIdx][slotIdx] = defaultQty
function buildInitialSlots(): number[][][] {
  return SIDE_CONFIGS.map((sc) =>
    sc.rows.map((r) => [r.defaultQty, r.defaultQty, r.defaultQty, r.defaultQty])
  );
}

// ─── 3D Cube rotation variants ──────────────────────────────────────────────
const cubeVariants = {
  enter: (dir: number) => ({ rotateY: dir > 0 ? 90 : -90, opacity: 0, scale: 0.88 }),
  center: { rotateY: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ rotateY: dir > 0 ? -90 : 90, opacity: 0, scale: 0.88 }),
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function FourSidedFloorStandPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [slots, setSlots] = useState(buildInitialSlots);

  // ── Computed totals ──
  const sideTotals = useMemo(
    () => slots.map((side) => side.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)),
    [slots]
  );
  const grandTotal = useMemo(() => sideTotals.reduce((a, b) => a + b, 0), [sideTotals]);

  // ── Slot mutation ──
  const setSlotValue = useCallback((sideIdx: number, rowIdx: number, slotIdx: number, value: number) => {
    const clamped = Math.max(1, Math.min(6, value));
    setSlots((prev) => {
      const next = prev.map((s) => s.map((r) => [...r]));
      next[sideIdx][rowIdx][slotIdx] = clamped;
      return next;
    });
  }, []);

  const increment = (si: number, ri: number, sli: number) =>
    setSlotValue(si, ri, sli, Math.min(6, slots[si][ri][sli] + 1));
  const decrement = (si: number, ri: number, sli: number) =>
    setSlotValue(si, ri, sli, Math.max(1, slots[si][ri][sli] - 1));

  // ── Navigation ──
  const goTo = useCallback((idx: number) => {
    setDirection(idx > activeIdx ? 1 : -1);
    setActiveIdx(idx);
  }, [activeIdx]);

  const goPrev = () => { setDirection(-1); setActiveIdx((i) => (i === 0 ? 3 : i - 1)); };
  const goNext = () => { setDirection(1); setActiveIdx((i) => (i === 3 ? 0 : i + 1)); };

  const cfg = SIDE_CONFIGS[activeIdx];
  const sideSlots = slots[activeIdx];
  const sideTotal = sideTotals[activeIdx];

  // ── Print ──
  const printSide = useCallback(() => {
    const rowsHtml = cfg.rows.map((r, ri) => {
      const sl = sideSlots[ri];
      const rowTotal = sl.reduce((a, b) => a + b, 0);
      return `<tr><td class="rn">${ri + 1}</td><td class="desc">${r.description}</td>${sl.map((v) => `<td class="sl">${v}</td>`).join("")}<td class="sl tot">${rowTotal}</td></tr>`;
    }).join("");
    const colTotals = [0, 1, 2, 3].map((ci) => sideSlots.reduce((s, row) => s + row[ci], 0));
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Planogram — ${cfg.label}</title>
<style>@page{size:A4;margin:20mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#111}header{border-bottom:2px solid #6d28d9;padding-bottom:8px;margin-bottom:16px}.brand{font-size:18px;font-weight:800;color:#6d28d9}.sub{font-size:12px;color:#555;margin-top:2px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#6d28d9;color:#fff;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.06em}td{padding:8px 10px;border-bottom:1px solid #e5e7eb}.rn{width:40px;text-align:center;font-weight:700;color:#6d28d9}.desc{font-weight:500}.sl{text-align:center;font-weight:700;width:60px}.tot{background:#f5f3ff}tfoot td{font-weight:800;border-top:2px solid #6d28d9}.note{margin-top:12px;font-size:10px;color:#666}</style></head><body>
<header><div class="brand">Wildtouch JMS — 4 Sided Floor Stand</div><div class="sub">${cfg.label} — ${cfg.productType} | Total: ${sideTotal}</div></header>
<table><thead><tr><th>Row</th><th>Description</th><th>Slot 1</th><th>Slot 2</th><th>Slot 3</th><th>Slot 4</th><th>Row Total</th></tr></thead><tbody>${rowsHtml}</tbody>
<tfoot><tr><td></td><td>Column Total</td>${colTotals.map((t) => `<td class="sl">${t}</td>`).join("")}<td class="sl tot">${sideTotal}</td></tr></tfoot></table>
<p class="note">Charms: ${cfg.charms}</p>${cfg.boysCharms ? `<p class="note">Boys Charms: ${cfg.boysCharms}</p>` : ""}</body></html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }, [cfg, sideSlots, sideTotal]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/planogram" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Planograms
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              4 Sided Floor Stand
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              4 sides &middot; 8 rows per side &middot;{" "}
              <span className="font-semibold text-primary">{grandTotal} total units</span>
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={printSide}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm">
            <Printer className="h-3.5 w-3.5 text-primary" /> Print Side
          </motion.button>
        </div>
      </motion.div>

      {/* ── Side selector tabs ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="flex items-center gap-2">
        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={goPrev}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors shadow-sm">
          <ChevronLeft className="h-4 w-4" />
        </motion.button>

        <div className="flex flex-1 gap-2">
          {SIDE_CONFIGS.map((s, i) => {
            const isActive = i === activeIdx;
            return (
              <motion.button key={s.side} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => goTo(i)}
                className={cn("flex-1 relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all overflow-hidden",
                  isActive ? "text-white shadow-lg" : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40")}>
                {isActive && (
                  <motion.div layoutId="side-bg" className={`absolute inset-0 rounded-xl bg-gradient-to-r ${s.color}`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Box className="h-3.5 w-3.5" />
                  {s.label}
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold", isActive ? "bg-white/20" : "bg-muted/60")}>
                    {sideTotals[i]}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={goNext}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors shadow-sm">
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* ── 3D Rotating Planogram Card ── */}
      <div className="relative" style={{ perspective: "1200px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={cfg.side} custom={direction} variants={cubeVariants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            className={cn("rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden", cfg.bgTint)}>

            {/* Side header bar */}
            <div className={`bg-gradient-to-r ${cfg.color} px-6 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <RotateCcw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{cfg.label}</h2>
                  <p className="text-xs text-white/70">{cfg.productType}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white tabular-nums">{sideTotal}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">units</p>
              </div>
            </div>

            {/* Grid table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-14">Row</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                    {[1, 2, 3, 4].map((n) => (
                      <th key={n} className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24">Slot {n}</th>
                    ))}
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.rows.map((r, ri) => {
                    const rowSlots = sideSlots[ri];
                    const rowTotal = rowSlots.reduce((a, b) => a + b, 0);
                    return (
                      <motion.tr key={ri} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: ri * 0.04 }}
                        className="border-b border-border/15 hover:bg-accent/15 transition-colors">

                        {/* Row number */}
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold", `bg-gradient-to-br ${cfg.color} text-white`)}>
                            {ri + 1}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3"><p className="text-sm font-medium">{r.description}</p></td>

                        {/* 4 editable slots */}
                        {rowSlots.map((qty, si) => (
                          <td key={si} className="px-2 py-3 text-center">
                            <div className="inline-flex items-center gap-0.5 rounded-xl border border-border/30 bg-card/60 p-0.5">
                              <button
                                onClick={() => decrement(activeIdx, ri, si)}
                                disabled={qty <= 1}
                                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className={cn(
                                "w-7 text-center text-sm font-bold tabular-nums",
                                qty === 6 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                              )}>
                                {qty}
                              </span>
                              <button
                                onClick={() => increment(activeIdx, ri, si)}
                                disabled={qty >= 6}
                                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        ))}

                        {/* Row total */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center rounded-xl px-2.5 py-1 text-sm font-bold tabular-nums bg-primary/10 border border-primary/20 text-primary">
                            {rowTotal}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>

                {/* Footer totals */}
                <tfoot>
                  <tr className="border-t-2 border-border/30 bg-muted/15">
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Column Total</td>
                    {[0, 1, 2, 3].map((ci) => {
                      const colTotal = sideSlots.reduce((s, row) => s + row[ci], 0);
                      return <td key={ci} className="px-2 py-3 text-center"><span className="text-sm font-bold tabular-nums">{colTotal}</span></td>;
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex items-center justify-center rounded-xl px-3 py-1 text-sm font-extrabold tabular-nums text-white", `bg-gradient-to-r ${cfg.color}`)}>
                        {sideTotal}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Charms note */}
            <div className="px-6 py-4 border-t border-border/20 space-y-1.5">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Charms:</span> {cfg.charms}
              </p>
              {cfg.boysCharms && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Boys Charms:</span> {cfg.boysCharms}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Side overview strip ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-4 gap-3">
        {SIDE_CONFIGS.map((s, i) => (
          <motion.button key={s.side} whileHover={{ y: -2 }} onClick={() => goTo(i)}
            className={cn("rounded-xl border p-3 text-left transition-all",
              i === activeIdx ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10" : "border-border/30 bg-card/50 hover:bg-card/80")}>
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("h-2 w-2 rounded-full", `bg-gradient-to-r ${s.color}`)} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{sideTotals[i]}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.productType}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* ── Grand total ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 py-4 px-6">
        <Box className="h-5 w-5 text-primary" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grand Total — All 4 Sides</p>
          <p className="text-2xl font-bold text-primary tabular-nums">{grandTotal}</p>
        </div>
      </motion.div>
    </div>
  );
}
