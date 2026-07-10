"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, FileText, Loader2, ArrowRight } from "lucide-react";

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  client: { name?: string };
  total: number;
  status: string;
  isPartial?: boolean;
  paymentAmount?: number;
  balanceDue?: number;
  createdAt: string | null;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch("/api/invoices");
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (on) setInvoices(data);
      } catch (err) { console.error(err); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, []);

  // Partial invoices count for their payment amount, not the full order total.
  const totalValue = invoices.reduce((s, i) => s + (i.isPartial ? i.paymentAmount || 0 : i.total || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
          <Receipt className="h-7 w-7 text-primary" /> Invoices
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"} · <span className="font-semibold text-primary">£{totalValue.toLocaleString()}</span> total
        </p>
      </motion.div>

      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading invoices…</span></div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4"><Receipt className="h-7 w-7 text-primary" /></div>
            <p className="text-base font-semibold">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">Invoices are generated when you confirm an order.</p>
            <Link href="/orders/new" className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 px-4 py-2 text-sm font-semibold text-white">Create New Order</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {invoices.map((inv, i) => (
                    <motion.tr key={inv.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.16, delay: Math.min(i, 12) * 0.012 }}
                      className="border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0">
                      <td className="px-5 py-3 text-[11px] font-bold text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-5 py-3">
                        <Link href={`/invoices/${inv.id}`} className="flex items-center gap-2 group">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-mono font-semibold group-hover:text-primary transition-colors">{inv.invoiceNumber}</span>
                          {inv.isPartial && (
                            <span className="rounded-md bg-indigo-500/10 border border-indigo-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Partial</span>
                          )}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5 pl-6">Order {inv.orderNumber}</p>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium">{inv.client?.name || "—"}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold tabular-nums">
                        £{(inv.isPartial ? inv.paymentAmount || 0 : inv.total || 0).toLocaleString()}
                        {inv.isPartial && (
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                            of £{(inv.total || 0).toLocaleString()} · £{(inv.balanceDue || 0).toLocaleString()} left
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/invoices/${inv.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
