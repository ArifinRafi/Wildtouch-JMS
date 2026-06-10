"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Box, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RowPlanogramSide {
  label: string;
  columns: number;
  rows: { description: string }[];
}

/**
 * Renderer for custom planograms: side tabs + Row / Description / Col 1..N / Total.
 * Controlled value[sideIdx][rowIdx][colIdx]. `readOnly` shows static numbers.
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
  value: number[][][];
  onChange?: (next: number[][][]) => void;
  activeSide: number;
  onActiveSideChange: (idx: number) => void;
  readOnly?: boolean;
}) {
  const sideTotals = sides.map((_, si) =>
    (value[si] ?? []).reduce((a, row) => a + row.reduce((x, y) => x + y, 0), 0),
  );

  const setCell = (sideIdx: number, rowIdx: number, colIdx: number, v: number) => {
    if (!onChange) return;
    const next = value.map((s) => s.map((r) => [...r]));
    next[sideIdx][rowIdx][colIdx] = Math.max(0, v);
    onChange(next);
  };

  const side = sides[activeSide];
  const sideRows = value[activeSide] ?? [];
  const cols = Array.from({ length: side?.columns ?? 1 }, (_, i) => i);

  const goPrev = () => onActiveSideChange(activeSide === 0 ? sides.length - 1 : activeSide - 1);
  const goNext = () => onActiveSideChange(activeSide === sides.length - 1 ? 0 : activeSide + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {sides.length > 1 && (
          <button onClick={goPrev} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
        )}
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {sides.map((s, i) => (
            <button key={i} onClick={() => onActiveSideChange(i)}
              className={cn("flex-1 min-w-[120px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2",
                i === activeSide ? "bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/20" : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40")}>
              <Box className="h-3.5 w-3.5" /> {s.label}
              <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold", i === activeSide ? "bg-white/20" : "bg-muted/60")}>{sideTotals[i]}</span>
            </button>
          ))}
        </div>
        {sides.length > 1 && (
          <button onClick={goNext} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors"><ChevronRight className="h-4 w-4" /></button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSide} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">Row</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[160px]">Description</th>
                  {cols.map((ci) => (
                    <th key={ci} className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-28">Col {ci + 1}</th>
                  ))}
                  <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                {side?.rows.map((r, ri) => {
                  const rowCells = sideRows[ri] ?? [];
                  const total = rowCells.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={ri} className="border-b border-border/15 last:border-b-0 hover:bg-accent/10">
                      <td className="px-3 py-2.5 text-center text-[11px] font-bold text-muted-foreground tabular-nums">{ri + 1}</td>
                      <td className="px-3 py-2.5 text-sm font-medium">{r.description || <span className="text-muted-foreground/40">—</span>}</td>
                      {cols.map((ci) => {
                        const v = rowCells[ci] ?? 0;
                        return (
                          <td key={ci} className="px-2 py-2.5">
                            {readOnly ? (
                              <p className="text-center text-sm tabular-nums">{v}</p>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setCell(activeSide, ri, ci, v - 1)} disabled={v <= 0} className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-card hover:bg-accent/60 disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                                <input type="number" min={0} value={v} onChange={(e) => setCell(activeSide, ri, ci, parseInt(e.target.value, 10) || 0)} className="h-7 w-12 rounded-md border border-border/40 bg-muted/30 text-center text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
                                <button onClick={() => setCell(activeSide, ri, ci, v + 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-card hover:bg-accent/60"><Plus className="h-3 w-3" /></button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2.5 text-center text-sm font-bold tabular-nums text-primary">{total}</td>
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
