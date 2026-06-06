"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Printer } from "lucide-react";
import { SlotPlanogramGrid } from "@/components/planogram/slot-planogram-grid";
import { NECKBRAC, buildInitialSlots } from "@/lib/data/slot-planograms";

export default function FourSidedNeckBracPage() {
  const pg = NECKBRAC;
  const [slots, setSlots] = useState(() => buildInitialSlots(pg));
  const [active, setActive] = useState(0);

  const grandTotal = slots.reduce(
    (s, side) => s + side.reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0),
    0,
  );

  const printSide = () => {
    const cfg = pg.sides[active];
    const sideSlots = slots[active] ?? [];
    const sideTotal = sideSlots.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
    const slotHeaders = cfg.slotLabels?.length === pg.slotCount
      ? cfg.slotLabels
      : Array.from({ length: pg.slotCount }, (_, i) => `Slot ${i + 1}`);
    const rowsHtml = cfg.rows.map((r, ri) => {
      const sl = sideSlots[ri] ?? [];
      const rowTotal = sl.reduce((a, b) => a + b, 0);
      return `<tr><td class="rn">${ri + 1}</td><td class="desc">${r.description}</td>${sl.map((v) => `<td class="sl">${v}</td>`).join("")}<td class="sl tot">${rowTotal}</td></tr>`;
    }).join("");
    const colTotals = Array.from({ length: pg.slotCount }, (_, ci) => sideSlots.reduce((s, row) => s + (row[ci] ?? 0), 0));
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Planogram — ${pg.name} · ${cfg.label}</title>
<style>@page{size:A4;margin:20mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#111}header{border-bottom:2px solid #6d28d9;padding-bottom:8px;margin-bottom:16px}.brand{font-size:18px;font-weight:800;color:#6d28d9}.sub{font-size:12px;color:#555;margin-top:2px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#6d28d9;color:#fff;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.06em}td{padding:8px 10px;border-bottom:1px solid #e5e7eb}.rn{width:40px;text-align:center;font-weight:700;color:#6d28d9}.desc{font-weight:500}.sl{text-align:center;font-weight:700;width:60px}.tot{background:#f5f3ff}tfoot td{font-weight:800;border-top:2px solid #6d28d9}.note{margin-top:12px;font-size:10px;color:#666}</style></head><body>
<header><div class="brand">Wildtouch JMS — ${pg.name}</div><div class="sub">${cfg.label} — ${cfg.productType} | Total: ${sideTotal}</div></header>
<table><thead><tr><th>Row</th><th>Description</th>${slotHeaders.map((h) => `<th>${h}</th>`).join("")}<th>Row Total</th></tr></thead><tbody>${rowsHtml}</tbody>
<tfoot><tr><td></td><td>Column Total</td>${colTotals.map((t) => `<td class="sl">${t}</td>`).join("")}<td class="sl tot">${sideTotal}</td></tr></tfoot></table>
${cfg.charms ? `<p class="note">Charms: ${cfg.charms}</p>` : ""}${cfg.boysCharms ? `<p class="note">Boys Charms: ${cfg.boysCharms}</p>` : ""}</body></html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  return (
    <div className="space-y-6 pb-12">
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
              {pg.sides.length} sides · {pg.sides[0].rows.length} rows per side ·{" "}
              <span className="font-semibold text-primary">{grandTotal} total units</span>
            </p>
          </div>
          <button onClick={printSide}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm">
            <Printer className="h-3.5 w-3.5 text-primary" /> Print Side
          </button>
        </div>
      </motion.div>

      <SlotPlanogramGrid
        sides={pg.sides}
        slotCount={pg.slotCount}
        value={slots}
        onChange={setSlots}
        activeSide={active}
        onActiveSideChange={setActive}
      />
    </div>
  );
}
