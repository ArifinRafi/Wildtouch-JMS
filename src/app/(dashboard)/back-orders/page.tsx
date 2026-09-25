"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  Edit3,
  ExternalLink,
  Loader2,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRole } from "@/lib/hooks/use-role";
import { ORDER_SOURCE_OPTIONS, orderSourceLabel, type OrderSource } from "@/lib/order-source";

interface BackOrderLine {
  code: string;
  description: string;
  category?: string;
  qtyOrdered: number;
}

interface BackOrder {
  id: string;
  backOrderNumber: string;
  deliveryDate: string;
  status: "scheduled" | "delivering" | "delivered";
  planogram: { id?: string; name?: string };
  client: { clientId?: string; name?: string };
  agent: { agentId?: string; name?: string };
  orderSource: OrderSource | "";
  lineItems: BackOrderLine[];
  poNumber: string;
  referenceNumber: string;
  notes: string;
  deliveredOrderId: string | null;
  deliveredOrderNumber: string;
  deliveredAt: string | null;
}

type EditDraft = Pick<BackOrder, "deliveryDate" | "orderSource" | "poNumber" | "referenceNumber" | "notes" | "lineItems">;

function dateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isAlerting(order: BackOrder): boolean {
  if (order.status !== "scheduled") return false;
  const now = new Date();
  const monthStart = new Date(`${order.deliveryDate.slice(0, 7)}-01T00:00:00`);
  return now >= monthStart;
}

export default function BackOrdersPage() {
  const router = useRouter();
  const { canWrite } = useRole();
  const [orders, setOrders] = useState<BackOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showDelivered, setShowDelivered] = useState(false);
  const [editing, setEditing] = useState<BackOrder | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/back-orders", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load back orders.");
      setOrders(await response.json());
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load back orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeAlerts = orders.filter(isAlerting);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!showDelivered && order.status === "delivered") return false;
      if (showDelivered && order.status !== "delivered") return false;
      if (!query) return true;
      return [order.backOrderNumber, order.client.name, order.client.clientId, order.agent.name, orderSourceLabel(order.orderSource), order.poNumber, order.referenceNumber]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [orders, search, showDelivered]);

  const openEdit = (order: BackOrder) => {
    setEditing(order);
    setEditDraft({
      deliveryDate: order.deliveryDate,
      orderSource: order.orderSource,
      poNumber: order.poNumber,
      referenceNumber: order.referenceNumber,
      notes: order.notes,
      lineItems: order.lineItems.map((line) => ({ ...line })),
    });
  };

  const saveEdit = async () => {
    if (!editing || !editDraft) return;
    setWorkingId(editing.id);
    setError("");
    try {
      const response = await fetch(`/api/back-orders/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not update back order.");
      setOrders((current) => current.map((order) => order.id === body.id ? body : order));
      window.dispatchEvent(new Event("back-orders-changed"));
      setEditing(null);
      setEditDraft(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update back order.");
    } finally {
      setWorkingId("");
    }
  };

  const remove = async (order: BackOrder) => {
    if (!window.confirm(`Delete ${order.backOrderNumber}? This cannot be undone.`)) return;
    setWorkingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/back-orders/${order.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not delete back order.");
      setOrders((current) => current.filter((item) => item.id !== order.id));
      window.dispatchEvent(new Event("back-orders-changed"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete back order.");
    } finally {
      setWorkingId("");
    }
  };

  const deliver = async (order: BackOrder) => {
    if (!window.confirm(`Mark ${order.backOrderNumber} delivered and create its normal order and invoice?`)) return;
    setWorkingId(order.id);
    setError("");
    try {
      const response = await fetch(`/api/back-orders/${order.id}/deliver`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not deliver back order.");
      window.dispatchEvent(new Event("back-orders-changed"));
      router.push(`/orders/${body.order.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not deliver back order.");
      setWorkingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Back Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Schedule future orders without checking or reserving inventory.</p>
        </div>
        {canWrite && (
          <Link href="/orders/new/planogram" className={buttonVariants({ className: "gap-2 rounded-xl" })}>
            <Plus className="h-4 w-4" /> Create Back Order
          </Link>
        )}
      </div>

      {activeAlerts.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-amber-900 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{activeAlerts.length} back order{activeAlerts.length === 1 ? "" : "s"} due this month or overdue</p>
            <p className="mt-1 text-xs opacity-80">Delivery reminders begin automatically on the first day of each scheduled delivery month.</p>
          </div>
        </div>
      )}

      {error && <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search number, client, agent, PO or reference…" className="rounded-xl pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant={!showDelivered ? "default" : "outline"} onClick={() => setShowDelivered(false)}>Scheduled</Button>
          <Button variant={showDelivered ? "default" : "outline"} onClick={() => setShowDelivered(true)}>Delivered</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading back orders…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
          <CalendarClock className="mx-auto h-9 w-9 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold">No {showDelivered ? "delivered" : "scheduled"} back orders</p>
          <p className="mt-1 text-xs text-muted-foreground">Back orders created in the order wizard appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((order, index) => {
            const units = order.lineItems.reduce((sum, line) => sum + line.qtyOrdered, 0);
            const alerting = isAlerting(order);
            const busy = workingId === order.id;
            return (
              <motion.article key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className={`rounded-2xl border bg-card/70 p-5 ${alerting ? "border-amber-500/40" : "border-border/40"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-mono text-sm font-bold">{order.backOrderNumber}</h2>
                      <Badge variant={order.status === "delivered" ? "secondary" : alerting ? "destructive" : "outline"}>
                        {order.status === "delivered" ? "Delivered" : alerting ? "Delivery alert" : "Scheduled"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-base font-semibold">{order.client.name || order.client.clientId || "Client"}</p>
                    <p className="text-xs text-muted-foreground">{order.planogram.name || "Planogram"} · {order.lineItems.length} lines · {units} units</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-3 py-2 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Delivery date</p>
                    <p className="mt-0.5 text-sm font-bold">{dateLabel(order.deliveryDate)}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border/30 bg-muted/10 p-3 text-xs">
                  <div><span className="text-muted-foreground">PO:</span> <span className="font-medium">{order.poNumber || "—"}</span></div>
                  <div><span className="text-muted-foreground">Reference:</span> <span className="font-medium">{order.referenceNumber || "—"}</span></div>
                  <div><span className="text-muted-foreground">Agent:</span> <span className="font-medium">{order.agent.name || "—"}</span></div>
                  <div><span className="text-muted-foreground">Client ID:</span> <span className="font-medium">{order.client.clientId || "—"}</span></div>
                  <div><span className="text-muted-foreground">Source:</span> <span className="font-medium">{orderSourceLabel(order.orderSource)}</span></div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {order.status === "delivered" && order.deliveredOrderId ? (
                    <Link href={`/orders/${order.deliveredOrderId}`} className={buttonVariants({ variant: "outline", className: "gap-1.5" })}>
                      {order.deliveredOrderNumber || "Open order"} <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : canWrite ? (
                    <>
                      <Button variant="outline" onClick={() => openEdit(order)} disabled={busy} className="gap-1.5"><Edit3 className="h-3.5 w-3.5" /> Edit</Button>
                      <Button variant="destructive" onClick={() => remove(order)} disabled={busy} className="gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                      <Button onClick={() => deliver(order)} disabled={busy} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />} Delivered
                      </Button>
                    </>
                  ) : null}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) { setEditing(null); setEditDraft(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editing?.backOrderNumber}</DialogTitle>
            <p className="text-xs text-muted-foreground">Change its delivery schedule, references, notes or quantities.</p>
          </DialogHeader>
          {editDraft && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Delivery date</Label><Input type="date" value={editDraft.deliveryDate} onChange={(event) => setEditDraft({ ...editDraft, deliveryDate: event.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Source of Order</Label>
                  <select value={editDraft.orderSource} onChange={(event) => setEditDraft({ ...editDraft, orderSource: event.target.value as OrderSource | "" })}
                    className="h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select source…</option>
                    {ORDER_SOURCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>PO number</Label><Input value={editDraft.poNumber} onChange={(event) => setEditDraft({ ...editDraft, poNumber: event.target.value })} /></div>
                <div className="space-y-1.5"><Label>Reference</Label><Input value={editDraft.referenceNumber} onChange={(event) => setEditDraft({ ...editDraft, referenceNumber: event.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Order quantities</Label>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border/40 p-3">
                  {editDraft.lineItems.map((line, index) => (
                    <div key={`${line.code}-${index}`} className="grid grid-cols-[1fr_100px] items-center gap-3">
                      <div className="min-w-0"><p className="truncate text-sm font-medium">{line.description}</p><p className="text-[10px] font-mono text-muted-foreground">{line.code || "No code"}</p></div>
                      <Input type="number" min={1} value={line.qtyOrdered} onChange={(event) => {
                        const lineItems = editDraft.lineItems.map((item, itemIndex) => itemIndex === index ? { ...item, qtyOrdered: Math.max(1, Number(event.target.value) || 1) } : item);
                        setEditDraft({ ...editDraft, lineItems });
                      }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5"><Label>Notes</Label><textarea rows={4} value={editDraft.notes} onChange={(event) => setEditDraft({ ...editDraft, notes: event.target.value })} className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(null); setEditDraft(null); }}>Cancel</Button>
            <Button onClick={saveEdit} disabled={!editDraft?.deliveryDate || !!workingId} className="gap-2">
              {workingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />} Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
