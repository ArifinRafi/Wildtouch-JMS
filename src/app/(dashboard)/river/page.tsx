"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Waves,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  SplitSquareHorizontal,
  CheckCircle2,
  AlertTriangle,
  Package,
  PackageCheck,
  Clock,
  Save,
  X,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/hooks/use-role";
import { useRiver, type RiverOrder, type NewRiverOrder } from "@/lib/hooks/use-river";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-muted text-muted-foreground border-border/40",
  partial: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
  complete: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
};

const cellInput = "h-7 w-full min-w-0 rounded-md border border-border/40 bg-muted/30 px-1.5 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function RiverPage() {
  const { orders, loading, addOrder, updateOrder, deleteOrder, receive } = useRiver();
  const { isAdmin } = useRole();

  const [search, setSearch] = useState("");
  const [designs, setDesigns] = useState<{ id: string; name: string; riverAcknowledged: boolean }[]>([]);
  const [ndOpen, setNdOpen] = useState(false);

  // Completed designs from the Design Tracker — orderable components.
  useEffect(() => {
    let on = true;
    fetch("/api/designs?completed=true").then((r) => (r.ok ? r.json() : [])).then((d) => on && setDesigns(d)).catch(() => {});
    return () => { on = false; };
  }, []);

  // "New Design" notifications: completed designs not yet ordered or dismissed.
  const newDesigns = useMemo(() => designs.filter((d) => !d.riverAcknowledged), [designs]);

  const acknowledge = useCallback((id: string) => {
    setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, riverAcknowledged: true } : d)));
    fetch(`/api/designs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ riverAcknowledged: true }) }).catch(() => {});
  }, []);

  // Row-level inline editing (one row at a time).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<RiverOrder>>({});
  const [saving, setSaving] = useState(false);

  const [partialFor, setPartialFor] = useState<RiverOrder | null>(null);
  const [partialQty, setPartialQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [completeFor, setCompleteFor] = useState<RiverOrder | null>(null);
  const [toDelete, setToDelete] = useState<RiverOrder | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) || o.description.toLowerCase().includes(q));
  }, [orders, search]);

  const stats = useMemo(() => {
    const totalReceived = orders.reduce((s, o) => s + o.quantityReceived, 0);
    const outstanding = orders.reduce((s, o) => s + o.outstanding, 0);
    const valueGbp = orders.reduce((s, o) => s + o.valueGbp, 0);
    return { count: orders.length, totalReceived, outstanding, valueGbp };
  }, [orders]);

  const df = (k: keyof RiverOrder, v: string | number) => setDraft((p) => ({ ...p, [k]: v }));
  const startEdit = (o: RiverOrder) => { setDraft({ ...o }); setEditingId(o.id); };

  const addRow = useCallback(async () => {
    try {
      const created = await addOrder({});
      setNewRowId(created.id);
      setDraft({ ...created });
      setEditingId(created.id);
    } catch { /* ignore */ }
  }, [addOrder]);

  // "Order it" from a New Design notification → pre-filled River row in edit mode.
  const orderDesign = useCallback(async (d: { id: string; name: string }) => {
    setNdOpen(false);
    acknowledge(d.id);
    try {
      const created = await addOrder({ product: d.name });
      setNewRowId(created.id);
      setDraft({ ...created });
      setEditingId(created.id);
    } catch { /* ignore */ }
  }, [addOrder, acknowledge]);

  const cancelEdit = useCallback(async () => {
    if (editingId && editingId === newRowId) { try { await deleteOrder(editingId); } catch { /* ignore */ } }
    setEditingId(null); setNewRowId(null); setDraft({});
  }, [editingId, newRowId, deleteOrder]);

  const saveRow = useCallback(async () => {
    if (!editingId) return;
    setSaving(true);
    const num = (v: unknown) => Math.max(0, Number(v) || 0);
    const payload: NewRiverOrder = {
      orderNumber: String(draft.orderNumber ?? "").trim(), date: String(draft.date ?? ""),
      product: String(draft.product ?? "").trim(), description: String(draft.description ?? "").trim(),
      quantity: num(draft.quantity), valueGbp: num(draft.valueGbp), valueRmb: num(draft.valueRmb),
      priority: String(draft.priority ?? "").trim(),
      notesLog: (draft.notesLog ?? []).map((n) => ({ date: String(n?.date ?? ""), note: String(n?.note ?? "") })),
      dateRequested: String(draft.dateRequested ?? ""), datePaid: String(draft.datePaid ?? ""),
    };
    try { await updateOrder(editingId, payload); setEditingId(null); setNewRowId(null); setDraft({}); }
    catch { /* ignore */ } finally { setSaving(false); }
  }, [editingId, draft, updateOrder]);

  const doPartial = useCallback(async () => {
    if (!partialFor) return;
    const qty = Math.max(0, parseInt(partialQty, 10) || 0);
    if (qty <= 0) return;
    setBusy(true);
    try { await receive(partialFor.id, qty); setPartialFor(null); setPartialQty(""); }
    catch { /* ignore */ } finally { setBusy(false); }
  }, [partialFor, partialQty, receive]);

  const doComplete = useCallback(async () => {
    if (!completeFor || completeFor.outstanding <= 0) { setCompleteFor(null); return; }
    setBusy(true);
    try { await receive(completeFor.id, completeFor.outstanding); setCompleteFor(null); }
    catch { /* ignore */ } finally { setBusy(false); }
  }, [completeFor, receive]);

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await deleteOrder(toDelete.id); } catch { /* ignore */ }
    setToDelete(null);
  }, [toDelete, deleteOrder]);

  const COLS = ["Order #", "Date", "Component", "Description", "Qty", "£", "¥", "Priority", "Notes", "Requested", "Paid", "Done", "Left", "Status", ""];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <Waves className="h-7 w-7 text-primary" /> River
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            New components ordered from vendor <span className="font-semibold text-primary">River</span> · completing adds them to your inventory
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={addRow} disabled={!!editingId} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-lg shadow-primary/20 disabled:opacity-50">
            <Plus className="h-4 w-4" /> New River Order
          </Button>
        </motion.div>
      </motion.div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: Package, label: "Orders", value: stats.count, color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Clock, label: "Outstanding", value: stats.outstanding, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { icon: PackageCheck, label: "Completed", value: stats.totalReceived, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: Waves, label: "Value (£)", value: `£${stats.valueGbp.toLocaleString()}`, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
        ].map((chip) => (
          <div key={chip.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}>
            <chip.icon className="h-4 w-4" /> {chip.label}: {typeof chip.value === "number" ? chip.value.toLocaleString() : chip.value}
          </div>
        ))}

        {/* New Design notification */}
        <DropdownMenu open={ndOpen} onOpenChange={setNdOpen}>
          <DropdownMenuTrigger className="relative flex items-center gap-2 rounded-xl border border-pink-500/20 bg-pink-500/10 px-4 py-2 text-sm font-semibold text-pink-600 dark:text-pink-400 hover:bg-pink-500/15 transition-colors focus-visible:outline-none">
            <Sparkles className="h-4 w-4" /> New Design
            {newDesigns.length > 0 && (
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 px-1.5 text-[11px] font-bold text-white shadow-sm">{newDesigns.length}</span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">New designs to order</div>
            {newDesigns.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">No new designs waiting. Completed designs from the Design Tracker show up here.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {newDesigns.map((d) => (
                  <div key={d.id} className="px-3 py-2.5 border-b border-border/15 last:border-b-0">
                    <p className="text-sm"><span className="font-semibold">{d.name || "Untitled design"}</span> has been added. Order it?</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => orderDesign(d)} className="flex-1 rounded-lg bg-primary/90 hover:bg-primary text-white text-xs font-semibold py-1.5">Order it</button>
                      <button onClick={() => acknowledge(d.id)} className="rounded-lg border border-border/40 hover:bg-accent/40 text-xs font-medium px-3 py-1.5">Not now</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input placeholder="Search order #, component…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl bg-card/70 glass border-border/40" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading River orders…</span></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4"><Waves className="h-7 w-7 text-primary" /></div>
            <p className="text-base font-semibold">No River orders yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">Add a row — it opens editable. Fill it in like a spreadsheet, then Save. Completing adds the component to inventory.</p>
            <Button onClick={addRow} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold"><Plus className="h-4 w-4" /> New River Order</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                {[7, 7, 10, 8, 5, 5, 5, 7, 11, 7, 7, 4, 4, 5, 8].map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
              </colgroup>
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  {COLS.map((h, i) => <th key={i} className={cn("px-1.5 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", ["Qty", "£", "¥", "Done", "Left"].includes(h) ? "text-right" : "text-left")}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((o) => {
                    const editing = editingId === o.id;
                    const v = editing ? draft : o;
                    return (
                      <motion.tr key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={cn("border-b border-border/15 last:border-b-0 hover:bg-accent/10 align-top", editing && "bg-primary/[0.04]")}>
                        {/* Order # */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? <input value={String(v.orderNumber ?? "")} onChange={(e) => df("orderNumber", e.target.value)} placeholder="#" className={cn(cellInput, "font-mono")} />
                            : <span className="text-[11px] font-mono font-semibold break-words">{o.orderNumber || "—"}</span>}
                        </td>
                        {/* Date */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? <input type="date" value={String(v.date ?? "")} onChange={(e) => df("date", e.target.value)} className={cellInput} />
                            : <span className="text-[10px] text-muted-foreground break-words">{o.date || "—"}</span>}
                        </td>
                        {/* Component */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? <ComponentCombo value={String(v.product ?? "")} designs={designs} onChange={(val) => df("product", val)} />
                            : <span className="text-[11px] font-medium break-words">{o.product || "—"}</span>}
                        </td>
                        {/* Description */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? <input value={String(v.description ?? "")} onChange={(e) => df("description", e.target.value)} className={cellInput} />
                            : <span className="text-[10px] text-muted-foreground break-words line-clamp-3">{o.description || "—"}</span>}
                        </td>
                        {/* Qty */}
                        <td className="px-1.5 py-2 align-top text-right">
                          {editing ? <input value={String(v.quantity ?? 0)} onChange={(e) => df("quantity", parseInt(e.target.value.replace(/\D/g, ""), 10) || 0)} className={cn(cellInput, "text-right")} />
                            : <span className="text-[11px] tabular-nums font-medium">{o.quantity.toLocaleString()}</span>}
                        </td>
                        {/* £ GBP */}
                        <td className="px-1.5 py-2 align-top text-right">
                          {editing ? <input value={String(v.valueGbp ?? 0)} onChange={(e) => df("valueGbp", parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)} className={cn(cellInput, "text-right")} />
                            : <span className="text-[11px] tabular-nums font-semibold">£{o.valueGbp.toLocaleString()}</span>}
                        </td>
                        {/* ¥ RMB */}
                        <td className="px-1.5 py-2 align-top text-right">
                          {editing ? <input value={String(v.valueRmb ?? 0)} onChange={(e) => df("valueRmb", parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0)} className={cn(cellInput, "text-right")} />
                            : <span className="text-[10px] text-muted-foreground tabular-nums">{o.valueRmb > 0 ? `¥${o.valueRmb.toLocaleString()}` : "—"}</span>}
                        </td>
                        {/* Priority */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? <input value={String(v.priority ?? "")} onChange={(e) => df("priority", e.target.value)} className={cellInput} />
                            : <span className="text-[10px] text-muted-foreground line-clamp-3 break-words">{o.priority || "—"}</span>}
                        </td>
                        {/* Notes */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? (
                            <NotesLogEditor value={v.notesLog ?? []} onChange={(next) => setDraft((p) => ({ ...p, notesLog: next }))} />
                          ) : o.notesLog.length ? (
                            <div className="space-y-1">
                              {o.notesLog.map((n, i) => (
                                <p key={i} className="text-[10px] text-muted-foreground break-words"><span className="font-semibold text-foreground/70">{n.date || "—"}</span> — {n.note}</p>
                              ))}
                            </div>
                          ) : <span className="text-[10px] text-muted-foreground/40">—</span>}
                        </td>
                        {/* Requested */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? <input type="date" value={String(v.dateRequested ?? "")} onChange={(e) => df("dateRequested", e.target.value)} className={cellInput} />
                            : <span className="text-[10px] text-muted-foreground break-words">{o.dateRequested || "—"}</span>}
                        </td>
                        {/* Paid */}
                        <td className="px-1.5 py-2 align-top">
                          {editing ? <input type="date" value={String(v.datePaid ?? "")} onChange={(e) => df("datePaid", e.target.value)} className={cellInput} />
                            : <span className="text-[10px] text-muted-foreground break-words">{o.datePaid || "—"}</span>}
                        </td>
                        {/* Done */}
                        <td className="px-1.5 py-2 align-top text-right text-[11px] tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">{o.quantityReceived.toLocaleString()}</td>
                        {/* Left */}
                        <td className="px-1.5 py-2 align-top text-right text-[11px] tabular-nums">{o.outstanding.toLocaleString()}</td>
                        {/* Status */}
                        <td className="px-1.5 py-2 align-top"><Badge variant="outline" className={cn("text-[9px] px-1.5 font-semibold capitalize", STATUS_STYLE[o.status])}>{o.status}</Badge></td>
                        <td className="px-1.5 py-2 align-top">
                          <div className="grid grid-cols-2 gap-1.5 w-max ml-auto">
                            {editing ? (
                              <>
                                <button onClick={saveRow} disabled={saving} title="Save" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 disabled:opacity-50"><Save className="h-3.5 w-3.5" /></button>
                                <button onClick={cancelEdit} title="Cancel" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/40 border border-border/40"><X className="h-3.5 w-3.5" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => setCompleteFor(o)} title="Complete" disabled={o.status === "complete" || !!editingId} className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 disabled:opacity-30"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => { setPartialFor(o); setPartialQty(""); }} title="Partial completion" disabled={o.status === "complete" || !!editingId} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 disabled:opacity-30"><SplitSquareHorizontal className="h-3.5 w-3.5" /></button>
                                <button onClick={() => startEdit(o)} title="Edit" disabled={!!editingId} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 disabled:opacity-40"><Pencil className="h-3.5 w-3.5" /></button>
                                {isAdmin && <button onClick={() => setToDelete(o)} title="Delete" disabled={!!editingId} className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>}
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Partial completion dialog ── */}
      <Dialog open={!!partialFor} onOpenChange={(o) => { if (!o) { setPartialFor(null); setPartialQty(""); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2"><SplitSquareHorizontal className="h-4 w-4 text-blue-600" /> Partial completion</DialogTitle>
          </DialogHeader>
          {partialFor && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm">
                <p className="font-semibold">{partialFor.product || partialFor.description || partialFor.orderNumber}</p>
                <p className="text-xs text-muted-foreground mt-1">Ordered {partialFor.quantity.toLocaleString()} · completed {partialFor.quantityReceived.toLocaleString()} · <span className="font-semibold text-amber-600 dark:text-amber-400">{partialFor.outstanding.toLocaleString()} left</span></p>
              </div>
              <Field label="Quantity completed now">
                <Input type="text" inputMode="numeric" value={partialQty} onChange={(e) => setPartialQty(e.target.value.replace(/\D/g, ""))} autoFocus className="rounded-xl bg-muted/30 border-border/40" />
              </Field>
              <p className="text-[11px] text-muted-foreground">This quantity is added to <span className="font-semibold text-primary">{partialFor.componentLabel || partialFor.product || partialFor.description || "this component"}</span> in your inventory and deducted from the River order.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => { setPartialFor(null); setPartialQty(""); }}>Cancel</Button>
            <Button onClick={doPartial} disabled={busy || !(parseInt(partialQty, 10) > 0)} className="rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-600/90 text-white font-semibold disabled:opacity-50"><SplitSquareHorizontal className="h-4 w-4" /> {busy ? "Saving…" : "Add to inventory"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Complete confirm dialog ── */}
      <Dialog open={!!completeFor} onOpenChange={(o) => !o && setCompleteFor(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Complete order</DialogTitle>
          </DialogHeader>
          {completeFor && (
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm">
              <p className="font-semibold">{completeFor.product || completeFor.description || completeFor.orderNumber}</p>
              <p className="text-xs text-muted-foreground mt-1">This adds the remaining <span className="font-semibold text-emerald-600 dark:text-emerald-400">{completeFor.outstanding.toLocaleString()}</span> to your inventory as this component and marks the order complete.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" className="rounded-xl" onClick={() => setCompleteFor(null)}>Cancel</Button>
            <Button onClick={doComplete} disabled={busy || !completeFor || completeFor.outstanding <= 0} className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-600/90 text-white font-semibold disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> {busy ? "Saving…" : "Complete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ── */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0"><AlertTriangle className="h-5 w-5" /></div>
              <div><DialogTitle className="text-base font-bold">Delete River order?</DialogTitle><p className="text-xs text-muted-foreground mt-1">This cannot be undone. Inventory already added stays.</p></div>
            </div>
          </DialogHeader>
          {toDelete && <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3"><p className="text-sm font-semibold font-mono">{toDelete.orderNumber || "—"}</p><p className="text-[11px] text-muted-foreground mt-1">{toDelete.product} · {toDelete.description}</p></div>}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/** Dated progress log: pick a date, write a note, add multiple entries. */
function NotesLogEditor({ value, onChange }: { value: { date: string; note: string }[]; onChange: (next: { date: string; note: string }[]) => void }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const add = () => {
    if (!date && !note.trim()) return;
    onChange([...(value ?? []), { date, note: note.trim() }]);
    setDate(""); setNote("");
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const noteField = "h-7 rounded-md border border-border/40 bg-muted/30 px-2 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
  return (
    <div className="space-y-1.5">
      {value.map((n, i) => (
        <div key={i} className="flex items-start gap-1.5 rounded-md bg-muted/40 border border-border/30 px-2 py-1">
          <span className="text-[10px] font-semibold text-primary shrink-0 whitespace-nowrap">{n.date || "—"}</span>
          <span className="text-[11px] flex-1 min-w-0 break-words">{n.note}</span>
          <button type="button" onClick={() => remove(i)} title="Remove" className="text-muted-foreground/60 hover:text-destructive shrink-0"><X className="h-3 w-3" /></button>
        </div>
      ))}
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(noteField, "w-full")} />
      <div className="flex items-center gap-1">
        <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Note…" className={cn(noteField, "flex-1 min-w-0")} />
        <button type="button" onClick={add} className="h-7 shrink-0 rounded-md bg-primary/10 px-2 text-[11px] font-semibold text-primary border border-primary/20 hover:bg-primary/20">Add</button>
      </div>
    </div>
  );
}

/** Component field: type a name freely, or search + pick a completed design. */
function ComponentCombo({ value, designs, onChange }: { value: string; designs: { id: string; name: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? designs.filter((d) => d.name.toLowerCase().includes(q)) : designs;
    return list.slice(0, 8);
  }, [value, designs]);

  return (
    <div className="relative">
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Component name / search designs…" className={cellInput} />
      {open && matches.length > 0 && (
        <div className="absolute z-30 mt-1 w-full min-w-[200px] rounded-xl border border-border/40 bg-popover shadow-xl max-h-52 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Completed designs</p>
          {matches.map((d) => (
            <button key={d.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(d.name); setOpen(false); }}
              className="flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-accent/40 border-b border-border/10 last:border-b-0">
              <span className="truncate">{d.name || "Untitled design"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
