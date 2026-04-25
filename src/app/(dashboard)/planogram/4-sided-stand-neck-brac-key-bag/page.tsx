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
  slotLabels: [string, string, string, string];
  rows: { description: string; defaultQty: number }[];
  charms?: string;
  boysCharms?: string;
}

const SIDE_CONFIGS: SideConfig[] = [
  {
    side: 1,
    label: "Side 1",
    productType: "Heart & Charms",
    color: "from-rose-500 to-pink-600",
    bgTint: "bg-rose-500/5",
    slotLabels: ["Necklace", "Keyring", "Bracelet", "Bag Charm"],
    rows: [
      { description: "Heart & Charms — Rose",               defaultQty: 6 },
      { description: "Heart & Charms — Amethyst",           defaultQty: 6 },
      { description: "Heart & Charms — Howlite Turquoise",  defaultQty: 6 },
      { description: "Heart & Charms — Opal",               defaultQty: 6 },
      { description: "Heart & Charms — Blue Goldstone",     defaultQty: 6 },
      { description: "Heart & Charms — Watermelon",         defaultQty: 6 },
      { description: "Heart & Charms — Amazonite",          defaultQty: 6 },
      { description: "Heart & Charms — Coral",              defaultQty: 6 },
    ],
    charms: "",
  },
  {
    side: 2,
    label: "Side 2",
    productType: "Glitter",
    color: "from-fuchsia-500 to-purple-600",
    bgTint: "bg-fuchsia-500/5",
    slotLabels: ["Necklace", "Keyring", "Bracelet", "Bag Charm"],
    rows: [
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
    ],
    charms: "",
  },
  {
    side: 3,
    label: "Side 3",
    productType: "Glitter",
    color: "from-indigo-500 to-blue-600",
    bgTint: "bg-indigo-500/5",
    slotLabels: ["Necklace", "Keyring", "Bracelet", "Bag Charm"],
    rows: [
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
      { description: "Glitter", defaultQty: 6 },
    ],
    charms: "",
  },
  {
    side: 4,
    label: "Side 4",
    productType: "Bracelets",
    color: "from-emerald-500 to-teal-600",
    bgTint: "bg-emerald-500/5",
    slotLabels: ["Bracelet", "Bracelet", "Bracelet", "Bracelet"],
    rows: [
      { description: "Beaded Bracelet & Charms",  defaultQty: 6 },
      { description: "Beaded Bracelet & Charms",  defaultQty: 6 },
      { description: "Charm Bracelet & Charms",   defaultQty: 6 },
      { description: "Charm Bracelet & Charms",   defaultQty: 6 },
      { description: "Glass Bracelets & Charms",  defaultQty: 6 },
      { description: "Glass Bracelets & Charms",  defaultQty: 6 },
      { description: "Boys Bracelets & Charms",   defaultQty: 6 },
      { description: "Boys Bracelets & Charms",   defaultQty: 6 },
    ],
    charms: "",
    boysCharms: "",
  },
];

// ─── 3D Cube Animation ────────────────────────────────────────────────────────
const cubeVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    rotateY: dir > 0 ? 40 : -40,
    scale: 0.92,
    z: -60,
  }),
  center: { opacity: 1, rotateY: 0, scale: 1, z: 0 },
  exit: (dir: number) => ({
    opacity: 0,
    rotateY: dir > 0 ? -40 : 40,
    scale: 0.92,
    z: -60,
  }),
};

// ─── Build initial slot state ─────────────────────────────────────────────────
function buildInitialSlots(): number[][][] {
  return SIDE_CONFIGS.map((sc) =>
    sc.rows.map((r) => [r.defaultQty, r.defaultQty, r.defaultQty, r.defaultQty])
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function FourSidedStandNeckBracKeyBagPage() {
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
    const clamped = Math.max(1, value);
    setSlots((prev) => {
      const next = prev.map((s) => s.map((r) => [...r]));
      next[sideIdx][rowIdx][slotIdx] = clamped;
      return next;
    });
  }, []);

  const increment = (si: number, ri: number, sli: number) =>
    setSlotValue(si, ri, sli, slots[si][ri][sli] + 1);
  const decrement = (si: number, ri: number, sli: number) =>
    setSlotValue(si, ri, sli, Math.max(1, slots[si][ri][sli] - 1));

  // ── Navigation ──
  const goTo = useCallback((idx: number) => {
    setDirection(idx > activeIdx ? 1 : -1);
    setActiveIdx(idx);
  }, [activeIdx]);

  const goPrev = () => { setDirection(-1); setActiveIdx((i) => (i === 0 ? 3 : i - 1)); };
  const goNext = () => { setDirection(1);  setActiveIdx((i) => (i === 3 ? 0 : i + 1)); };

  const cfg       = SIDE_CONFIGS[activeIdx];
  const sideSlots = slots[activeIdx];
  const sideTotal = sideTotals[activeIdx];

  // ── Unique slot label headers for current side ──
  const uniqueSlotLabels = [...new Set(cfg.slotLabels)];
  const isAllSameLabel   = uniqueSlotLabels.length === 1;

  // ── Print ──
  const printSide = useCallback(() => {
    const colHeaders = isAllSameLabel
      ? ["Slot 1", "Slot 2", "Slot 3", "Slot 4"]
      : (cfg.slotLabels as string[]);

    const rowsHtml = cfg.rows.map((r, ri) => {
      const sl       = sideSlots[ri];
      const rowTotal = sl.reduce((a, b) => a + b, 0);
      return `<tr>
        <td class="rn">${ri + 1}</td>
        <td class="desc">${r.description}</td>
        ${sl.map((v) => `<td class="sl">${v}</td>`).join("")}
        <td class="sl tot">${rowTotal}</td>
      </tr>`;
    }).join("");

    const colTotals = [0, 1, 2, 3].map((ci) => sideSlots.reduce((s, row) => s + row[ci], 0));

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Planogram — ${cfg.label}</title>
<style>
  @page{size:A4;margin:20mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#111}
  header{border-bottom:2px solid #e11d48;padding-bottom:8px;margin-bottom:16px}
  .brand{font-size:18px;font-weight:800;color:#e11d48}
  .sub{font-size:12px;color:#555;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#e11d48;color:#fff;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
  td{padding:8px 10px;border-bottom:1px solid #e5e7eb}
  .rn{width:40px;text-align:center;font-weight:700;color:#e11d48}
  .desc{font-weight:500}
  .sl{text-align:center;font-weight:700;width:72px}
  .tot{background:#fff1f2}
  tfoot td{font-weight:800;border-top:2px solid #e11d48}
  .note{margin-top:12px;font-size:10px;color:#666}
</style></head><body>
<header>
  <div class="brand">Wildtouch JMS — 4 Sided Stand Neck Brac Key Bag</div>
  <div class="sub">${cfg.label} — ${cfg.productType} | Total: ${sideTotal}</div>
</header>
<table>
  <thead>
    <tr>
      <th>Row</th><th>Description</th>
      ${colHeaders.map((h) => `<th>${h}</th>`).join("")}
      <th>Row Total</th>
    </tr>
  </thead>
  <tbody>${rowsHtml}</tbody>
  <tfoot>
    <tr>
      <td></td><td>Column Total</td>
      ${colTotals.map((t) => `<td class="sl">${t}</td>`).join("")}
      <td class="sl tot">${sideTotal}</td>
    </tr>
  </tfoot>
</table>
${cfg.charms ? `<p class="note">Charms: ${cfg.charms}</p>` : ""}
${cfg.boysCharms ? `<p class="note">Boys Charms: ${cfg.boysCharms}</p>` : ""}
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }, [cfg, sideSlots, sideTotal, isAllSameLabel]);

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
              4 Sided Stand — Neck Brac Key Bag
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              4 sides &middot; 8 rows per side &middot; 4 product types &middot;{" "}
              <span className="font-semibold text-primary">{grandTotal} total units</span>
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={printSide}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-primary" /> Print Side
          </motion.button>
        </div>
      </motion.div>

      {/* ── Side selector tabs ── */}
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
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </motion.button>

        <div className="flex flex-1 gap-2">
          {SIDE_CONFIGS.map((s, i) => {
            const isActive = i === activeIdx;
            return (
              <motion.button
                key={s.side}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => goTo(i)}
                className={cn(
                  "flex-1 relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all overflow-hidden",
                  isActive
                    ? "text-white shadow-lg"
                    : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="side-bg-nbkb"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${s.color}`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Box className="h-3.5 w-3.5" />
                  {s.label}
                  <span className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                    isActive ? "bg-white/20" : "bg-muted/60"
                  )}>
                    {sideTotals[i]}
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
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors shadow-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* ── 3D Rotating Planogram Card ── */}
      <div className="relative" style={{ perspective: "1200px" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={cfg.side}
            custom={direction}
            variants={cubeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformStyle: "preserve-3d" }}
            className={cn("rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden", cfg.bgTint)}
          >
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
                <p className="text-2xl font-black text-white tabular-nums">{sideTotal}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">side total</p>
              </div>
            </div>

            {/* ── Planogram table ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-10">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground min-w-[220px]">Description</th>
                    {cfg.slotLabels.map((lbl, i) => (
                      <th key={i} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground min-w-[120px]">
                        {isAllSameLabel ? `Slot ${i + 1}` : lbl}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground w-20">Row Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cfg.rows.map((row, ri) => {
                    const rowSlots = sideSlots[ri];
                    const rowTotal = rowSlots.reduce((a, b) => a + b, 0);
                    return (
                      <tr key={ri} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-bold text-muted-foreground">{ri + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{row.description}</span>
                        </td>
                        {rowSlots.map((qty, si) => (
                          <td key={si} className="px-3 py-2 text-center">
                            <div className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-background/60 px-1.5 py-1">
                              <button
                                onClick={() => decrement(activeIdx, ri, si)}
                                disabled={qty <= 1}
                                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className={cn(
                                "w-7 text-center text-sm font-bold tabular-nums",
                                qty >= 6
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              )}>
                                {qty}
                              </span>
                              <button
                                onClick={() => increment(activeIdx, ri, si)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent/60 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold tabular-nums text-primary">{rowTotal}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Column totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-border/40 bg-muted/20">
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Column Total
                    </td>
                    {[0, 1, 2, 3].map((ci) => {
                      const colTotal = sideSlots.reduce((s, row) => s + row[ci], 0);
                      return (
                        <td key={ci} className="px-3 py-3 text-center">
                          <span className="text-sm font-bold tabular-nums text-foreground">{colTotal}</span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-black tabular-nums text-primary">{sideTotal}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Slot label legend (only for Side 1 / mixed labels) */}
            {!isAllSameLabel && (
              <div className="px-6 py-3 border-t border-border/20 bg-muted/10 flex items-center gap-4 flex-wrap">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Columns:</p>
                {cfg.slotLabels.map((lbl, i) => (
                  <span key={i} className="text-[11px] font-medium text-foreground/70">
                    <span className="font-bold text-foreground">Slot {i + 1}</span> = {lbl}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Summary Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {SIDE_CONFIGS.map((s, i) => (
          <button
            key={s.side}
            onClick={() => goTo(i)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              i === activeIdx
                ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10"
                : "border-border/30 bg-card/60 hover:bg-accent/30"
            )}
          >
            <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${s.color} mb-3`} />
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className="text-xs text-muted-foreground/60 mb-2">{s.productType}</p>
            <p className="text-lg font-bold tabular-nums">{sideTotals[i]}</p>
          </button>
        ))}
      </motion.div>

      {/* Grand total */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-5 flex items-center justify-between"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grand Total — All Sides</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">4 sides · 8 rows · 4 product types</p>
        </div>
        <p className="text-2xl font-bold text-primary tabular-nums">{grandTotal}</p>
      </motion.div>
    </div>
  );
}
