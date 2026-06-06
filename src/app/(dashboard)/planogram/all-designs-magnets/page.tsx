"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Printer } from "lucide-react";
import { SegmentPlanogramGrid } from "@/components/planogram/segment-planogram-grid";
import { getSegmentPlanogram, buildInitialSegQty } from "@/lib/data/segment-planograms";

export default function AllDesignsMagnetsPage() {
  const pg = getSegmentPlanogram("all-designs-magnets")!;
  const [qty, setQty] = useState(() => buildInitialSegQty(pg));
  const [active, setActive] = useState(0);

  const grandTotal = qty.reduce((s, seg) => s + seg.reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0), 0);

  const handlePrint = () => {
    const seg = pg.segments[active];
    const segSlots = qty[active] ?? [];
    const segTotal = segSlots.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
    const rowsHtml = seg.rows.map((row, ri) => {
      const cells = row.map((product, ci) => {
        const v = segSlots[ri]?.[ci] ?? 0;
        return `<td class="cell">${product ? product.name : "—"}</td><td class="qty">${v > 0 ? v : ""}</td>`;
      }).join("");
      const rowTot = (segSlots[ri] ?? []).reduce((a, b) => a + b, 0);
      return `<tr><td class="rn">${ri + 1}</td>${cells}<td class="tot">${rowTot > 0 ? rowTot : ""}</td></tr>`;
    }).join("");
    const colTotals = Array.from({ length: pg.columns }, (_, ci) => segSlots.reduce((s, row) => s + (row[ci] ?? 0), 0));
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${pg.name} — ${seg.title}</title>
<style>@page{size:A4 landscape;margin:15mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;font-size:10px;color:#111}header{border-bottom:2px solid #7c3aed;padding-bottom:6px;margin-bottom:12px}.brand{font-size:16px;font-weight:800;color:#7c3aed}.sub{font-size:11px;color:#555;margin-top:2px}table{width:100%;border-collapse:collapse}th{background:#7c3aed;color:#fff;padding:6px 8px;font-size:9px;text-transform:uppercase}td{padding:5px 8px;border-bottom:1px solid #e5e7eb}.rn{width:30px;text-align:center;font-weight:700;color:#7c3aed}.cell{font-weight:500;width:26%}.qty{text-align:center;font-weight:700;width:40px;color:#6d28d9}.tot{text-align:center;font-weight:700;color:#16a34a;width:50px}tfoot td{font-weight:800;border-top:2px solid #7c3aed;background:#f5f3ff}</style></head><body>
<header><div class="brand">Wildtouch JMS — ${pg.name}</div><div class="sub">${seg.title} | Total: ${segTotal} units</div></header>
<table><thead><tr><th>#</th>${Array.from({ length: pg.columns }, (_, i) => `<th colspan="2">Column ${i + 1}</th>`).join("")}<th>Row Total</th></tr></thead>
<tbody>${rowsHtml}</tbody>
<tfoot><tr><td></td>${colTotals.map((t) => `<td class="cell" style="font-weight:800">Column Total</td><td class="qty">${t}</td>`).join("")}<td class="tot">${segTotal}</td></tr></tfoot></table>
</body></html>`;
    const win = window.open("", "_blank", "width=1000,height=700");
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
              All Designs — Magnets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pg.segments.length} segments · {pg.segments[0].rows.length} rows each ·{" "}
              <span className="font-semibold text-primary">{grandTotal} total ordered</span>
            </p>
          </div>
          <button onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold transition-colors shadow-sm">
            <Printer className="h-3.5 w-3.5 text-primary" /> Print Segment
          </button>
        </div>
      </motion.div>

      <SegmentPlanogramGrid
        segments={pg.segments}
        columns={pg.columns}
        value={qty}
        onChange={setQty}
        activeSeg={active}
        onActiveSegChange={setActive}
      />
    </div>
  );
}
