import { formatCurrency } from "@/lib/currency";
import { groupIntoCategoryLines, type PricedOrderLine } from "@/lib/invoicing";

export interface ProformaDocument {
  proformaNumber: string;
  client: {
    name?: string; companyName?: string; contactName?: string; email?: string;
    contactNumber?: string; invoiceAddress?: string; deliveryAddress?: string;
    brandCardImage?: string; barcodeImage?: string;
  };
  lineItems: PricedOrderLine[];
  subtotal: number;
  shipping: number;
  vatRate: number;
  vat: number;
  total: number;
  currency: string;
  createdAt: string | null;
}

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

/** Same Wildtouch invoice layout, with a distinct proforma heading and document number. */
export function buildProformaHtml(quote: ProformaDocument): string {
  const c = quote.client ?? {};
  const money = (value: number) => formatCurrency(value, quote.currency);
  const date = quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const rows = groupIntoCategoryLines(quote.lineItems ?? []).map((line) =>
    `<tr><td><div class="desc">${esc(line.description || "—")}</div></td><td class="q">&times; ${line.qty}</td><td class="p">${money(line.unitPrice)}</td><td class="t">${money(line.lineTotal)}</td></tr>`,
  ).join("");
  const tel = c.contactNumber ? `<div class="lines">Tel. ${esc(c.contactNumber)}</div>` : "";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Proforma Invoice ${esc(quote.proformaNumber)}</title>
<style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI",Arial,sans-serif;font-size:12px;color:#1f2937;line-height:1.45;background:#f1f5f9}
.sheet{width:210mm;min-height:297mm;margin:0 auto;padding:18mm;background:#fff}
@media screen{.sheet{width:100%;max-width:820px;min-height:0;padding:32px}}
@media print{body{background:#fff}.sheet{width:210mm;min-height:297mm;padding:18mm;margin:0}}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}.title{font-size:28px;font-weight:800;color:#1e293b;margin-bottom:8px}.meta{font-size:12px}
.brand{text-align:right}.brand .logo{font-family:"Segoe Script","Brush Script MT",cursive;font-size:34px;color:#3b2f6b;line-height:1}.brand .tag{font-size:9px;color:#555;border-top:1px solid #999;border-bottom:1px solid #999;padding:2px 0;margin-top:3px}.brand .sub{font-size:12px;font-weight:700;color:#1e293b;margin-top:5px;letter-spacing:.06em}
.notice{display:inline-block;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:2px 0 8px}
.addr{display:flex;justify-content:space-between;gap:48px;margin:6px 0}.addr .col{flex:1}.addr h4{font-size:12px;font-weight:700;margin-bottom:6px}.addr .nm{font-weight:600}.addr .lines{white-space:pre-line;color:#333}hr{border:none;border-top:1px solid #94a3b8;margin:14px 0}
table.items{width:100%;border-collapse:collapse}table.items thead th{text-align:left;font-size:12px;font-weight:700;border-bottom:1px solid #cbd5e1;padding:8px 4px}table.items th.q,table.items th.p,table.items th.t{text-align:right}table.items tbody td{padding:12px 4px;border-bottom:1px solid #eee;vertical-align:top}table.items td.q,table.items td.p,table.items td.t{text-align:right;white-space:nowrap}.desc{font-weight:700}
.totals{margin:14px 0 0 auto;width:280px}.totals .trow{display:flex;justify-content:space-between;padding:6px 2px;border-bottom:1px solid #eee}.totals .trow span:first-child{font-weight:600}.totals .grand{border-bottom:none;border-top:2px solid #334155;font-weight:800;font-size:14px;padding-top:8px}
.pay{margin-top:26px;font-size:11px;color:#374151;text-align:center;line-height:1.7}.pay .ph{font-weight:700;margin-bottom:4px;font-size:12px}.reg{margin-top:20px;font-size:11px;color:#374151;text-align:center;line-height:1.6}.reg .h{font-weight:700;margin-bottom:3px}
</style></head><body><div class="sheet">
<div class="top"><div><div class="title">Proforma Invoice</div><div class="notice">Quotation only · Not a tax invoice</div><div class="meta"><strong>Proforma Invoice No.</strong> #${esc(quote.proformaNumber)}</div><div class="meta"><strong>Quote Date</strong> ${date}</div>${c.email ? `<div class="meta"><strong>Email</strong> ${esc(c.email)}</div>` : ""}</div>
<div class="brand"><div class="logo">Wildtouch</div><div class="tag">Specialising in Souvenirs for Attractions</div><div class="sub">STERLING-K LTD</div></div></div>
<div class="addr"><div class="col"><h4>Bill to</h4><div class="nm">${esc(c.name || "—")}</div><div class="lines">${esc(c.invoiceAddress || "")}</div>${tel}</div><div class="col"><h4>Ship to</h4><div class="nm">${esc(c.name || "—")}</div><div class="lines">${esc(c.deliveryAddress || c.invoiceAddress || "")}</div>${tel}</div></div>
<hr/><table class="items"><thead><tr><th>Item Description</th><th class="q">Qty</th><th class="p">Price</th><th class="t">Total</th></tr></thead><tbody>${rows || `<tr><td>No items</td><td class="q">0</td><td class="p">${money(0)}</td><td class="t">${money(0)}</td></tr>`}</tbody></table>
<div class="totals"><div class="trow"><span>Subtotal</span><span>${money(quote.subtotal)}</span></div><div class="trow"><span>Shipping</span><span>${money(quote.shipping)}</span></div><div class="trow"><span>VAT ${quote.vatRate}%</span><span>${money(quote.vat)}</span></div><div class="trow grand"><span>Total incl. VAT</span><span>${money(quote.total)}</span></div></div>
<div class="pay"><div class="ph">Payment Instructions:</div><div><strong>Pound Sterling Payments:</strong> Bank / Branch: TSB Bank Plc | Acc name: Sterling-K Ltd | Acc No: 00087646 | Sort code: 77-85-66 | IBAN: GB98TSBS77856600087646 | SWIFTBIC: TSBSGB2AXXX</div><div><strong>Euro Payments Bank:</strong> RBS Branch: Wolverhampton | IBAN: GB29RBOS16108510109304 | IBANBIC: RBOSGB2L</div><div><strong>Cheques Payments:</strong> Please make cheque payments to Sterling-K Ltd</div><div><strong>Payment Terms:</strong> Please make payment within 28 days after order approval. Overdue surcharge 2.5% per month</div></div>
<div class="reg"><div class="h">Registered Company Info:</div><div>VAT# GB909275015 | Registered / Company # 06259731</div><div>Contact Details: Sterling-K Ltd c/o Sterling-K House, 12 Well Street, Birmingham, B19 3BH | T: 0121 551 2699</div><div>Email: sales@wildtouch.co.uk | Website: www.wildtouch.co.uk</div></div>
</div></body></html>`;
}
