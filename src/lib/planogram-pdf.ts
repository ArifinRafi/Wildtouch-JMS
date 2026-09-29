// Per-side planogram PDF: one A4 page per planogram side, then a totals page.
// Works for custom planograms (from the API) and the built-in slot / segment
// stands (from the local data registries). Used by the invoice and order pages.

import { getSlotPlanogram, type SlotPlanogram } from "./data/slot-planograms";
import { SEGMENT_PLANOGRAMS, type SegmentPlanogram } from "./data/segment-planograms";

export interface PdfCell { product: string; image: string; qty: number }
export interface PdfRow { description: string; cells: PdfCell[] }
export interface PdfSide { label: string; sub?: string; charms?: string; columns: number; rows: PdfRow[] }
export interface PdfPlanogram { name: string; sides: PdfSide[] }
export interface PlanogramQuantities { slots?: number[][][]; segQty?: number[][][]; rowQty?: number[][][] }
export interface PdfOrderGroup { name: string; quantity: number }

/** Apply the quantities entered for this particular order/quote to the planogram template. */
export function applyPlanogramQuantities(planogram: PdfPlanogram, grid?: PlanogramQuantities | null): PdfPlanogram {
  const quantities = grid?.slots ?? grid?.segQty ?? grid?.rowQty;
  if (!quantities) return planogram;
  return {
    ...planogram,
    sides: planogram.sides.map((side, sideIndex) => ({
      ...side,
      rows: side.rows.map((row, rowIndex) => ({
        ...row,
        cells: row.cells.map((cell, cellIndex) => ({
          ...cell,
          qty: Math.max(0, Number(quantities[sideIndex]?.[rowIndex]?.[cellIndex]) || 0),
        })),
      })),
    })),
  };
}

export interface PdfMeta {
  orderNumber?: string;
  invoiceNumber?: string;
  dateStr?: string;
  clientName?: string;
  contactName?: string;
  companyName?: string;
  address?: string;
  telephone?: string;
  email?: string;
  poNumber?: string;
  referenceNumber?: string;
  additionalInformation?: string;
  brandCardImage?: string;
  barcodeImage?: string;
  orderGroups?: PdfOrderGroup[];
}

/** Collapse product-level order lines into the category groups shown on the PDF. */
export function groupOrderLinesForPdf(lines: Array<{
  category?: string;
  description?: string;
  qtyOrdered?: number;
  qty?: number;
}>): PdfOrderGroup[] {
  const grouped = new Map<string, number>();
  for (const line of lines) {
    const name = String(line.category || line.description || "Other").trim() || "Other";
    const quantity = Math.max(0, Number(line.qtyOrdered ?? line.qty) || 0);
    grouped.set(name, (grouped.get(name) ?? 0) + quantity);
  }
  return [...grouped.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
export function buildPlanogramSidesHtml(
  meta: PdfMeta,
  pg: PdfPlanogram,
  imageOf: (product: string) => string,
  options: { autoPrint?: boolean } = {},
): string {
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

  // The print popup is about:blank — make site-relative image paths absolute.
  const absolutize = (url: string) =>
    url.startsWith("/") && typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
  const attr = (v: string) => esc(v).replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const orderQuantity = (meta.orderGroups ?? []).reduce((sum, group) => sum + group.quantity, 0)
    || pg.sides.reduce((sum, side) => sum + sideUnits(side), 0);
  const detailLine = (label: string, value?: string) =>
    `<div class="detail-line"><strong>${esc(label)}:</strong> ${esc(value || "—")}</div>`;
  const assetLine = (label: string, source?: string) => {
    const src = source ? absolutize(source) : "";
    return `<div class="asset-line"><strong>${esc(label)}:</strong> ${src ? "Yes" : "No"}${src
      ? `<img src="${attr(src)}" alt="${attr(label)}"/>`
      : ""}</div>`;
  };
  const worksheetHeader = `<div class="worksheet-head">
    <div class="customer-block">
      <div class="customer-name">${esc(meta.clientName || "Client")}</div>
      ${detailLine("Contact", meta.contactName)}
      ${detailLine("Company", meta.companyName || meta.clientName)}
      <div class="customer-address">${esc(meta.address || "—")}</div>
      ${detailLine("Tel", meta.telephone)}
      ${detailLine("Email", meta.email)}
    </div>
    <div class="order-block">
      ${detailLine("Date", meta.dateStr)}
      ${detailLine("Order Number", meta.orderNumber)}
      ${meta.invoiceNumber ? detailLine("Invoice Number", meta.invoiceNumber) : ""}
      ${detailLine("Number of Pieces", String(orderQuantity))}
      ${assetLine("Branding Card", meta.brandCardImage)}
      ${assetLine("Barcode", meta.barcodeImage)}
      ${detailLine("PO Number", meta.poNumber)}
      ${detailLine("Reference Number", meta.referenceNumber)}
    </div>
  </div>
  <div class="additional"><strong>Additional Information:</strong> ${esc(meta.additionalInformation || "")}</div>`;

  const groupNameForColumn = (side: PdfSide, column: number) => {
    const product = side.rows.map((row) => row.cells[column]?.product || "").find(Boolean) || "";
    const matched = (meta.orderGroups ?? []).find((group) =>
      product.toLowerCase().includes(group.name.toLowerCase()),
    );
    if (matched) return matched.name;
    if (meta.orderGroups?.[column]?.name) return meta.orderGroups[column].name;
    const productLine = product.includes(":") ? product.split(":")[0].trim() : product;
    return productLine || `Group ${column + 1}`;
  };

  const sidePages = pg.sides.map((s, i) => {
    const columns = Array.from({ length: s.columns }, (_, ci) => {
      const example = s.rows.map((row) => row.cells[ci]).find((cell) => cell?.product || cell?.image);
      const image = example ? absolutize(example.image || imageOf(example.product)) : "";
      return {
        label: groupNameForColumn(s, ci),
        image,
      };
    });
    const colHead = columns.map((column) => `<th class="group-head"><span>${esc(column.label)}</span>${column.image
      ? `<img src="${attr(column.image)}" alt=""/>`
      : '<span class="photo-placeholder">&nbsp;</span>'}</th>`).join("");
    const columnTotals = Array.from({ length: s.columns }, (_, ci) =>
      s.rows.reduce((sum, row) => sum + (row.cells[ci]?.qty ?? 0), 0),
    );
    const rows = s.rows
      .filter((r) => r.description || r.cells.some((c) => c.product || c.qty > 0))
      .map((r, ri) => {
        const rowTotal = r.cells.reduce((a, c) => a + c.qty, 0);
        const example = r.cells.find((cell) => cell.product || cell.image);
        const picture = example ? absolutize(example.image || imageOf(example.product)) : "";
        const description = r.description || (example?.product.includes(":") ? example.product.split(":").slice(1).join(":").trim() : example?.product) || "—";
        const quantityCells = Array.from({ length: s.columns }, (_, ci) =>
          `<td class="qty">${r.cells[ci]?.qty ?? 0}</td>`,
        ).join("");
        return `<tr><td class="rn">${ri + 1}</td><td class="pic">${picture ? `<img src="${attr(picture)}" alt=""/>` : "—"}</td><td class="desc">${esc(description)}</td>${quantityCells}<td class="rt">${rowTotal}</td></tr>`;
      })
      .join("");
    const sideName = /^side\s+\d+$/i.test(s.label.trim()) ? (s.sub || pg.name) : `${s.label}${s.sub ? ` — ${s.sub}` : ""}`;
    return `<div class="sheet">
  ${worksheetHeader}
  <div class="side-title">SIDE ${i + 1}: ${esc(sideName)}</div>
  <table class="grid worksheet">
    <thead><tr><th class="rn">Row</th><th class="pic">Picture</th><th class="description-head">Description</th>${colHead}<th class="rt">Total</th></tr></thead>
    <tbody>${rows || `<tr><td class="rn">—</td><td class="pic">—</td><td>No products</td><td class="rt">0</td></tr>`}</tbody>
    <tfoot><tr><td colspan="3" class="column-label">Column Totals</td>${columnTotals.map((total) => `<td class="qty">${total}</td>`).join("")}<td class="rt">${sideUnits(s)}</td></tr></tfoot>
  </table>
  <div class="charms"><strong>CHARMS TO USE:</strong> ${esc(s.charms || "—")}</div>
  <div class="sheet-brand"><span>P: 0121 551 2699</span><strong>Wildtouch</strong><span>www.wildtouch.co.uk</span></div>
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
  const groupRows = (meta.orderGroups ?? [])
    .map((group) => `<tr><td>${esc(group.name)}</td><td class="rt">${group.quantity}</td></tr>`)
    .join("");
  const groupTotal = (meta.orderGroups ?? []).reduce((sum, group) => sum + group.quantity, 0);

  const totalsPage = `<div class="sheet">
  <div class="top"><div><div class="title">Totals</div><div class="meta"><strong>${esc(pg.name)}</strong>${meta.orderNumber ? ` · Order ${esc(meta.orderNumber)}` : ""}</div></div>${brand}</div>
  <div class="sidehead"><span class="nm">Units per side</span><span class="units">${pg.sides.length} side${pg.sides.length === 1 ? "" : "s"}</span></div>
  <table class="grid tot"><thead><tr><th>Side</th><th class="rt">Units</th></tr></thead><tbody>${sideRows}</tbody>
    <tfoot><tr><td><strong>Total units</strong></td><td class="rt"><strong>${grand}</strong></td></tr></tfoot></table>
  <div class="sidehead" style="margin-top:22px"><span class="nm">Order groups</span><span class="units">${(meta.orderGroups ?? []).length} group${(meta.orderGroups ?? []).length === 1 ? "" : "s"}</span></div>
  <table class="grid tot"><thead><tr><th>Group</th><th class="rt">Order Qty</th></tr></thead><tbody>${groupRows || `<tr><td>No groups recorded</td><td class="rt">0</td></tr>`}</tbody>
    <tfoot><tr><td><strong>Total ordered</strong></td><td class="rt"><strong>${groupTotal}</strong></td></tr></tfoot></table>
  <div class="sidehead" style="margin-top:22px"><span class="nm">Product totals</span><span class="units">${productTotals.size} product${productTotals.size === 1 ? "" : "s"}</span></div>
  <table class="grid tot"><thead><tr><th>Product</th><th class="rt">Total Qty</th></tr></thead><tbody>${prodRows || `<tr><td>No products</td><td class="rt">0</td></tr>`}</tbody></table>
  <div class="pagefoot">${esc(pg.name)} · Totals · Page ${pg.sides.length + 1} of ${pg.sides.length + 1}</div>
</div>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Planogram ${esc(pg.name)}</title>
<style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,"Segoe UI",sans-serif;font-size:11px;color:#111;line-height:1.3;background:#3f3f3f}
.sheet{width:210mm;min-height:297mm;margin:0 auto 12px;padding:12mm 14mm;background:#fff200;page-break-after:always;position:relative}
.sheet:last-child{page-break-after:auto}
@media screen{.sheet{width:100%;max-width:794px;min-height:1123px;padding:42px 52px}}
@media print{body{background:#fff}.sheet{width:210mm;min-height:297mm;padding:12mm 14mm;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.worksheet-head{display:grid;grid-template-columns:1fr 1fr;gap:18px;border-bottom:1.5px solid #111;padding-bottom:7px}
.customer-block,.order-block{font-family:Georgia,"Times New Roman",serif;font-size:10px}.customer-name{font-size:14px;font-weight:800;margin-bottom:3px}.customer-address{white-space:pre-line;margin:2px 0}.detail-line{min-height:14px}.detail-line strong,.asset-line strong{display:inline-block;min-width:92px}.asset-line{display:flex;align-items:center;gap:4px;min-height:18px}.asset-line img{width:62px;height:22px;object-fit:contain;object-position:left center;border:1px solid rgba(0,0,0,.35);background:#fff}
.additional{min-height:22px;border-bottom:1.5px solid #111;padding:5px 0;font-family:Georgia,"Times New Roman",serif;font-size:10px}.additional strong{margin-right:6px}
.side-title{text-align:center;font-family:Georgia,"Times New Roman",serif;font-size:16px;font-weight:900;text-transform:uppercase;padding:5px 3px;border-bottom:1.5px solid #111}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;border-bottom:1.5px solid #111;padding-bottom:8px}
.title{font-family:Georgia,"Times New Roman",serif;font-size:24px;font-weight:800;color:#111;margin-bottom:5px}
.title.small{font-size:18px}
.meta{font-size:12px}
.brand{text-align:right}
.brand .logo{font-family:"Segoe Script","Brush Script MT",cursive;font-size:30px;color:#111;line-height:1}
.brand .tag{font-size:8.5px;border-top:1px solid #111;border-bottom:1px solid #111;padding:2px 0;margin-top:3px}
.brand .sub{font-size:11px;font-weight:700;margin-top:4px;letter-spacing:.06em}
.sidehead{display:flex;justify-content:space-between;align-items:center;border:1px solid #111;padding:7px 10px;margin-bottom:0}
.sidehead .nm{font-size:13px;font-weight:800}.sidehead .units{font-size:11px;font-weight:700}
table.grid{width:100%;border-collapse:collapse}
table.grid th,table.grid td{border:1px solid #111;padding:4px 5px;vertical-align:middle;background:transparent}
table.grid th{font-family:Georgia,"Times New Roman",serif;font-size:8px;font-weight:800;text-transform:uppercase;text-align:center}
table.worksheet{table-layout:fixed;border-top:0}.description-head{width:26%}.group-head{font-size:7px;word-break:break-word}.group-head span{display:block}.group-head img{display:block;width:28px;height:28px;object-fit:contain;margin:3px auto 0}.photo-placeholder{font-size:6px;font-weight:400;margin-top:4px}
td.rn,th.rn{width:28px;text-align:center;font-weight:800}td.pic,th.pic{width:50px;text-align:center}td.pic img{width:38px;height:38px;object-fit:contain;display:block;margin:auto}td.desc{font-family:Georgia,"Times New Roman",serif;font-size:9px;font-weight:600;text-align:center}td.qty{text-align:center;font-weight:700;font-size:10px}td.rt,th.rt{text-align:center;font-weight:900;width:42px}
table.worksheet tbody tr{height:46px}table.worksheet tfoot td{font-family:Georgia,"Times New Roman",serif;font-weight:900;border-top:2px solid #111}.column-label{text-align:right;text-transform:uppercase;font-size:8px}
table.tot td{font-size:12px}
table.tot tfoot td{border-top:2px solid #111;font-size:13px}
.charms{border:1px solid #111;border-top:0;padding:5px 7px;font-family:Georgia,"Times New Roman",serif;font-size:9px;text-align:center}.sheet-brand{display:flex;justify-content:space-between;align-items:center;border:1px solid #111;border-top:0;padding:4px 8px;font-family:Georgia,"Times New Roman",serif;font-size:9px}.sheet-brand strong{font-family:"Segoe Script","Brush Script MT",cursive;font-size:13px}
.pagefoot{position:absolute;bottom:6mm;left:14mm;right:14mm;text-align:center;font-size:8px;color:#222}
</style></head><body>
${sidePages}
${totalsPage}
${options.autoPrint === false ? "" : '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});</script>'}
</body></html>`;
}
