import type { Order } from "@/lib/store/orders-store";

const esc = (v: string) =>
  String(v ?? "").replace(/[&<>]/g, (m) => (m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"));

function dateShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * The single source of truth for how a packing slip looks — used both on
 * screen (iframe) and in the printed PDF. Screen shows a responsive sheet;
 * print renders a real A4 page with margins.
 */
export function buildPackingSlipHtml(order: Order, includePod: boolean = true): string {
  const c = order.client || {};
  const rows = order.lineItems
    .map((l) => {
      const desc = esc(l.description || "—");
      const code = esc(l.code || "");
      return `<tr><td><div class="desc">${desc}${code ? ` ${code}` : ""}</div>${code ? `<div class="code">${code}</div>` : ""}</td><td class="q">&times; ${l.qtyOrdered}</td></tr>`;
    })
    .join("");
  const billAddr = esc(c.invoiceAddress || "");
  const shipAddr = esc(c.deliveryAddress || c.invoiceAddress || "");
  // Proof of Delivery box is optional.
  const podHtml = includePod
    ? `<div class="pod">
  <div class="t">Proof of Delivery</div>
  <div class="row"><span class="lbl">Date of Delivery:</span></div>
  <div class="row"><span class="lbl">Print:</span></div>
  <div class="row"><span class="lbl">Signature:</span></div>
  <div class="row"><span class="lbl">Order From:</span> Wildtouch</div>
</div>`
    : "";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Packing Slip ${esc(order.orderNumber)}</title>
<style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI",Arial,sans-serif;font-size:12px;color:#1f2937;line-height:1.45;background:#f1f5f9}
.sheet{width:210mm;min-height:297mm;margin:0 auto;padding:20mm;background:#fff}
@media screen{.sheet{width:100%;max-width:820px;min-height:0;padding:32px}}
@media print{body{background:#fff}.sheet{width:210mm;min-height:297mm;padding:20mm;margin:0}}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:26px}
.title{font-size:26px;font-weight:800;color:#1e293b;letter-spacing:-.5px}
.ord{margin-top:12px;font-weight:700}
.brand{text-align:right}
.brand .logo{font-family:"Segoe Script","Brush Script MT",cursive;font-size:32px;color:#3b2f6b;line-height:1}
.brand .tag{font-size:9px;color:#555;border-top:1px solid #999;border-bottom:1px solid #999;padding:2px 0;margin-top:3px}
.brand .sub{font-size:12px;font-weight:700;color:#1e293b;margin-top:5px;letter-spacing:.06em}
.addr{display:flex;justify-content:space-between;gap:48px;margin-bottom:6px}
.addr .col{flex:1}
.addr h4{font-size:12px;font-weight:700;margin-bottom:6px}
.addr .nm{font-weight:600}
.addr .lines{white-space:pre-line;color:#333}
hr{border:none;border-top:1px solid #94a3b8;margin:14px 0}
table{width:100%;border-collapse:collapse}
thead th{text-align:left;font-size:13px;font-weight:700;border-bottom:1px solid #cbd5e1;padding:8px 2px}
thead th.q{text-align:right}
tbody td{padding:12px 2px;border-bottom:1px solid #eee;vertical-align:top}
tbody td.q{text-align:right;white-space:nowrap;font-weight:600}
.desc{font-weight:700}
.code{color:#555;font-size:11px;margin-top:2px}
.thanks{text-align:center;margin-top:32px;font-weight:700;font-size:13px}
.thanks .small{font-weight:400;font-size:11px;color:#555;margin-top:2px}
.reg{text-align:center;margin-top:22px;font-size:11px;color:#374151}
.reg .h{font-weight:700;margin-bottom:3px}
.pod{margin:40px auto 0;border:1px solid #333;padding:10px 14px;width:320px}
.pod .t{font-weight:700;text-decoration:underline;margin-bottom:10px}
.pod .row{margin:9px 0;min-height:20px;border-bottom:1px dotted #bbb;padding-bottom:2px}
.pod .lbl{display:inline-block;width:100px;color:#333}
</style></head><body>
<div class="sheet">
<div class="top">
  <div>
    <div class="title">Packing Slip</div>
    <div class="ord">Order #${esc(order.orderNumber)}</div>
    <div>Order Date ${dateShort(order.createdAt)}</div>
  </div>
  <div class="brand">
    <div class="logo">Wildtouch</div>
    <div class="tag">Specialising in Souvenirs for Attractions</div>
    <div class="sub">STERLING-K LTD</div>
  </div>
</div>
<div class="addr">
  <div class="col"><h4>Bill to</h4><div class="nm">${esc(c.name || "—")}</div><div class="lines">${billAddr}</div></div>
  <div class="col"><h4>Ship to</h4><div class="nm">${esc(c.name || "—")}</div><div class="lines">${shipAddr}</div></div>
</div>
<hr/>
<table>
  <thead><tr><th>Item Description</th><th class="q">Qty</th></tr></thead>
  <tbody>${rows || `<tr><td>No items</td><td class="q">0</td></tr>`}</tbody>
</table>
<div class="thanks">Thanks for your business!<div class="small">If you have any questions, please do get in contact.</div></div>
<div class="reg">
  <div class="h">Registered Company Info:</div>
  <div>VAT# GB909275015 | Registered / Company # 06259731</div>
  <div>Contact Details: Sterling-K Ltd c/o Sterling-K House, 12 Well Street, Birmingham, B19 3BH | T: 0121 551 2699</div>
  <div>Email: sales@wildtouch.co.uk | Website: www.wildtouch.co.uk</div>
</div>
${podHtml}
</div>
</body></html>`;
}
