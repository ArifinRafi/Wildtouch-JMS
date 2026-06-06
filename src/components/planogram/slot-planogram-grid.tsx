"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Box, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SlotSide } from "@/lib/data/slot-planograms";

/**
 * Shared editable slot-grid planogram renderer (the 4-sided stand design).
 * Controlled: `value[sideIdx][rowIdx][slotIdx]` quantities + `onChange`.
 */
export function SlotPlanogramGrid({
  sides,
  slotCount,
  value,
  onChange,
  activeSide,
  onActiveSideChange,
}: {
  sides: SlotSide[];
  slotCount: number;
  value: number[][][];
  onChange: (next: number[][][]) => void;
  activeSide: number;
  onActiveSideChange: (idx: number) => void;
}) {
  const sideTotals = sides.map((_, si) =>
    (value[si] ?? []).reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0),
  );

  const setSlot = (sideIdx: number, rowIdx: number, slotIdx: number, v: number) => {
    const next = value.map((s) => s.map((r) => [...r]));
    next[sideIdx][rowIdx][slotIdx] = Math.max(0, v);
    onChange(next);
  };

  const cfg = sides[activeSide];
  const sideSlots = value[activeSide] ?? [];
  const slotHeaders = cfg.slotLabels && cfg.slotLabels.length === slotCount
    ? cfg.slotLabels
    : Array.from({ length: slotCount }, (_, i) => `Slot ${i + 1}`);
  const colTotals = Array.from({ length: slotCount }, (_, ci) =>
    sideSlots.reduce((s, row) => s + (row[ci] ?? 0), 0),
  );

  const goPrev = () => onActiveSideChange(activeSide === 0 ? sides.length - 1 : activeSide - 1);
  const goNext = () => onActiveSideChange(activeSide === sides.length - 1 ? 0 : activeSide + 1);

  return (
    <div className="space-y-6">
      {/* Side tabs */}
      <div className="flex items-center gap-2">
        <button onClick={goPrev}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {sides.map((s, i) => {
            const isActive = i === activeSide;
            return (
              <button key={s.side} onClick={() => onActiveSideChange(i)}
                className={cn(
                  "flex-1 min-w-[140px] relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all overflow-hidden",
                  isActive ? "text-white shadow-lg" : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40",
                )}>
                {isActive && (
                  <motion.div layoutId="slot-side-bg" className={`absolute inset-0 rounded-xl bg-gradient-to-r ${s.color}`}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Box className="h-3.5 w-3.5" /> {s.label}
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold", isActive ? "bg-white/20" : "bg-muted/60")}>
                    {sideTotals[i]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <button onClick={goNext}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Active side grid */}
      <AnimatePresence mode="wait">
        <motion.div key={cfg.side} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className={cn("rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden", cfg.bgTint)}>
          {/* Side header */}
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
              <p className="text-2xl font-bold text-white tabular-nums">{sideTotals[activeSide]}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">units</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-14">Row</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                  {slotHeaders.map((label, n) => (
                    <th key={n} className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-28">{label}</th>
                  ))}
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {cfg.rows.map((r, ri) => {
                  const rowSlots = sideSlots[ri] ?? [];
                  const rowTotal = rowSlots.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={ri} className="border-b border-border/15 last:border-b-0 hover:bg-accent/15 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold">{ri + 1}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{r.description}</td>
                      {Array.from({ length: slotCount }, (_, ci) => {
                        const v = rowSlots[ci] ?? 0;
                        return (
                          <td key={ci} className="px-2 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setSlot(activeSide, ri, ci, v - 1)} disabled={v <= 0}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-card hover:bg-accent/60 transition-colors disabled:opacity-30">
                                <Minus className="h-3 w-3" />
                              </button>
                              <input type="number" min={0} value={v}
                                onChange={(e) => setSlot(activeSide, ri, ci, parseInt(e.target.value, 10) || 0)}
                                className="h-7 w-12 rounded-md border border-border/40 bg-muted/30 text-center text-xs tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
                              <button onClick={() => setSlot(activeSide, ri, ci, v + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-card hover:bg-accent/60 transition-colors">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-xl bg-primary/15 text-primary px-2.5 py-1 text-sm font-bold tabular-nums">{rowTotal}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-muted/20">
                  <td />
                  <td className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Column Total</td>
                  {colTotals.map((t, ci) => (
                    <td key={ci} className="px-2 py-3 text-center text-sm font-bold tabular-nums">{t}</td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white px-2.5 py-1 text-sm font-bold tabular-nums">{sideTotals[activeSide]}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Charms note */}
          {(cfg.charms || cfg.boysCharms) && (
            <div className="px-5 py-3 border-t border-border/20 bg-muted/10 space-y-0.5">
              {cfg.charms && <p className="text-[11px] text-muted-foreground"><span className="font-semibold">Charms:</span> {cfg.charms}</p>}
              {cfg.boysCharms && <p className="text-[11px] text-muted-foreground"><span className="font-semibold">Boys Charms:</span> {cfg.boysCharms}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Side preview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {sides.map((s, i) => (
          <button key={s.side} onClick={() => onActiveSideChange(i)}
            className={cn(
              "rounded-2xl border bg-card/70 glass px-4 py-3 text-left transition-colors",
              i === activeSide ? "border-primary/50" : "border-border/40 hover:bg-accent/30",
            )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${s.color}`} />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-sm font-bold tabular-nums">{sideTotals[i]}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{s.productType}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
