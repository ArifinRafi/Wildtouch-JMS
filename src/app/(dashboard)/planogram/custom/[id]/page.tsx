"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Box,
  Printer,
  Loader2,
  Trash2,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CustomPlanogram } from "@/lib/hooks/use-planograms";

export default function CustomPlanogramPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [pg, setPg] = useState<CustomPlanogram | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch(`/api/planograms/${id}`);
        if (!res.ok) {
          if (on) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (on) setPg(data);
      } catch {
        if (on) setNotFound(true);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id]);

  const rowTotal = (cells: number[]) => cells.reduce((a, b) => a + b, 0);
  const sideTotals = pg ? pg.sides.map((s) => s.rows.reduce((a, r) => a + rowTotal(r.cells), 0)) : [];

  const doDelete = useCallback(async () => {
    await fetch(`/api/planograms/${id}`, { method: "DELETE" });
    router.push("/planogram");
  }, [id, router]);

  const printAll = () => {
    if (!pg) return;
    const sidesHtml = pg.sides
      .map((s) => {
        const total = s.rows.reduce((a, r) => a + rowTotal(r.cells), 0);
        const colHead = Array.from({ length: s.columns }, (_, i) => `<th class="sl">Col ${i + 1}</th>`).join("");
        const rows = s.rows
          .map((r, i) => `<tr><td class="rn">${i + 1}</td><td>${r.description || "—"}</td>${r.cells.map((c) => `<td class="sl">${c}</td>`).join("")}<td class="sl">${rowTotal(r.cells)}</td></tr>`)
          .join("");
        return `<h3>${s.label} — ${total} units</h3><table><thead><tr><th>Row</th><th>Description</th>${colHead}<th class="sl">Total</th></tr></thead><tbody>${rows}</tbody></table>`;
      })
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Planogram — ${pg.name}</title>
<style>@page{size:A4;margin:18mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#111}header{border-bottom:2px solid #6d28d9;padding-bottom:8px;margin-bottom:16px}.brand{font-size:18px;font-weight:800;color:#6d28d9}.sub{font-size:12px;color:#555;margin-top:2px}h3{margin:16px 0 6px;color:#6d28d9;font-size:13px}table{width:100%;border-collapse:collapse;margin-bottom:8px}th{background:#6d28d9;color:#fff;padding:6px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;text-align:left}td{padding:6px 10px;border-bottom:1px solid #e5e7eb}.rn{width:40px;text-align:center;font-weight:700;color:#6d28d9}.sl{text-align:right;font-weight:700;width:70px}</style></head><body>
<header><div class="brand">Wildtouch JMS — Planogram</div><div class="sub">${pg.name} · ${pg.sides.length} sides · ${pg.totalUnits} total units</div></header>
${sidesHtml}</body></html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Loading planogram…</span>
      </div>
    );
  }

  if (notFound || !pg) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold">Planogram not found</p>
        <Link href="/planogram" className="text-sm text-primary mt-2">Back to Planograms</Link>
      </div>
    );
  }

  const side = pg.sides[active];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/planogram" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Planograms
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              {pg.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pg.sides.length} sides · <span className="font-semibold text-primary">{pg.totalUnits} total units</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/orders/new">
              <Button variant="outline" className="gap-2 rounded-xl border-border/40">
                <ShoppingCart className="h-3.5 w-3.5 text-primary" /> Order
              </Button>
            </Link>
            <button onClick={printAll}
              className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm">
              <Printer className="h-3.5 w-3.5 text-primary" /> Print / PDF
            </button>
            <button onClick={() => setConfirmDelete(true)} title="Delete planogram"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Side tabs */}
      <div className="flex flex-wrap gap-2">
        {pg.sides.map((s, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={cn(
              "relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2",
              i === active
                ? "bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/20"
                : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40",
            )}>
            <Box className="h-3.5 w-3.5" /> {s.label}
            <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold", i === active ? "bg-white/20" : "bg-muted/60")}>
              {sideTotals[i]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }} className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30">
                  <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-14">Row</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                  {Array.from({ length: side.columns }, (_, ci) => (
                    <th key={ci} className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24">Col {ci + 1}</th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {side.rows.map((r, ri) => (
                  <tr key={ri} className="border-b border-border/15 last:border-b-0 hover:bg-accent/10">
                    <td className="px-4 py-3 text-center text-[11px] font-bold text-muted-foreground tabular-nums">{ri + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{r.description || <span className="text-muted-foreground/40">—</span>}</td>
                    {r.cells.map((c, ci) => (
                      <td key={ci} className="px-3 py-3 text-center text-sm tabular-nums">{c}</td>
                    ))}
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-primary">{rowTotal(r.cells)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border/20 bg-muted/10 text-right">
            <p className="text-xs text-muted-foreground">Side total: <span className="font-semibold text-foreground">{sideTotals[active]}</span></p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Planogram?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">&ldquo;{pg.name}&rdquo; will be permanently removed.</p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={doDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
