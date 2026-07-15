"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Printer,
  Loader2,
  AlertTriangle,
  Trash2,
  FileText,
  Package,
  Boxes,
  ClipboardList,
  LayoutGrid,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Order } from "@/lib/store/orders-store";
import { useRole } from "@/lib/hooks/use-role";
import { PartialInvoiceDialog } from "@/components/orders/partial-invoice-dialog";

interface OrderInvoiceRef {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  isPartial?: boolean;
  paymentAmount?: number;
  total?: number;
  createdAt?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  received: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
  in_production: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
  quality_check: "bg-purple-500/10 border-purple-500/25 text-purple-600 dark:text-purple-400",
  packing: "bg-cyan-500/10 border-cyan-500/25 text-cyan-600 dark:text-cyan-400",
  ready_for_dispatch: "bg-indigo-500/10 border-indigo-500/25 text-indigo-600 dark:text-indigo-400",
  dispatched: "bg-teal-500/10 border-teal-500/25 text-teal-600 dark:text-teal-400",
  delivered: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
  archived: "bg-muted text-muted-foreground border-border/40",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

const esc = (v: string) => v.replace(/[&<>]/g, (m) => (m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"));

export default function OrderViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useRole();
  const [order, setOrder] = useState<Order | null>(null);
  const [invoices, setInvoices] = useState<OrderInvoiceRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPartial, setShowPartial] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) { if (on) setNotFound(true); return; }
        const data: Order = await res.json();
        if (on) setOrder(data);
        // Best-effort: collect this order's invoices (main + partials).
        try {
          const inv = await fetch("/api/invoices");
          if (inv.ok) {
            const list: OrderInvoiceRef[] = await inv.json();
            if (on) setInvoices(list.filter((x) => x.orderNumber === data.orderNumber));
          }
        } catch { /* invoice links are optional */ }
      } catch { if (on) setNotFound(true); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  const doDelete = useCallback(async () => {
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    router.push("/orders");
  }, [id, router]);

  const printOrder = () => {
    if (!order) return;
    const c = order.client || {};
    const rows = order.lineItems
      .map((l, i) => `<tr><td class="rn">${i + 1}</td><td>${esc(l.description || "—")}</td><td class="c">${esc(l.code || "—")}</td><td class="num">${l.qtyOrdered}</td></tr>`)
      .join("");
    const comps = (order.componentRequirements || []).length
      ? `<div class="box"><h4>Components Required</h4><table><thead><tr><th>Code</th><th>Component</th><th style="text-align:right">Qty</th></tr></thead><tbody>${order.componentRequirements
          .map((r) => `<tr><td class="c">${esc(r.code || "—")}</td><td>${esc(r.label || "—")}</td><td class="num">${r.qtyRequired}</td></tr>`)
          .join("")}</tbody></table></div>`
      : "";
    const totalQty = order.lineItems.reduce((a, l) => a + l.qtyOrdered, 0);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Order ${esc(order.orderNumber)}</title>
<style>@page{size:A4;margin:18mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Segoe UI",Arial,sans-serif;font-size:11px;color:#111}
.head{display:flex;justify-content:space-between;border-bottom:2px solid #6d28d9;padding-bottom:12px;margin-bottom:16px}
.brand{font-size:20px;font-weight:800;color:#6d28d9}.muted{color:#666;font-size:11px}
.r{text-align:right}.r h2{font-size:16px;color:#111}.cols{display:flex;gap:24px;margin:14px 0}.box{margin:14px 0;flex:1}.box h4{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6d28d9;margin-bottom:3px}
table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#6d28d9;color:#fff;padding:7px 9px;font-size:9px;text-transform:uppercase;text-align:left}
td{padding:6px 9px;border-bottom:1px solid #e5e7eb}.rn{width:28px;color:#6d28d9;font-weight:700;text-align:center}.c{font-family:monospace}.num{text-align:right}
tfoot td{font-weight:800;border-top:2px solid #6d28d9}</style></head><body>
<div class="head"><div><div class="brand">Wildtouch JMS</div><div class="muted">Handcrafted jewellery</div></div>
<div class="r"><h2>ORDER</h2><div class="muted">${esc(order.orderNumber)}</div><div class="muted">${statusLabel(order.status)}</div><div class="muted">${fmtDate(order.createdAt)}</div></div></div>
<div class="cols">
<div class="box"><h4>Client</h4><div><strong>${esc(c.name || "—")}</strong></div><div class="muted" style="white-space:pre-line">${esc(c.invoiceAddress || "")}</div>${c.email ? `<div class="muted">${esc(c.email)}</div>` : ""}${c.contactNumber ? `<div class="muted">${esc(c.contactNumber)}</div>` : ""}</div>
<div class="box"><h4>Deliver To</h4><div class="muted" style="white-space:pre-line">${esc(c.deliveryAddress || c.invoiceAddress || "—")}</div></div>
<div class="box"><h4>Planogram</h4><div>${esc(order.planogram?.name || "—")}</div></div>
</div>
<table><thead><tr><th>#</th><th>Product</th><th>Code</th><th style="text-align:right">Qty</th></tr></thead>
<tbody>${rows}</tbody>
<tfoot><tr><td colspan="3" style="text-align:right">Total units</td><td class="num">${totalQty}</td></tr></tfoot></table>
${comps}
${order.notes ? `<div class="box"><h4>Notes</h4><div class="muted">${esc(order.notes)}</div></div>` : ""}
</body></html>`;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    win.document.write(html); win.document.close(); win.focus();
    setTimeout(() => win.print(), 350);
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading order…</span></div>;
  }
  if (notFound || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-base font-semibold">Order not found</p>
        <Link href="/orders" className="text-sm text-primary mt-2">Back to Orders</Link>
      </div>
    );
  }

  const c = order.client || {};
  const totalUnits = order.lineItems.reduce((a, l) => a + l.qtyOrdered, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Orders
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight font-mono">{order.orderNumber}</h1>
            <Badge variant="outline" className={cn("text-[10px] font-semibold", STATUS_STYLE[order.status] ?? STATUS_STYLE.archived)}>
              {statusLabel(order.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {invoices.find((x) => !x.isPartial) && (
              <Link href={`/invoices/${invoices.find((x) => !x.isPartial)!.id}`}>
                <Button variant="outline" className="gap-2 rounded-xl border-border/40">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Invoice
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={() => setShowPartial(true)}
              className="gap-2 rounded-xl border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15"
            >
              <Receipt className="h-3.5 w-3.5" /> Partial Invoice
            </Button>
            <Button onClick={printOrder} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              <Printer className="h-4 w-4" /> Download PDF
            </Button>
            <Link href={`/orders/${id}/packing-list`}>
              <Button variant="outline" className="gap-2 rounded-xl border-border/40">
                <ClipboardList className="h-3.5 w-3.5 text-primary" /> Packing List
              </Button>
            </Link>
            {isAdmin && (
              <button onClick={() => setConfirmDelete(true)} title="Delete order"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Order document */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex-1 min-w-0 w-full max-w-3xl rounded-2xl border border-border/40 bg-card/70 glass p-6 sm:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4 border-b border-border/30 pb-5">
          <div>
            <p className="text-xl font-extrabold text-primary">Wildtouch JMS</p>
            <p className="text-xs text-muted-foreground">Handcrafted jewellery</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">ORDER</p>
            <p className="text-xs text-muted-foreground font-mono">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Client</p>
            <p className="text-sm font-semibold">{c.name || "—"}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">{c.invoiceAddress || ""}</p>
            {c.email && <p className="text-xs text-muted-foreground mt-0.5">{c.email}</p>}
            {c.contactNumber && <p className="text-xs text-muted-foreground">{c.contactNumber}</p>}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Deliver To</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">{c.deliveryAddress || c.invoiceAddress || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Planogram</p>
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              {order.planogram?.name || "—"}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-10">#</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">No line items.</td></tr>
              ) : (
                order.lineItems.map((l, i) => (
                  <tr key={i} className="border-b border-border/15 last:border-b-0">
                    <td className="px-3 py-2 text-center text-[11px] font-bold text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2 text-sm font-medium">{l.description || "—"}</td>
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{l.code || "—"}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{l.qtyOrdered}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30">
                <td colSpan={3} className="px-3 py-3 text-right text-sm font-bold">Total units</td>
                <td className="px-3 py-3 text-right text-base font-black tabular-nums text-primary">{totalUnits}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Components required */}
        {order.componentRequirements?.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-2 flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5" /> Components Required
            </p>
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Component</th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {order.componentRequirements.map((r, i) => (
                    <tr key={i} className="border-b border-border/15 last:border-b-0">
                      <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{r.code || "—"}</td>
                      <td className="px-3 py-2 text-sm">{r.label || "—"}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">{r.qtyRequired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {order.notes && (
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{order.notes}</p>
          </div>
        )}
      </motion.div>

      {/* Side panel: billing + planogram summary */}
      <div className="w-full lg:w-72 lg:shrink-0 space-y-4 lg:sticky lg:top-4">
      {/* Billing — order total vs partial invoices issued */}
      {(order.total || 0) > 0 && (
        <motion.aside initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-5">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Billing</h3>
          </div>
          {(() => {
            const total = order.total || 0;
            const invoiced = Math.min(total, order.amountInvoiced ?? 0);
            const remaining = Math.max(0, total - invoiced);
            const pct = total > 0 ? Math.min(100, Math.round((invoiced / total) * 100)) : 0;
            return (
              <>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Order total</span><span className="font-bold tabular-nums">£{total.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Invoiced</span><span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">£{invoiced.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-border/30 pt-1.5"><span className="font-semibold">Remaining</span><span className="font-black tabular-nums text-primary">£{remaining.toFixed(2)}</span></div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                  <div className={cn("h-full rounded-full transition-all", remaining <= 0 ? "bg-emerald-500" : "bg-gradient-to-r from-primary to-indigo-500")} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{remaining <= 0 ? "Fully invoiced" : `${pct}% invoiced via partial invoices`}</p>
                {remaining > 0 && (
                  <Button onClick={() => setShowPartial(true)} variant="outline" size="sm"
                    className="mt-3 w-full gap-1.5 rounded-xl border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15 text-xs font-semibold">
                    <Receipt className="h-3.5 w-3.5" /> New Partial Invoice
                  </Button>
                )}
              </>
            );
          })()}
          {invoices.length > 0 && (
            <div className="mt-4 border-t border-border/30 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Invoices for this order</p>
              <div className="space-y-1.5">
                {invoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between gap-2 text-sm group">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="font-mono font-semibold truncate group-hover:text-primary group-hover:underline">{inv.invoiceNumber}</span>
                      {inv.isPartial && (
                        <span className="shrink-0 rounded-md bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Partial</span>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums text-xs font-semibold text-muted-foreground">
                      £{(inv.isPartial ? inv.paymentAmount ?? 0 : inv.total ?? 0).toFixed(2)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.aside>
      )}

      {/* Planogram summary — same panel as on the invoice */}
      <motion.aside initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-5">
        <div className="flex items-center gap-2 mb-1">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Planogram</h3>
        </div>
        <p className="text-sm font-semibold">{order.planogram?.name || "—"}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Order <span className="font-mono">{order.orderNumber || "—"}</span> · {totalUnits} units
        </p>
        <div className="mt-4 border-t border-border/30 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Products &amp; quantities</p>
          {order.lineItems.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">No products</p>
          ) : (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {order.lineItems.map((l, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{l.description || "—"}</span>
                  <span className="shrink-0 font-bold tabular-nums text-primary">×{l.qtyOrdered}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.aside>
      </div>
      </div>

      {/* Partial invoice */}
      <PartialInvoiceDialog
        order={showPartial ? order : null}
        onClose={() => setShowPartial(false)}
        onCreated={(_, amountInvoiced) => setOrder((o) => (o ? { ...o, amountInvoiced } : o))}
      />

      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Order?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">&ldquo;{order.orderNumber}&rdquo; will be permanently removed.</p>
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
