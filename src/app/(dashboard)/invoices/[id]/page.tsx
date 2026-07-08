"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, Loader2, AlertTriangle, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceLine { code: string; description: string; qty: number; unitPrice: number; lineTotal: number }
interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string | null;
  orderNumber: string;
  client: { name?: string; email?: string; contactNumber?: string; invoiceAddress?: string; deliveryAddress?: string; clientId?: string };
  lineItems: InvoiceLine[];
  subtotal: number;
  shipping: number;
  vatRate: number;
  vat: number;
  total: number;
  currency: string;
  status: string;
  createdAt: string | null;
}

const esc = (v: string) => String(v ?? "").replace(/[&<>]/g, (m) => (m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"));
const gbp = (n: number) => `£${(Number(n) || 0).toFixed(2)}`;

function dateShort(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** The single source of truth for how an invoice looks — used both on screen (iframe) and in the printed PDF. */
function buildInvoiceHtml(inv: Invoice): string {
  const c = inv.client || {};
  const rows = inv.lineItems
    .map((l) => {
      const desc = esc(l.description || "—");
      const code = esc(l.code || "");
      return `<tr><td><div class="desc">${desc}${code ? ` ${code}` : ""}</div>${code ? `<div class="code">${code}</div>` : ""}</td><td class="q">&times; ${l.qty}</td><td class="p">${gbp(l.unitPrice)}</td><td class="t">${gbp(l.lineTotal)}</td></tr>`;
    })
    .join("");
  const tel = (n?: string) => (n ? `<div class="lines">Tel. ${esc(n)}</div>` : "");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice ${esc(inv.invoiceNumber)}</title>
<style>@page{size:A4;margin:0}*{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Segoe UI",Arial,sans-serif;font-size:12px;color:#1f2937;line-height:1.45;background:#f1f5f9}
.sheet{width:210mm;min-height:297mm;margin:0 auto;padding:18mm;background:#fff}
@media screen{.sheet{width:100%;max-width:820px;min-height:0;padding:32px}}
@media print{body{background:#fff}.sheet{width:210mm;min-height:297mm;padding:18mm;margin:0}}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}
.title{font-size:28px;font-weight:800;color:#1e293b;margin-bottom:8px}
.meta{font-size:12px}
.brand{text-align:right}
.brand .logo{font-family:"Segoe Script","Brush Script MT",cursive;font-size:34px;color:#3b2f6b;line-height:1}
.brand .tag{font-size:9px;color:#555;border-top:1px solid #999;border-bottom:1px solid #999;padding:2px 0;margin-top:3px}
.brand .sub{font-size:12px;font-weight:700;color:#1e293b;margin-top:5px;letter-spacing:.06em}
.addr{display:flex;justify-content:space-between;gap:48px;margin:6px 0}
.addr .col{flex:1}
.addr h4{font-size:12px;font-weight:700;margin-bottom:6px}
.addr .nm{font-weight:600}
.addr .lines{white-space:pre-line;color:#333}
hr{border:none;border-top:1px solid #94a3b8;margin:14px 0}
table.items{width:100%;border-collapse:collapse}
table.items thead th{text-align:left;font-size:12px;font-weight:700;border-bottom:1px solid #cbd5e1;padding:8px 4px}
table.items th.q,table.items th.p,table.items th.t{text-align:right}
table.items tbody td{padding:12px 4px;border-bottom:1px solid #eee;vertical-align:top}
table.items td.q,table.items td.p,table.items td.t{text-align:right;white-space:nowrap}
.desc{font-weight:700}
.code{color:#555;font-size:11px;margin-top:2px}
.totals{margin:14px 0 0 auto;width:280px}
.totals .trow{display:flex;justify-content:space-between;padding:6px 2px;border-bottom:1px solid #eee}
.totals .trow span:first-child{font-weight:600}
.totals .grand{border-bottom:none;border-top:2px solid #334155;font-weight:800;font-size:14px;padding-top:8px}
.pay{margin-top:26px;font-size:11px;color:#374151;text-align:center;line-height:1.7}
.pay .ph{font-weight:700;margin-bottom:4px;font-size:12px}
.reg{margin-top:20px;font-size:11px;color:#374151;text-align:center;line-height:1.6}
.reg .h{font-weight:700;margin-bottom:3px}
</style></head><body>
<div class="sheet">
<div class="top">
  <div>
    <div class="title">Invoice</div>
    <div class="meta"><strong>Invoice No.</strong> #${esc(inv.invoiceNumber)}</div>
    <div class="meta"><strong>Order Date</strong> ${dateShort(inv.createdAt)}</div>
    ${c.email ? `<div class="meta"><strong>Email</strong> ${esc(c.email)}</div>` : ""}
  </div>
  <div class="brand">
    <div class="logo">Wildtouch</div>
    <div class="tag">Specialising in Souvenirs for Attractions</div>
    <div class="sub">STERLING-K LTD</div>
  </div>
</div>
<div class="addr">
  <div class="col"><h4>Bill to</h4><div class="nm">${esc(c.name || "—")}</div><div class="lines">${esc(c.invoiceAddress || "")}</div>${tel(c.contactNumber)}</div>
  <div class="col"><h4>Ship to</h4><div class="nm">${esc(c.name || "—")}</div><div class="lines">${esc(c.deliveryAddress || c.invoiceAddress || "")}</div>${tel(c.contactNumber)}</div>
</div>
<hr/>
<table class="items">
  <thead><tr><th>Item Description</th><th class="q">Qty</th><th class="p">Price</th><th class="t">Total</th></tr></thead>
  <tbody>${rows || `<tr><td>No items</td><td class="q">0</td><td class="p">${gbp(0)}</td><td class="t">${gbp(0)}</td></tr>`}</tbody>
</table>
<div class="totals">
  <div class="trow"><span>Subtotal</span><span>${gbp(inv.subtotal)}</span></div>
  <div class="trow"><span>Shipping</span><span>${gbp(inv.shipping)}</span></div>
  <div class="trow"><span>VAT ${inv.vatRate}%</span><span>${gbp(inv.vat)}</span></div>
  <div class="trow grand"><span>Total incl. VAT</span><span>${gbp(inv.total)}</span></div>
</div>
<div class="pay">
  <div class="ph">Payment Instructions:</div>
  <div><strong>Pound Sterling Payments:</strong> Bank / Branch: TSB Bank Plc | Acc name: Sterling-K Ltd | Acc No: 00087646 | Sort code: 77-85-66 | IBAN: GB98TSBS77856600087646 | SWIFTBIC: TSBSGB2AXXX</div>
  <div><strong>Euro Payments Bank:</strong> RBS Branch: Wolverhampton | IBAN: GB29RBOS16108510109304 | IBANBIC: RBOSGB2L</div>
  <div><strong>Cheques Payments:</strong> Please make cheque payments to Sterling-K Ltd</div>
  <div><strong>Payment Terms:</strong> Please make payment within 28 days. Overdue surcharge 2.5% per month</div>
</div>
<div class="reg">
  <div class="h">Registered Company Info:</div>
  <div>VAT# GB909275015 | Registered / Company # 06259731</div>
  <div>Contact Details: Sterling-K Ltd c/o Sterling-K House, 12 Well Street, Birmingham, B19 3BH | T: 0121 551 2699</div>
  <div>Email: sales@wildtouch.co.uk | Website: www.wildtouch.co.uk</div>
</div>
</div>
</body></html>`;
}

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [planogramName, setPlanogramName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) { if (on) setNotFound(true); return; }
        const data: Invoice = await res.json();
        if (on) setInv(data);
        // Pull the planogram name from the linked order (for the side panel only).
        if (data.orderId) {
          try {
            const or = await fetch(`/api/orders/${data.orderId}`);
            if (or.ok) {
              const order = await or.json();
              if (on) setPlanogramName(order?.planogram?.name ?? "");
            }
          } catch { /* side panel is best-effort */ }
        }
      } catch { if (on) setNotFound(true); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  const printInvoice = () => {
    if (!inv) return;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    win.document.write(buildInvoiceHtml(inv));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  if (loading) return <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading invoice…</span></div>;
  if (notFound || !inv) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-base font-semibold">Invoice not found</p>
      <Link href="/invoices" className="text-sm text-primary mt-2">Back to Invoices</Link>
    </div>
  );

  const totalUnits = inv.lineItems.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Invoices
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{inv.invoiceNumber}</h1>
          <Button onClick={printInvoice} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
            <Printer className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Online invoice — identical to the printed PDF (same HTML) */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex-1 min-w-0 max-w-[820px] w-full rounded-2xl border border-border/40 bg-white overflow-hidden shadow-sm">
          <iframe
            title="Invoice"
            srcDoc={buildInvoiceHtml(inv)}
            className="w-full block"
            style={{ border: 0, height: 900 }}
            onLoad={(e) => {
              try {
                const doc = e.currentTarget.contentDocument;
                if (doc) e.currentTarget.style.height = `${doc.documentElement.scrollHeight + 8}px`;
              } catch { /* cross-origin guard — not applicable for srcDoc */ }
            }}
          />
        </motion.div>

        {/* Planogram summary — screen only, NOT part of the invoice or its PDF */}
        <motion.aside initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full lg:w-72 lg:shrink-0 rounded-2xl border border-border/40 bg-card/70 glass p-5 lg:sticky lg:top-4">
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Planogram</h3>
          </div>
          <p className="text-sm font-semibold">{planogramName || "—"}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Order <span className="font-mono">{inv.orderNumber || "—"}</span> · {totalUnits} units
          </p>

          <div className="mt-4 border-t border-border/30 pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Products &amp; quantities</p>
            {inv.lineItems.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">No products</p>
            ) : (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {inv.lineItems.map((l, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{l.description || "—"}</span>
                    <span className="shrink-0 font-bold tabular-nums text-primary">×{l.qty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
