"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Minus,
  Plus,
  ImageOff,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SegmentDef } from "@/lib/data/segment-planograms";

/**
 * Shared editable segment-grid planogram renderer (All Designs Keyrings / Magnets):
 * segments × rows × N product columns, thumbnails + per-cell steppers.
 * Controlled: value[segIdx][rowIdx][colIdx] + onChange.
 * Optional `matchFor` shows an inventory indicator per product (used in the order flow).
 */
export function SegmentPlanogramGrid({
  segments,
  columns,
  value,
  onChange,
  activeSeg,
  onActiveSegChange,
  matchFor,
}: {
  segments: SegmentDef[];
  columns: number;
  value: number[][][];
  onChange: (next: number[][][]) => void;
  activeSeg: number;
  onActiveSegChange: (idx: number) => void;
  matchFor?: (name: string) => { qtyAvailable: number } | null;
}) {
  const segTotals = segments.map((_, si) =>
    (value[si] ?? []).reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0),
  );

  const setVal = (segIdx: number, rowIdx: number, colIdx: number, v: number) => {
    const next = value.map((s) => s.map((r) => [...r]));
    next[segIdx][rowIdx][colIdx] = Math.max(0, v);
    onChange(next);
  };

  const seg = segments[activeSeg];
  const segSlots = value[activeSeg] ?? [];
  const cols = Array.from({ length: columns }, (_, i) => i);
  const colTotals = cols.map((ci) => segSlots.reduce((s, row) => s + (row[ci] ?? 0), 0));

  const goPrev = () => onActiveSegChange(activeSeg === 0 ? segments.length - 1 : activeSeg - 1);
  const goNext = () => onActiveSegChange(activeSeg === segments.length - 1 ? 0 : activeSeg + 1);

  return (
    <div className="space-y-6">
      {/* Segment tabs */}
      <div className="flex items-center gap-2">
        <button onClick={goPrev} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 gap-1.5 overflow-x-auto">
          {segments.map((s, i) => {
            const isActive = i === activeSeg;
            return (
              <button key={s.id} onClick={() => onActiveSegChange(i)}
                className={cn("relative flex-1 min-w-[110px] rounded-xl px-2 py-2.5 text-xs font-semibold transition-all overflow-hidden whitespace-nowrap",
                  isActive ? "text-white shadow-lg" : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40")}>
                {isActive && (
                  <motion.div layoutId="seg-grid-bg" className={`absolute inset-0 rounded-xl bg-gradient-to-r ${s.color}`} transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                )}
                <span className="relative z-10 flex flex-col items-center gap-0.5">
                  <span className="truncate max-w-full">{s.shortTitle}</span>
                  <span className={cn("text-[10px] rounded-full px-1.5 py-0 font-bold leading-5", isActive ? "bg-white/20" : "bg-muted/60")}>{segTotals[i]}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button onClick={goNext} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Active segment card */}
      <AnimatePresence mode="wait">
        <motion.div key={seg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
          className={cn("rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden", seg.bgTint)}>
          <div className={`bg-gradient-to-r ${seg.color} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><RotateCcw className="h-5 w-5 text-white" /></div>
              <div>
                <h2 className="text-lg font-bold text-white">{seg.title}</h2>
                <p className="text-xs text-white/70">{seg.rows.length} rows · {columns} product columns</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-white tabular-nums">{segTotals[activeSeg]}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">segment total</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground w-8">Row</th>
                  {cols.map((ci) => (
                    <th key={ci} className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground">Column {ci + 1}</th>
                  ))}
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-muted-foreground w-16">Total</th>
                </tr>
              </thead>
              <tbody>
                {seg.rows.map((row, ri) => {
                  const rowTotal = (segSlots[ri] ?? []).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={ri} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                      <td className="px-3 py-2 text-center"><span className="text-[11px] font-bold text-muted-foreground">{ri + 1}</span></td>
                      {cols.map((ci) => {
                        const product = row[ci];
                        const v = segSlots[ri]?.[ci] ?? 0;
                        if (!product) return <td key={ci} className="px-2 py-1.5"><div className="h-10 rounded-lg border border-dashed border-border/20" /></td>;
                        const match = matchFor ? matchFor(product.name) : null;
                        return (
                          <td key={ci} className="px-2 py-1.5">
                            <div className="flex items-center gap-2">
                              <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted/40 flex items-center justify-center border border-border/20">
                                {product.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={product.image} alt={product.name} className="h-full w-full object-contain p-0.5"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                ) : (
                                  <ImageOff className="h-3.5 w-3.5 text-muted-foreground/40" />
                                )}
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <p className="text-[11px] font-medium leading-tight truncate max-w-[130px]">{product.name}</p>
                                {matchFor && (
                                  match ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-2.5 w-2.5" />{match.qtyAvailable}</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400"><AlertTriangle className="h-2.5 w-2.5" />n/a</span>
                                  )
                                )}
                                <div className="flex items-center gap-0.5">
                                  <button onClick={() => setVal(activeSeg, ri, ci, v - 1)} disabled={v <= 0}
                                    className="h-5 w-5 flex items-center justify-center rounded-md border border-border/40 hover:bg-accent/60 disabled:opacity-30 transition-colors"><Minus className="h-2.5 w-2.5" /></button>
                                  <input type="number" min={0} value={v}
                                    onChange={(e) => setVal(activeSeg, ri, ci, parseInt(e.target.value, 10) || 0)}
                                    className={cn("w-8 text-center text-[11px] font-bold tabular-nums bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:hidden",
                                      v > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40")} />
                                  <button onClick={() => setVal(activeSeg, ri, ci, v + 1)}
                                    className="h-5 w-5 flex items-center justify-center rounded-md border border-border/40 hover:bg-accent/60 transition-colors"><Plus className="h-2.5 w-2.5" /></button>
                                </div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center"><span className={cn("text-sm font-bold tabular-nums", rowTotal > 0 ? "text-primary" : "text-muted-foreground/30")}>{rowTotal || "—"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/40 bg-muted/20">
                  <td className="px-3 py-3" />
                  {colTotals.map((t, ci) => (
                    <td key={ci} className="px-2 py-3 text-center">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Col {ci + 1}</div>
                      <span className="text-sm font-bold tabular-nums">{t}</span>
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-0.5">Total</div>
                    <span className="text-sm font-black tabular-nums text-primary">{segTotals[activeSeg]}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {segments.map((s, i) => (
          <button key={s.id} onClick={() => onActiveSegChange(i)}
            className={cn("rounded-2xl border p-3 text-left transition-all", i === activeSeg ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10" : "border-border/30 bg-card/60 hover:bg-accent/30")}>
            <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${s.color} mb-2`} />
            <p className="text-[10px] text-muted-foreground font-medium leading-snug mb-1 truncate">{s.shortTitle}</p>
            <p className="text-base font-bold tabular-nums">{segTotals[i]}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
