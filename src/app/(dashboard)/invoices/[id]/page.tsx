"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceLine { code: string; description: string; qty: number; unitPrice: number; lineTotal: number }
interface Invoice {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  client: { name?: string; email?: string; contactNumber?: string; invoiceAddress?: string; deliveryAddress?: string; clientId?: string };
  lineItems: InvoiceLine[];
  subtotal: number;
  total: number;
  currency: string;
  status: string;
  createdAt: string | null;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export default function InvoiceViewPage() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) { if (on) setNotFound(true); return; }
        const data = await res.json();
        if (on) setInv(data);
      } catch { if (on) setNotFound(true); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  const printInvoice = () => {
    if (!inv) return;
    const rows = inv.lineItems.map((l, i) => `<tr><td class="rn">${i + 1}</td><td>${l.description}</td><td class="c">${l.code || "—"}</td><td class="num">${l.qty}</td><td class="num">£${l.unitPrice.toFixed(2)}</td><td class="num">£${l.lineTotal.toFixed(2)}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice ${inv.invoiceNumber}</title>
<style>@page{size:A4;margin:18mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#111}
.head{display:flex;justify-content:space-between;border-bottom:2px solid #6d28d9;padding-bottom:12px;margin-bottom:16px}
.brand{font-size:20px;font-weight:800;color:#6d28d9}.muted{color:#666;font-size:11px}
.inv{text-align:right}.inv h2{font-size:16px;color:#111}.box{margin:14px 0}.box h4{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6d28d9;margin-bottom:3px}
table{width:100%;border-collapse:collapse;margin-top:10px}th{background:#6d28d9;color:#fff;padding:7px 9px;font-size:9px;text-transform:uppercase;text-align:left}
td{padding:6px 9px;border-bottom:1px solid #e5e7eb}.rn{width:28px;color:#6d28d9;font-weight:700;text-align:center}.c{font-family:monospace}.num{text-align:right}
tfoot td{font-weight:800;border-top:2px solid #6d28d9}</style></head><body>
<div class="head"><div><div class="brand">Wildtouch JMS</div><div class="muted">Handcrafted jewellery</div></div>
<div class="inv"><h2>INVOICE</h2><div class="muted">${inv.invoiceNumber}</div><div class="muted">Order ${inv.orderNumber}</div><div class="muted">${fmtDate(inv.createdAt)}</div></div></div>
<div class="box"><h4>Bill To</h4><div><strong>${inv.client.name || "—"}</strong></div><div class="muted" style="white-space:pre-line">${inv.client.invoiceAddress || ""}</div>${inv.client.email ? `<div class="muted">${inv.client.email}</div>` : ""}</div>
<table><thead><tr><th>#</th><th>Description</th><th>Code</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Amount</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="5" style="text-align:right">Total</td><td class="num">£${inv.total.toFixed(2)}</td></tr></tfoot></table>
</body></html>`;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus();
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

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
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

      {/* Online invoice */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-border/30 pb-5">
          <div>
            <p className="text-xl font-extrabold text-primary">Wildtouch JMS</p>
            <p className="text-xs text-muted-foreground">Handcrafted jewellery</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">INVOICE</p>
            <p className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">Order {inv.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Bill To</p>
            <p className="text-sm font-semibold">{inv.client.name || "—"}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">{inv.client.invoiceAddress || ""}</p>
            {inv.client.email && <p className="text-xs text-muted-foreground mt-0.5">{inv.client.email}</p>}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Deliver To</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">{inv.client.deliveryAddress || inv.client.invoiceAddress || "—"}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unit</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lineItems.map((l, i) => (
                <tr key={i} className="border-b border-border/15 last:border-b-0">
                  <td className="px-3 py-2 text-sm font-medium">{l.description}</td>
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{l.code || "—"}</td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums">{l.qty}</td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums">£{l.unitPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums">£{l.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30">
                <td colSpan={4} className="px-3 py-3 text-right text-sm font-bold">Total</td>
                <td className="px-3 py-3 text-right text-base font-black tabular-nums text-primary">£{inv.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
