"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, Loader2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";
import { useRole } from "@/lib/hooks/use-role";

interface WastageEntry {
  id: string;
  date: string;
  staffId: string;
  staffName: string;
  clientId: string;
  clientName: string;
  orderNumber: string;
  productGroupId: string;
  productGroupName: string;
  wasteQuantity: number;
  note: string;
  costItems: Array<{ description: string; amount: number }>;
  currency: SupportedCurrency;
  totalCost: number;
}

interface Choice { id: string; name: string }
interface OrderChoice { id: string; orderNumber: string; client: { clientId?: string; name?: string } }
interface CostDraft { description: string; amount: string }
interface WastageDraft {
  date: string;
  staffId: string;
  clientId: string;
  orderNumber: string;
  productGroupId: string;
  wasteQuantity: string;
  note: string;
  currency: SupportedCurrency;
  costItems: CostDraft[];
}

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function blankDraft(): WastageDraft {
  return { date: todayLocal(), staffId: "", clientId: "", orderNumber: "", productGroupId: "", wasteQuantity: "1", note: "", currency: "GBP", costItems: [{ description: "", amount: "" }] };
}

const fieldClass = "h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1.5 block text-xs font-semibold text-muted-foreground";

export default function WastagePage() {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const [entries, setEntries] = useState<WastageEntry[]>([]);
  const [staff, setStaff] = useState<Choice[]>([]);
  const [clients, setClients] = useState<Choice[]>([]);
  const [groups, setGroups] = useState<Choice[]>([]);
  const [orders, setOrders] = useState<OrderChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<WastageDraft>(blankDraft);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const responses = await Promise.all(["/api/wastage", "/api/employees", "/api/clients", "/api/product-groups", "/api/orders"].map((url) => fetch(url)));
        if (responses.some((response) => !response.ok)) throw new Error("Could not load wastage log or selection lists");
        const [logs, employees, clientList, productGroups, orderList] = await Promise.all(responses.map((response) => response.json()));
        if (!active) return;
        setEntries(logs); setStaff(employees); setClients(clientList); setGroups(productGroups); setOrders(orderList);
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Could not load wastage log"); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) =>
      (!dateFilter || entry.date === dateFilter) &&
      (!staffFilter || entry.staffId === staffFilter) &&
      (!query || [entry.staffName, entry.staffId, entry.clientName, entry.orderNumber, entry.productGroupName, entry.note, ...entry.costItems.map((item) => item.description)].some((value) => value.toLowerCase().includes(query))),
    );
  }, [entries, search, dateFilter, staffFilter]);
  const ordersForClient = useMemo(() => orders.filter((order) => order.client?.clientId === draft.clientId), [orders, draft.clientId]);
  const draftTotal = draft.costItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totals = filtered.reduce<Record<SupportedCurrency, number>>((sum, entry) => { sum[entry.currency] += entry.totalCost; return sum; }, { GBP: 0, EUR: 0 });

  const openNew = () => { setEditingId(null); setDraft(blankDraft()); setFormError(""); setDialogOpen(true); };
  const openEdit = (entry: WastageEntry) => {
    setEditingId(entry.id);
    setDraft({ date: entry.date, staffId: entry.staffId, clientId: entry.clientId, orderNumber: entry.orderNumber, productGroupId: entry.productGroupId, wasteQuantity: String(entry.wasteQuantity), note: entry.note, currency: entry.currency, costItems: entry.costItems.map((item) => ({ description: item.description, amount: String(item.amount) })) });
    setFormError(""); setDialogOpen(true);
  };
  const setCost = (index: number, patch: Partial<CostDraft>) => setDraft((current) => ({ ...current, costItems: current.costItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));

  const save = async () => {
    if (!isAdmin || saving) return;
    setSaving(true); setFormError("");
    try {
      const response = await fetch(editingId ? `/api/wastage/${editingId}` : "/api/wastage", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, wasteQuantity: draft.wasteQuantity, costItems: draft.costItems }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "Could not save wastage entry");
      setEntries((current) => editingId ? current.map((entry) => entry.id === editingId ? saved : entry) : [saved, ...current]);
      setDialogOpen(false);
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : "Could not save wastage entry"); }
    finally { setSaving(false); }
  };

  const remove = async (entry: WastageEntry) => {
    if (!isAdmin || !window.confirm(`Delete wastage entry for ${entry.orderNumber}? This cannot be undone.`)) return;
    setDeletingId(entry.id); setError("");
    try {
      const response = await fetch(`/api/wastage/${entry.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "Could not delete wastage entry");
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete wastage entry"); }
    finally { setDeletingId(null); }
  };

  return <div className="space-y-6 pb-12">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="flex items-center gap-3 text-3xl font-bold"><ClipboardList className="h-7 w-7 text-primary" /> Wastage Log</h1><p className="mt-1 text-sm text-muted-foreground">Record wasted units and the cost to the business by staff, client, order and date.</p></div>
      {!roleLoading && isAdmin && <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add wastage</Button>}
    </div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/40 bg-card/70 p-4">
      <div className="min-w-[220px] flex-1"><label htmlFor="wastage-search" className={labelClass}>Search</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input id="wastage-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Staff, client, order, group or note" className={`${fieldClass} pl-9`} /></div></div>
      <div><label htmlFor="wastage-date-filter" className={labelClass}>Date</label><input id="wastage-date-filter" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className={fieldClass} /></div>
      <div className="min-w-[180px]"><label htmlFor="wastage-staff-filter" className={labelClass}>Staff</label><select id="wastage-staff-filter" value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} className={fieldClass}><option value="">All staff</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name} ({person.id})</option>)}</select></div>
    </div>
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span>{filtered.length} record{filtered.length === 1 ? "" : "s"}</span><span>{filtered.reduce((sum, entry) => sum + entry.wasteQuantity, 0)} units wasted</span>{(["GBP", "EUR"] as const).filter((currency) => totals[currency] > 0).map((currency) => <span key={currency}>Cost: <strong className="text-foreground">{formatCurrency(totals[currency], currency)}</strong></span>)}</div>
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/70">
      {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading wastage…</div> : filtered.length === 0 ? <p className="py-20 text-center text-sm text-muted-foreground">No wastage entries match your filters.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1120px] border-collapse text-sm"><thead><tr className="border-b border-border/30 bg-muted/20 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Staff / ID</th><th className="px-4 py-3">Client / Order</th><th className="px-4 py-3">Product group</th><th className="px-4 py-3 text-right">Waste units</th><th className="px-4 py-3">Note</th><th className="px-4 py-3">Cost to business</th>{!roleLoading && isAdmin && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead><tbody>{filtered.map((entry) => <tr key={entry.id} className="border-b border-border/20 align-top last:border-b-0 hover:bg-accent/20"><td className="whitespace-nowrap px-4 py-4">{new Date(`${entry.date}T12:00:00`).toLocaleDateString("en-GB")}</td><td className="px-4 py-4"><span className="font-medium">{entry.staffName}</span><span className="block text-xs text-muted-foreground">{entry.staffId}</span></td><td className="px-4 py-4"><span className="font-medium">{entry.clientName}</span><span className="block font-mono text-xs text-muted-foreground">{entry.orderNumber}</span></td><td className="px-4 py-4">{entry.productGroupName}</td><td className="px-4 py-4 text-right font-semibold tabular-nums">{entry.wasteQuantity}</td><td className="max-w-[250px] whitespace-pre-wrap px-4 py-4 text-xs text-muted-foreground">{entry.note || "—"}</td><td className="px-4 py-4"><strong>{formatCurrency(entry.totalCost, entry.currency)}</strong><div className="mt-1 space-y-0.5 text-xs text-muted-foreground">{entry.costItems.map((item, index) => <p key={index}>{item.description}: {formatCurrency(item.amount, entry.currency)}</p>)}</div></td>{!roleLoading && isAdmin && <td className="whitespace-nowrap px-4 py-4 text-right"><button type="button" onClick={() => openEdit(entry)} aria-label={`Edit ${entry.orderNumber} wastage`} className="mr-2 rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void remove(entry)} disabled={deletingId === entry.id} aria-label={`Delete ${entry.orderNumber} wastage`} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50">{deletingId === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></td>}</tr>)}</tbody></table></div>}
    </div>

    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !saving) setDialogOpen(false); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editingId ? "Edit wastage entry" : "Add wastage entry"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="wastage-date" className={labelClass}>Date *</label><input id="wastage-date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className={fieldClass} /></div>
        <div><label htmlFor="wastage-staff" className={labelClass}>Staff name / ID *</label><select id="wastage-staff" value={draft.staffId} onChange={(event) => setDraft({ ...draft, staffId: event.target.value })} className={fieldClass}><option value="">Select staff</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.name} ({person.id})</option>)}</select></div>
        <div><label htmlFor="wastage-client" className={labelClass}>Client *</label><select id="wastage-client" value={draft.clientId} onChange={(event) => setDraft({ ...draft, clientId: event.target.value, orderNumber: "" })} className={fieldClass}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} ({client.id})</option>)}</select></div>
        <div><label htmlFor="wastage-order" className={labelClass}>Client order number *</label><select id="wastage-order" value={draft.orderNumber} onChange={(event) => setDraft({ ...draft, orderNumber: event.target.value })} disabled={!draft.clientId} className={fieldClass}><option value="">{draft.clientId ? "Select order" : "Choose a client first"}</option>{ordersForClient.map((order) => <option key={order.id} value={order.orderNumber}>{order.orderNumber}</option>)}</select></div>
        <div><label htmlFor="wastage-group" className={labelClass}>Product group *</label><select id="wastage-group" value={draft.productGroupId} onChange={(event) => setDraft({ ...draft, productGroupId: event.target.value })} className={fieldClass}><option value="">Select product group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
        <div><label htmlFor="wastage-quantity" className={labelClass}>Waste amount (units) *</label><input id="wastage-quantity" type="number" min="1" step="1" value={draft.wasteQuantity} onChange={(event) => setDraft({ ...draft, wasteQuantity: event.target.value })} className={fieldClass} /></div>
        <div className="sm:col-span-2"><label htmlFor="wastage-note" className={labelClass}>Note</label><textarea id="wastage-note" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} maxLength={5000} rows={3} className={`${fieldClass} h-auto py-2`} placeholder="What happened and why?" /></div>
      </div>
      <div className="space-y-3 border-t border-border/40 pt-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Cost to business</h3><select aria-label="Cost currency" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as SupportedCurrency })} className="rounded-lg border border-border/60 bg-background px-2 py-1 text-xs"><option value="GBP">GBP (£)</option><option value="EUR">EUR (€)</option></select></div>
        {draft.costItems.map((item, index) => <div key={index} className="flex items-end gap-2"><div className="flex-1"><label htmlFor={`cost-description-${index}`} className={labelClass}>Description *</label><input id={`cost-description-${index}`} value={item.description} onChange={(event) => setCost(index, { description: event.target.value })} maxLength={200} placeholder="e.g. damaged product" className={fieldClass} /></div><div className="w-32"><label htmlFor={`cost-amount-${index}`} className={labelClass}>Amount *</label><input id={`cost-amount-${index}`} type="number" min="0" step="0.01" value={item.amount} onChange={(event) => setCost(index, { amount: event.target.value })} className={fieldClass} /></div><button type="button" aria-label={`Remove cost item ${index + 1}`} disabled={draft.costItems.length === 1} onClick={() => setDraft((current) => ({ ...current, costItems: current.costItems.filter((_, itemIndex) => itemIndex !== index) }))} className="mb-1 rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}
        <div className="flex items-center justify-between"><Button type="button" variant="outline" size="sm" disabled={draft.costItems.length >= 30} onClick={() => setDraft((current) => ({ ...current, costItems: [...current.costItems, { description: "", amount: "" }] }))}><Plus className="mr-1 h-3.5 w-3.5" /> Add cost</Button><p className="text-sm font-bold">Total: {formatCurrency(draftTotal, draft.currency)}</p></div>
      </div>
      {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
      <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save changes" : "Add wastage"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
