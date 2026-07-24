"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  Eye,
  Receipt,
  CalendarDays,
  X,
  ClipboardList,
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
import { useOrders, type Order } from "@/lib/store/orders-store";
import { useRole } from "@/lib/hooks/use-role";
import { PartialInvoiceDialog } from "@/components/orders/partial-invoice-dialog";

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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

export default function OrdersPage() {
  const { orders, loading, deleteOrder, refresh } = useOrders();
  const { isAdmin } = useRole();
  const router = useRouter();
  const [toDelete, setToDelete] = useState<Order | null>(null);
  const [partialFor, setPartialFor] = useState<Order | null>(null);
  const [packingFor, setPackingFor] = useState<Order | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  // Re-fetch whenever the Orders page is opened so newly confirmed orders
  // appear without a manual browser refresh.
  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  const openPackingList = (withPod: boolean) => {
    if (!packingFor) return;
    const o = packingFor;
    setPackingFor(null);
    router.push(`/orders/${o.id}/packing-list${withPod ? "" : "?pod=0"}`);
  };

  const filtered = useMemo(
    () => (dateFilter ? orders.filter((o) => dateKey(o.createdAt) === dateFilter) : orders),
    [orders, dateFilter],
  );

  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter(
      (o) => !["delivered", "archived"].includes(o.status),
    ).length;
    const dispatched = orders.filter((o) => o.status === "dispatched").length;
    const value = orders.reduce((s, o) => s + (o.total || 0), 0);
    return { total, active, dispatched, value };
  }, [orders]);

  // Invoice totals for the current view (respects the date filter above):
  //  - invoiceGenerated: full invoice value of these orders (each order = one invoice)
  //  - partialGenerated: amount billed via partial invoices
  //  - outstanding: remaining un-invoiced balance on orders that used partial invoicing (0 otherwise)
  const invoiceSummary = useMemo(() => {
    let invoiceGenerated = 0, partialGenerated = 0, outstanding = 0;
    for (const o of filtered) {
      const total = o.total || 0;
      const partial = o.amountInvoiced || 0;
      invoiceGenerated += total;
      partialGenerated += partial;
      if (partial > 0) outstanding += Math.max(0, total - partial);
    }
    return { invoiceGenerated, partialGenerated, outstanding };
  }, [filtered]);
  const gbp = (n: number) => `£${(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const confirmDelete = useCallback(() => {
    if (!toDelete) return;
    deleteOrder(toDelete.id);
    setToDelete(null);
  }, [toDelete, deleteOrder]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and track customer orders ·{" "}
            <span className="font-semibold text-primary">
              {dateFilter ? `${filtered.length} on ${formatDate(dateFilter)}` : `${orders.length} total`}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date filter */}
          <div className="relative flex items-center">
            <CalendarDays className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Show orders for a specific date"
              className="h-9 rounded-xl border border-border/60 bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/orders/new">
              <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold">
                <Plus className="h-4 w-4" />
                Create New Order
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stat chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Package, label: "Total Orders", value: stats.total.toLocaleString(), color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Clock, label: "Active", value: stats.active.toLocaleString(), color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { icon: Truck, label: "Dispatched", value: stats.dispatched.toLocaleString(), color: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20" },
          { icon: CheckCircle2, label: "Total Value", value: `£${stats.value.toLocaleString()}`, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        ].map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}
          >
            <chip.icon className="h-4 w-4" />
            {chip.label}: {chip.value}
          </motion.div>
        ))}
      </motion.div>

      {/* Table / states */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading orders…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4">
              <ShoppingCart className="h-7 w-7 text-primary" />
            </div>
            {dateFilter ? (
              <>
                <p className="text-base font-semibold">No orders on {formatDate(dateFilter)}</p>
                <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">Try a different date, or clear the filter to see all orders.</p>
                <Button variant="outline" className="gap-1.5 rounded-xl border-border/40" onClick={() => setDateFilter("")}>
                  <X className="h-3.5 w-3.5" /> Clear date
                </Button>
              </>
            ) : (
              <>
                <p className="text-base font-semibold">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
                  Create your first order — pick a planogram, check stock, choose a client, and generate an invoice.
                </p>
                <Link href="/orders/new">
                  <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
                    <Plus className="h-4 w-4" /> Create New Order
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Items</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Packing Slip</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((o, i) => (
                    <motion.tr
                      key={o.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.16, delay: Math.min(i, 12) * 0.012 }}
                      className="border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0"
                    >
                      <td className="px-5 py-3 align-middle">
                        <span className="text-[11px] font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <Link href={`/orders/${o.id}`} className="flex items-center gap-2 group/order">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-mono font-semibold group-hover/order:text-primary group-hover/order:underline transition-colors">{o.orderNumber}</span>
                        </Link>
                        {o.planogram?.name && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 pl-6">{o.planogram.name}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <p className="text-sm font-medium">{o.client?.name || "—"}</p>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3 align-middle text-right tabular-nums text-sm">
                        {o.lineItems?.length ?? 0}
                      </td>
                      <td className="px-5 py-3 align-middle text-right tabular-nums text-sm font-semibold">
                        £{(o.total || 0).toLocaleString()}
                        {(o.amountInvoiced ?? 0) > 0 && (o.total || 0) > 0 && (
                          <p className={cn(
                            "text-[10px] font-semibold mt-0.5",
                            (o.amountInvoiced ?? 0) >= (o.total || 0)
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400",
                          )}>
                            {(o.amountInvoiced ?? 0) >= (o.total || 0)
                              ? "Fully invoiced"
                              : `£${(o.amountInvoiced ?? 0).toFixed(2)} invoiced · £${Math.max(0, (o.total || 0) - (o.amountInvoiced ?? 0)).toFixed(2)} left`}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-semibold", STATUS_STYLE[o.status] ?? STATUS_STYLE.archived)}
                        >
                          {statusLabel(o.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 align-middle text-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPackingFor(o)}
                          title="Generate packing slip"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 transition-colors"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-semibold">Packing List</span>
                        </motion.button>
                      </td>
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/orders/${o.id}`} title="Open order">
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </motion.span>
                          </Link>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPartialFor(o)}
                            title="Create partial invoice"
                            className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 transition-colors"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-semibold">Partial</span>
                          </motion.button>
                          {isAdmin && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setToDelete(o)}
                              title="Delete order"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Invoice summary — respects the date filter above */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-5"
        >
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Invoice Summary
            </h3>
            <span className="text-xs text-muted-foreground">
              {dateFilter ? formatDate(dateFilter) : "All dates"} · {filtered.length} order{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Total Invoice Generated", value: invoiceSummary.invoiceGenerated, sub: "Full invoice value of these orders", color: "text-primary bg-primary/5 border-primary/20" },
              { label: "Partial Invoiced", value: invoiceSummary.partialGenerated, sub: "Billed via partial invoices", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-500/20" },
              { label: "Outstanding Balance", value: invoiceSummary.outstanding, sub: "Remaining on partially-invoiced orders", color: "text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/20" },
            ].map((t) => (
              <div key={t.label} className={cn("rounded-xl border px-4 py-3", t.color)}>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{t.label}</p>
                <p className="text-2xl font-black tabular-nums mt-1">{gbp(t.value)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Packing list — with / without Proof of Delivery */}
      <Dialog open={!!packingFor} onOpenChange={(o) => !o && setPackingFor(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Generate Packing List</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {packingFor?.orderNumber} · include the Proof of Delivery section?
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="rounded-xl gap-1.5 border-border/40" onClick={() => openPackingList(false)}>
              Without Proof of Delivery
            </Button>
            <Button className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold" onClick={() => openPackingList(true)}>
              <ClipboardList className="h-4 w-4" /> With Proof of Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partial invoice */}
      <PartialInvoiceDialog
        order={partialFor}
        onClose={() => setPartialFor(null)}
        onCreated={() => { refresh().catch(() => {}); }}
      />

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Order?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">This cannot be undone.</p>
              </div>
            </div>
          </DialogHeader>
          {toDelete && (
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
              <p className="text-sm font-semibold font-mono">{toDelete.orderNumber}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {toDelete.client?.name || "No client"} · £{(toDelete.total || 0).toLocaleString()}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
