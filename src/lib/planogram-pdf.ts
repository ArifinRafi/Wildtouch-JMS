// Per-side planogram PDF: one A4 page per planogram side, then a totals page.
// Works for custom planograms (from the API) and the built-in slot / segment
// stands (from the local data registries). Used by the invoice and order pages.

import { getSlotPlanogram, type SlotPlanogram } from "./data/slot-planograms";
import { SEGMENT_PLANOGRAMS, type SegmentPlanogram } from "./data/segment-planograms";

export interface PdfCell { product: string; image: string; qty: number }
export interface PdfRow { description: string; cells: PdfCell[] }
export interface PdfSide { label: string; sub?: string; charms?: string; columns: number; rows: PdfRow[] }
export interface PdfPlanogram { name: string; sides: PdfSide[] }

export interface PdfMeta {
  orderNumber?: string;
  invoiceNumber?: string;
  dateStr?: string;
  clientName?: string;
  billTo?: string;
  shipTo?: string;
}

// ── Shape adapters ───────────────────────────────────────────────────────────

interface ApiPlanogram {
  name?: string;
  sides?: { label?: string; columns?: number; charms?: string;
    rows?: { description?: string; cells?: { product?: string; image?: string; qty?: number }[] }[] }[];
}

/** Custom planogram (API shape) → PDF shape. */
export function fromCustomPlanogram(pg: ApiPlanogram): PdfPlanogram {
  return {
    name: pg.name ?? "Planogram",
    sides: (pg.sides ?? []).map((s, i) => ({
      label: s.label || `Side ${i + 1}`,
      charms: s.charms || "",
      columns: Math.max(1, s.columns ?? 1),
      rows: (s.rows ?? []).map((r) => ({
        description: r.description ?? "",
        cells: (r.cells ?? []).map((c) => ({ product: c.product ?? "", image: c.image ?? "", qty: c.qty ?? 0 })),
      })),
    })),
  };
}

/** Built-in 4-sided slot stand → PDF shape (each slot is a column of the row's product). */
export function fromSlotPlanogram(pg: SlotPlanogram): PdfPlanogram {
  return {
    name: pg.name,
    sides: pg.sides.map((s) => ({
      label: s.label,
      sub: s.productType,
      charms: [s.charms, s.boysCharms ? `Boys: ${s.boysCharms}` : ""].filter(Boolean).join("  ·  "),
      columns: pg.slotCount,
      rows: s.rows.map((r) => ({
        description: r.description,
        cells: Array.from({ length: pg.slotCount }, () => ({ product: r.description, image: "", qty: r.defaultQty })),
      })),
    })),
  };
}

/** Built-in segment planogram (keyrings / magnets) → PDF shape (segments as sides, qty 1 per cell). */
export function fromSegmentPlanogram(pg: SegmentPlanogram): PdfPlanogram {
  return {
    name: pg.name,
    sides: pg.segments.map((seg) => ({
      label: seg.title,
      columns: pg.columns,
      rows: seg.rows.map((row, ri) => ({
        description: `Row ${ri + 1}`,
        cells: row.map((c) => ({ product: c?.name ?? "", image: c?.image ?? "", qty: c ? 1 : 0 })),
      })),
    })),
  };
}

/** Resolve any order's planogram id (custom ObjectId, slot slug or segment slug) into the PDF shape. */
export async function resolvePlanogramForPdf(id: string | undefined | null): Promise<PdfPlanogram | null> {
  const pgId = String(id ?? "").trim();
  if (!pgId) return null;
  if (/^[0-9a-fA-F]{24}$/.test(pgId)) {
    try {
      const res = await fetch(`/api/planograms/${pgId}`);
      if (res.ok) return fromCustomPlanogram(await res.json());
    } catch { /* fall through */ }
    return null;
  }
  const slot = getSlotPlanogram(pgId);
  if (slot) return fromSlotPlanogram(slot);
  const seg = SEGMENT_PLANOGRAMS.find((p) => p.id === pgId);
  if (seg) return fromSegmentPlanogram(seg);
  return null;
}

// ── HTML builder ─────────────────────────────────────────────────────────────

const esc = (v: string) =>
  String(v ?? "").replace(/[&<>]/g, (m) => (m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"));

const sideUnits = (s: PdfSide) => s.rows.reduce((a, r) => a + r.cells.reduce((x, c) => x + c.qty, 0), 0);

/**
 * One page per side, then a totals page (units per side, product totals, grand
 * total). `imageOf(productName)` resolves a product's catalogue image; cell
 * images (custom planograms) take precedence. Self-prints once images load.
 */
export function buildPlanogramSidesHtml(meta: PdfMeta, pg: PdfPlanogram, imageOf: (product: string) => string): string {
  // Only sides that actually hold something get a page — a planogram saved with
  // 4 sides but only 1 filled prints 1 side page (+ totals), not 3 blanks.
  const hasContent = (s: PdfSide) => s.rows.some((r) => r.description || r.cells.some((c) => c.product || c.qty > 0));
  const allSides = pg.sides.filter(hasContent);
  const sides = allSides.length ? allSides : pg.sides.slice(0, 1); // never an empty document
  pg = { ...pg, sides };

  const brand = `
  <div class="brand">
    <div class="logo">Wildtouch</div>
    <div class="tag">Specialising in Souvenirs for Attractions</div>
    <div class="sub">STERLING-K LTD</div>
  </div>`;

  const metaBlock = `
  <div>
    <div class="title">Planogram</div>
    <div class="meta"><strong>${esc(pg.name)}</strong></div>
    ${meta.orderNumber ? `<div class="meta"><strong>Order No.</strong> ${esc(meta.orderNumber)}</div>` : ""}
    ${meta.invoiceNumber ? `<div class="meta"><strong>Invoice No.</strong> #${esc(meta.invoiceNumber)}</div>` : ""}
    ${meta.dateStr ? `<div class="meta"><strong>Order Date</strong> ${esc(meta.dateStr)}</div>` : ""}
    ${meta.clientName ? `<div class="meta"><strong>Client</strong> ${esc(meta.clientName)}</div>` : ""}
  </div>`;

  // The print popup is about:blank — make site-relative image paths absolute.
  const absolutize = (url: string) =>
    url.startsWith("/") && typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  const cellHtml = (c: PdfCell) => {
    if (!c.product && !c.qty) return `<td class="cell empty">—</td>`;
    const img = absolutize(c.image || imageOf(c.product));
    return `<td class="cell">
      ${img ? `<img class="pimg" src="${esc(img)}" alt=""/>` : ""}
      ${c.product ? `<div class="pn">${esc(c.product)}</div>` : ""}
      <div class="q">×${c.qty}</div>
    </td>`;
  };

  const sidePages = pg.sides.map((s, i) => {
    const colHead = Array.from({ length: s.columns }, (_, ci) => `<th class="c">Col ${ci + 1}</th>`).join("");
    const rows = s.rows
      .filter((r) => r.description || r.cells.some((c) => c.product || c.qty > 0))
      .map((r, ri) => {
        const rowTotal = r.cells.reduce((a, c) => a + c.qty, 0);
        return `<tr><td class="rn">${ri + 1}</td><td class="desc">${esc(r.description) || "—"}</td>${r.cells.map(cellHtml).join("")}<td class="rt">${rowTotal}</td></tr>`;
      })
      .join("");
    return `<div class="sheet">
  <div class="top">${i === 0 ? metaBlock : `<div><div class="title small">Planogram</div><div class="meta"><strong>${esc(pg.name)}</strong></div></div>`}${brand}</div>
  <div class="sidehead"><span class="nm">${esc(s.label)}${s.sub ? ` — ${esc(s.sub)}` : ""}</span><span class="units">${sideUnits(s)} units</span></div>
  <table class="grid">
    <thead><tr><th class="rn">Row</th><th>Description</th>${colHead}<th class="rt">Total</th></tr></thead>
    <tbody>${rows || `<tr><td class="rn">—</td><td>No products</td><td class="rt">0</td></tr>`}</tbody>
  </table>
  ${s.charms ? `<p class="charms"><strong>Charms:</strong> ${esc(s.charms)}</p>` : ""}
  <div class="pagefoot">${esc(pg.name)} · ${esc(s.label)} · Page ${i + 1} of ${pg.sides.length + 1}</div>
</div>`;
  }).join("");

  // Totals page
  const grand = pg.sides.reduce((a, s) => a + sideUnits(s), 0);
  const productTotals = new Map<string, number>();
  for (const s of pg.sides) for (const r of s.rows) for (const c of r.cells) {
    if (!c.product || c.qty <= 0) continue;
    productTotals.set(c.product, (productTotals.get(c.product) ?? 0) + c.qty);
  }
  const sideRows = pg.sides.map((s) => `<tr><td>${esc(s.label)}${s.sub ? ` — ${esc(s.sub)}` : ""}</td><td class="rt">${sideUnits(s)}</td></tr>`).join("");
  const prodRows = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([p, q]) => `<tr><td>${esc(p)}</td><td class="rt">${q}</td></tr>`).join("");

  const totalsPage = `<div class="sheet">
  <div class="top"><div><div class="title">Totals</div><div class="meta"><strong>${esc(pg.name)}</strong>${meta.orderNumber ? ` · Order ${esc(meta.orderNumber)}` : ""}</div></div>${brand}</div>
  <div class="sidehead"><span class="nm">Units per side</span><span class="units">${pg.sides.length} side${pg.sides.length === 1 ? "" : "s"}</span></div>
  <table class="grid tot"><thead><tr><th>Side</th><th class="rt">Units</th></tr></thead><tbody>${sideRows}</tbody>
    <tfoot><tr><td><strong>Total units</strong></td><td class="rt"><strong>${grand}</strong></td></tr></tfoot></table>
  <div class="sidehead" style="margin-top:22px"><span class="nm">Product totals</span><span class="units">${productTotals.size} product${productTotals.size === 1 ? "" : "s"}</span></div>
  <table class="grid tot"><thead><tr><th>Product</th><th class="rt">Total Qty</th></tr></thead><tbody>${prodRows || `<tr><td>No products</td><td class="rt">0</td></tr>`}</tbody></table>
  <div class="pagefoot">${esc(pg.name)} · Totals · Page ${pg.sides.length + 1} of ${pg.sides.length + 1}</div>
</div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Planogram ${esc(pg.name)}</title>
<style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI",Arial,sans-serif;font-size:12px;color:#1f2937;line-height:1.45;background:#f1f5f9}
.sheet{width:210mm;min-height:297mm;margin:0 auto 12px;padding:16mm;background:#fff;page-break-after:always;position:relative}
.sheet:last-child{page-break-after:auto}
@media screen{.sheet{width:100%;max-width:820px;min-height:0;padding:32px}}
@media print{body{background:#fff}.sheet{width:210mm;min-height:297mm;padding:16mm;margin:0}}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.title{font-size:26px;font-weight:800;color:#1e293b;margin-bottom:6px}
.title.small{font-size:18px}
.meta{font-size:12px}
.brand{text-align:right}
.brand .logo{font-family:"Segoe Script","Brush Script MT",cursive;font-size:30px;color:#3b2f6b;line-height:1}
.brand .tag{font-size:8.5px;color:#555;border-top:1px solid #999;border-bottom:1px solid #999;padding:2px 0;margin-top:3px}
.brand .sub{font-size:11px;font-weight:700;color:#1e293b;margin-top:4px;letter-spacing:.06em}
.sidehead{display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:9px 13px;margin-bottom:8px}
.sidehead .nm{font-size:14px;font-weight:800;color:#3b2f6b}
.sidehead .units{font-size:12px;font-weight:700;color:#3b2f6b}
table.grid{width:100%;border-collapse:collapse}
table.grid th{background:#3b2f6b;color:#fff;padding:6px 8px;font-size:9px;text-transform:uppercase;letter-spacing:.05em;text-align:left}
table.grid th.c,table.grid th.rt{text-align:center}
table.grid td{padding:6px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
td.rn{width:30px;text-align:center;font-weight:700;color:#3b2f6b}
td.desc{font-weight:600;min-width:110px}
td.cell{text-align:center;width:86px}
td.cell.empty{color:#cbd5e1}
td.cell .pimg{width:34px;height:34px;object-fit:cover;border-radius:5px;border:1px solid #e2e8f0;display:block;margin:0 auto 2px}
td.cell .pn{font-size:8.5px;color:#374151;line-height:1.15;max-width:82px;margin:0 auto}
td.cell .q{font-weight:800;color:#3b2f6b;font-size:11px}
td.rt{text-align:center;font-weight:800;color:#3b2f6b;width:52px}
table.tot td{font-size:12px}
table.tot tfoot td{border-top:2px solid #3b2f6b;border-bottom:none;font-size:13px}
.charms{margin-top:10px;font-size:11px;color:#374151}
.charms strong{color:#3b2f6b}
.pagefoot{position:absolute;bottom:7mm;left:16mm;right:16mm;text-align:center;font-size:9px;color:#94a3b8}
@media screen{.pagefoot{position:static;margin-top:18px}}
</style></head><body>
${sidePages}
${totalsPage}
<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});</script>
</body></html>`;
}
