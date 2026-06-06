"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Box, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RowPlanogramSide {
  label: string;
  rows: { description: string; defaultQty: number }[];
}

/**
 * Shared renderer for custom planograms: side tabs + a Row / Description / Qty table.
 * Controlled value[sideIdx][rowIdx]. `readOnly` shows static numbers (view page);
 * otherwise steppers (order flow).
 */
export function RowPlanogramGrid({
  sides,
  value,
  onChange,
  activeSide,
  onActiveSideChange,
  readOnly = false,
}: {
  sides: RowPlanogramSide[];
  value: number[][];
  onChange?: (next: number[][]) => void;
  activeSide: number;
  onActiveSideChange: (idx: number) => void;
  readOnly?: boolean;
}) {
  const sideTotals = sides.map((_, si) => (value[si] ?? []).reduce((a, b) => a + b, 0));

  const setVal = (sideIdx: number, rowIdx: number, v: number) => {
    if (!onChange) return;
    const next = value.map((s) => [...s]);
    next[sideIdx][rowIdx] = Math.max(0, v);
    onChange(next);
  };

  const side = sides[activeSide];
  const sideRows = value[activeSide] ?? [];

  const goPrev = () => onActiveSideChange(activeSide === 0 ? sides.length - 1 : activeSide - 1);
  const goNext = () => onActiveSideChange(activeSide === sides.length - 1 ? 0 : activeSide + 1);

  return (
    <div className="space-y-6">
      {/* Side tabs */}
      <div className="flex items-center gap-2">
        {sides.length > 1 && (
          <button onClick={goPrev} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {sides.map((s, i) => {
            const isActive = i === activeSide;
            return (
              <button key={i} onClick={() => onActiveSideChange(i)}
                className={cn("flex-1 min-w-[120px] relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all overflow-hidden",
                  isActive ? "bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/20" : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40")}>
                <span className="flex items-center justify-center gap-2">
                  <Box className="h-3.5 w-3.5" /> {s.label}
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold", isActive ? "bg-white/20" : "bg-muted/60")}>{sideTotals[i]}</span>
                </span>
              </button>
            );
          })}
        </div>
        {sides.length > 1 && (
          <button onClick={goNext} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSide} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-14">Row</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-44">Qty</th>
                </tr>
              </thead>
              <tbody>
                {side?.rows.map((r, ri) => {
                  const v = sideRows[ri] ?? 0;
                  return (
                    <tr key={ri} className="border-b border-border/15 last:border-b-0 hover:bg-accent/10">
                      <td className="px-4 py-3 text-center"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold">{ri + 1}</span></td>
                      <td className="px-4 py-3 text-sm font-medium">{r.description || <span className="text-muted-foreground/40">—</span>}</td>
                      <td className="px-4 py-3">
                        {readOnly ? (
                          <p className="text-right text-sm font-bold tabular-nums">{v}</p>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => setVal(activeSide, ri, v - 1)} disabled={v <= 0}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card hover:bg-accent/60 transition-colors disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                            <input type="number" min={0} value={v} onChange={(e) => setVal(activeSide, ri, parseInt(e.target.value, 10) || 0)}
                              className="h-8 w-16 rounded-lg border border-border/40 bg-muted/30 text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
                            <button onClick={() => setVal(activeSide, ri, v + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card hover:bg-accent/60 transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border/20 bg-muted/10 text-right">
            <p className="text-xs text-muted-foreground">Side total: <span className="font-semibold text-foreground">{sideTotals[activeSide]}</span></p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
