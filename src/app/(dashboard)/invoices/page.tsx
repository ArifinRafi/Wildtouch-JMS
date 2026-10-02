"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, FileText, Loader2, ArrowRight, CalendarDays, X, Trash2, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency, normalizeCurrency, type SupportedCurrency } from "@/lib/currency";
import { INVOICE_PAYMENT_STATUSES, invoiceStatusLabel } from "@/lib/invoice-status";

interface InvoiceComment { text: string; createdAt: string | null; createdBy: string }

interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  client: { name?: string };
  total: number;
  creditApplied?: number;
  amountDue?: number;
  creditFinalized?: boolean;
  status: string;
  comments?: InvoiceComment[];
  isPartial?: boolean;
  paymentAmount?: number;
  balanceDue?: number;
  currency?: string;
  createdAt: string | null;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Local-timezone YYYY-MM-DD key, to match a date-picker value against a timestamp. */
function dateKey(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<InvoiceListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);
  const [commentInvoiceId, setCommentInvoiceId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [updateError, setUpdateError] = useState("");

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
    fetch("/api/users/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => on && setRole(u?.role ?? null))
      .catch(() => {});
    return () => { on = false; };
  }, []);

  const isAdmin = role === "admin";
  const canEdit = role === "admin" || role === "manager";
  const commentInvoice = invoices.find((invoice) => invoice.id === commentInvoiceId) ?? null;

  const changeStatus = async (invoice: InvoiceListItem, status: string) => {
    if (!canEdit || savingStatusId) return;
    setSavingStatusId(invoice.id); setUpdateError("");
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "Could not update invoice status");
      setInvoices((current) => current.map((item) => item.id === invoice.id ? saved : item));
    } catch (error) { setUpdateError(error instanceof Error ? error.message : "Could not update invoice status"); }
    finally { setSavingStatusId(null); }
  };

  const addComment = async () => {
    if (!commentInvoice || !canEdit || !commentText.trim() || savingComment) return;
    setSavingComment(true); setUpdateError("");
    try {
      const response = await fetch(`/api/invoices/${commentInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentText.trim() }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "Could not save comment");
      setInvoices((current) => current.map((item) => item.id === commentInvoice.id ? saved : item));
      setCommentText("");
    } catch (error) { setUpdateError(error instanceof Error ? error.message : "Could not save comment"); }
    finally { setSavingComment(false); }
  };

  const filtered = useMemo(
    () => (dateFilter ? invoices.filter((i) => dateKey(i.createdAt) === dateFilter) : invoices),
    [invoices, dateFilter],
  );

  const confirmDelete = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${toDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        // Removing an invoice also removes its order + any sibling invoices — drop them all locally.
        setInvoices((prev) => prev.filter((i) => i.id !== toDelete.id && i.orderNumber !== toDelete.orderNumber));
        void data;
      }
    } catch { /* keep the row on failure */ }
    finally { setDeleting(false); setToDelete(null); }
  };

  // Partial invoices count for their payment amount, not the full order total.
  const totalValue = filtered.reduce<Record<SupportedCurrency, number>>(
    (totals, invoice) => {
      totals[normalizeCurrency(invoice.currency)] += invoice.isPartial
        ? invoice.paymentAmount || 0
        : invoice.amountDue ?? invoice.total ?? 0;
      return totals;
    },
    { GBP: 0, EUR: 0 },
  );
  const totalValueLabel = (Object.entries(totalValue) as [SupportedCurrency, number][])
    .filter(([, amount]) => amount !== 0)
    .map(([currency, amount]) => formatCurrency(amount, currency))
    .join(" · ") || formatCurrency(0, "GBP");

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <Receipt className="h-7 w-7 text-primary" /> Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} invoice{filtered.length === 1 ? "" : "s"}{dateFilter ? " on this date" : ""} · <span className="font-semibold text-primary">{totalValueLabel}</span> total
          </p>
        </div>
        {/* Date filter */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center">
            <CalendarDays className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 rounded-xl border border-border/60 bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              title="Show invoices for a specific date"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              title="Clear date filter"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {updateError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{updateError}</p>}

      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading invoices…</span></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4"><Receipt className="h-7 w-7 text-primary" /></div>
            {dateFilter ? (
              <>
                <p className="text-base font-semibold">No invoices on {fmtDate(dateFilter)}</p>
                <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">Try a different date, or clear the filter to see all invoices.</p>
                <Button variant="outline" className="rounded-xl gap-1.5 border-border/40" onClick={() => setDateFilter("")}><X className="h-3.5 w-3.5" /> Clear date</Button>
              </>
            ) : (
              <>
                <p className="text-base font-semibold">No invoices yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">Invoices are generated when you confirm an order.</p>
                <Link href="/orders/new" className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 px-4 py-2 text-sm font-semibold text-white">Create New Order</Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comments</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comment date &amp; time</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"></th>
                  {isAdmin && <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12"></th>}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((inv, i) => (
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
                        {formatCurrency(inv.isPartial ? inv.paymentAmount || 0 : inv.amountDue ?? inv.total ?? 0, inv.currency)}
                        {!inv.isPartial && (inv.creditApplied ?? 0) > 0 && <p className="mt-0.5 text-[10px] font-medium text-emerald-700">{formatCurrency(inv.creditApplied ?? 0, inv.currency)} credit applied</p>}
                        {inv.creditFinalized === false && <p className="mt-0.5 text-[10px] font-medium text-amber-700">Credit pending</p>}
                        {inv.isPartial && (
                          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                            of {formatCurrency(inv.total || 0, inv.currency)} · {formatCurrency(inv.balanceDue || 0, inv.currency)} left
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {canEdit && inv.status !== "void" ? (
                          <select
                            aria-label={`Payment status for ${inv.invoiceNumber}`}
                            value={inv.status || "issued"}
                            disabled={savingStatusId === inv.id}
                            onChange={(event) => void changeStatus(inv, event.target.value)}
                            className="w-48 rounded-lg border border-border/60 bg-background px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                          >
                            {INVOICE_PAYMENT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                        ) : <span>{invoiceStatusLabel(inv.status)}</span>}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {inv.comments?.length ? <p className="max-w-[220px] truncate" title={inv.comments[inv.comments.length - 1].text}>{inv.comments[inv.comments.length - 1].text}</p> : <p className="text-muted-foreground">No comments</p>}
                        <button
                          type="button"
                          onClick={() => { setUpdateError(""); setCommentText(""); setCommentInvoiceId(inv.id); }}
                          className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        ><MessageSquare className="h-3 w-3" /> {canEdit ? "View / Add" : "View"}{inv.comments?.length ? ` (${inv.comments.length})` : ""}</button>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(inv.comments?.at(-1)?.createdAt ?? null)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/invoices/${inv.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => setToDelete(inv)} title="Delete invoice"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!commentInvoice} onOpenChange={(open) => { if (!open && !savingComment) { setCommentInvoiceId(null); setCommentText(""); setUpdateError(""); } }}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Invoice comments · {commentInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
            {commentInvoice?.comments?.length ? [...commentInvoice.comments].reverse().map((comment, index) => (
              <div key={`${comment.createdAt}-${index}`} className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
                <p className="whitespace-pre-wrap text-sm">{comment.text}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{fmtDateTime(comment.createdAt)}{comment.createdBy ? ` · ${comment.createdBy}` : ""}</p>
              </div>
            )) : <p className="py-6 text-center text-sm text-muted-foreground">No comments yet.</p>}
          </div>
          {canEdit && <div className="space-y-2 border-t border-border/40 pt-3">
            <label htmlFor="invoice-comment" className="text-xs font-semibold">Add a comment</label>
            <textarea
              id="invoice-comment"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Write an invoice note…"
              className="w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-[11px] text-muted-foreground">The date and time are added automatically when you save.</p>
          </div>}
          {updateError && <p role="alert" className="text-sm text-destructive">{updateError}</p>}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => { setCommentInvoiceId(null); setCommentText(""); setUpdateError(""); }} disabled={savingComment}>Close</Button>
            {canEdit && <Button onClick={addComment} disabled={!commentText.trim() || savingComment}>
              {savingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save comment"}
            </Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm (admin only) */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && !deleting && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0"><AlertTriangle className="h-5 w-5" /></div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Invoice?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">This also deletes the linked order — and cannot be undone.</p>
              </div>
            </div>
          </DialogHeader>
          {toDelete && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm font-semibold font-mono">{toDelete.invoiceNumber}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {toDelete.client?.name || "No client"} · Order <span className="font-mono">{toDelete.orderNumber || "—"}</span>
              </p>
              <p className="text-[11px] text-destructive mt-2 font-medium">
                Order {toDelete.orderNumber || ""} and all of its invoices (including partial invoices) will be permanently removed.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
