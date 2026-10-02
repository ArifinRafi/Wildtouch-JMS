"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CalendarDays, Loader2, Pencil, Plus, Search, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";
import { useRole } from "@/lib/hooks/use-role";

interface Supplier {
  name: string;
  contactName: string;
  address: string;
  email: string;
  telephone: string;
}

interface CostRecord {
  id: string;
  date: string;
  productService: string;
  supplier: Supplier;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: SupportedCurrency;
  note: string;
  paid: boolean;
  paymentDate: string;
}

interface CostDraft extends Omit<CostRecord, "id" | "quantity" | "unitPrice" | "totalPrice"> {
  quantity: string;
  unitPrice: string;
}

type ViewTab = "all" | "outstanding" | "completed";
const fieldClass = "h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1.5 block text-xs font-semibold text-muted-foreground";

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function blankDraft(): CostDraft {
  return {
    date: todayLocal(), productService: "", supplier: { name: "", contactName: "", address: "", email: "", telephone: "" },
    quantity: "1", unitPrice: "", currency: "GBP", note: "", paid: false, paymentDate: "",
  };
}

function dateLabel(value: string) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function sortRecords(records: CostRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}

export default function BusinessCostsPage() {
  const { canWrite, isLoading: roleLoading } = useRole();
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ViewTab>("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CostDraft>(blankDraft);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/business-costs", { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw new Error("Could not load costs of business"); return response.json(); })
      .then((data: CostRecord[]) => { if (active) setRecords(data); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Could not load costs"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) =>
      (tab === "all" || (tab === "completed" ? record.paid : !record.paid)) &&
      (!startDate || record.date >= startDate) && (!endDate || record.date <= endDate) &&
      (!query || [record.productService, record.supplier.name, record.supplier.contactName, record.supplier.email, record.supplier.telephone, record.note].some((value) => value.toLowerCase().includes(query))),
    );
  }, [records, tab, search, startDate, endDate]);
  const totals = filtered.reduce<Record<SupportedCurrency, number>>((sum, record) => { sum[record.currency] += record.totalPrice; return sum; }, { GBP: 0, EUR: 0 });
  const completedCount = records.filter((record) => record.paid).length;
  const previewQuantity = Math.round(((Number(draft.quantity) || 0) + Number.EPSILON) * 1000) / 1000;
  const previewUnitPrice = Math.round(((Number(draft.unitPrice) || 0) + Number.EPSILON) * 100) / 100;
  const draftTotal = Math.round((previewQuantity * previewUnitPrice + Number.EPSILON) * 100) / 100;

  const openNew = () => { setEditingId(null); setDraft(blankDraft()); setFormError(""); setDialogOpen(true); };
  const openEdit = (record: CostRecord, markPaid = false) => {
    setEditingId(record.id);
    setDraft({
      date: record.date, productService: record.productService, supplier: { ...record.supplier }, quantity: String(record.quantity),
      unitPrice: String(record.unitPrice), currency: record.currency, note: record.note,
      paid: markPaid || record.paid, paymentDate: markPaid && !record.paid ? todayLocal() : record.paymentDate,
    });
    setFormError(""); setDialogOpen(true);
  };
  const setSupplier = (field: keyof Supplier, value: string) => setDraft((current) => ({ ...current, supplier: { ...current.supplier, [field]: value } }));

  const save = async () => {
    if (!canWrite || saving) return;
    setSaving(true); setFormError("");
    try {
      const response = await fetch(editingId ? `/api/business-costs/${editingId}` : "/api/business-costs", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "Could not save cost");
      setRecords((current) => sortRecords(editingId ? current.map((record) => record.id === editingId ? saved : record) : [saved, ...current]));
      setDialogOpen(false);
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : "Could not save cost"); }
    finally { setSaving(false); }
  };

  const remove = async (record: CostRecord) => {
    if (!canWrite || !window.confirm(`Delete the ${record.productService} cost from ${dateLabel(record.date)}? This cannot be undone.`)) return;
    setDeletingId(record.id); setError("");
    try {
      const response = await fetch(`/api/business-costs/${record.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "Could not delete cost");
      setRecords((current) => current.filter((item) => item.id !== record.id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete cost"); }
    finally { setDeletingId(null); }
  };

  return <div className="space-y-6 pb-12">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="flex items-center gap-3 text-3xl font-bold"><Wallet className="h-7 w-7 text-primary" /> Costs of Business</h1><p className="mt-1 text-sm text-muted-foreground">Purchases and services needed to run the business, with supplier and payment details.</p></div>
      {!roleLoading && canWrite && <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Add cost</Button>}
    </div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-3" role="tablist" aria-label="Cost payment status">
      {([{ value: "all", label: `All (${records.length})` }, { value: "outstanding", label: `Outstanding (${records.length - completedCount})` }, { value: "completed", label: `Completed (${completedCount})` }] as const).map((item) => <button key={item.value} type="button" role="tab" aria-selected={tab === item.value} onClick={() => setTab(item.value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === item.value ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}
    </div>
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/40 bg-card/70 p-4">
      <div className="min-w-[230px] flex-1"><label htmlFor="cost-search" className={labelClass}>Search</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input id="cost-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Product, service, supplier or note" className={`${fieldClass} pl-9`} /></div></div>
      <div><label htmlFor="cost-start" className={labelClass}>From date</label><input id="cost-start" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className={fieldClass} /></div>
      <div><label htmlFor="cost-end" className={labelClass}>To date</label><input id="cost-end" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className={fieldClass} /></div>
      {(startDate || endDate) && <Button variant="outline" size="sm" onClick={() => { setStartDate(""); setEndDate(""); }}>Clear dates</Button>}
    </div>
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span>{filtered.length} cost{filtered.length === 1 ? "" : "s"}</span>{(["GBP", "EUR"] as const).map((currency) => <span key={currency}>{currency} total: <strong className="text-foreground">{formatCurrency(totals[currency], currency)}</strong></span>)}</div>
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/70">
      {loading ? <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading costs…</div> : filtered.length === 0 ? <p className="py-20 text-center text-sm text-muted-foreground">No costs match this view or date range.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1220px] border-collapse text-sm"><thead><tr className="border-b border-border/30 bg-muted/20 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Product / service</th><th className="px-4 py-3">Supplier &amp; contact</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Unit price</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Note</th><th className="px-4 py-3">Payment</th>{!roleLoading && canWrite && <th className="px-4 py-3 text-right">Actions</th>}</tr></thead><tbody>{filtered.map((record) => <tr key={record.id} className="border-b border-border/20 align-top last:border-b-0 hover:bg-accent/20"><td className="whitespace-nowrap px-4 py-4">{dateLabel(record.date)}</td><td className="px-4 py-4 font-medium">{record.productService}</td><td className="max-w-[250px] px-4 py-4"><p className="font-medium">{record.supplier.name}</p>{record.supplier.contactName && <p className="text-xs">{record.supplier.contactName}</p>}{record.supplier.address && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{record.supplier.address}</p>}{record.supplier.email && <p className="break-all text-xs text-muted-foreground">{record.supplier.email}</p>}{record.supplier.telephone && <p className="text-xs text-muted-foreground">{record.supplier.telephone}</p>}</td><td className="px-4 py-4 text-right tabular-nums">{record.quantity}</td><td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{formatCurrency(record.unitPrice, record.currency)}</td><td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">{formatCurrency(record.totalPrice, record.currency)}</td><td className="max-w-[240px] whitespace-pre-wrap px-4 py-4 text-xs text-muted-foreground">{record.note || "—"}</td><td className="whitespace-nowrap px-4 py-4">{record.paid ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700"><Check className="h-3 w-3" /> Paid · {dateLabel(record.paymentDate)}</span> : <span className="text-xs text-amber-700">Outstanding</span>}</td>{!roleLoading && canWrite && <td className="whitespace-nowrap px-4 py-4 text-right">{!record.paid && <button type="button" onClick={() => openEdit(record, true)} aria-label={`Mark ${record.productService} paid`} title="Mark paid" className="mr-1 rounded-lg p-2 text-emerald-600 hover:bg-emerald-500/10"><Check className="h-4 w-4" /></button>}<button type="button" onClick={() => openEdit(record)} aria-label={`Edit ${record.productService}`} className="mr-1 rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void remove(record)} disabled={deletingId === record.id} aria-label={`Delete ${record.productService}`} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50">{deletingId === record.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></td>}</tr>)}</tbody></table></div>}
    </div>

    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !saving) setDialogOpen(false); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editingId ? "Edit business cost" : "Add business cost"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="cost-date" className={labelClass}>Date *</label><input id="cost-date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className={fieldClass} /></div>
        <div><label htmlFor="cost-product" className={labelClass}>Product / service *</label><input id="cost-product" value={draft.productService} onChange={(event) => setDraft({ ...draft, productService: event.target.value })} maxLength={300} placeholder="What was bought or provided?" className={fieldClass} /></div>
        <div><label htmlFor="cost-supplier" className={labelClass}>Supplier *</label><input id="cost-supplier" value={draft.supplier.name} onChange={(event) => setSupplier("name", event.target.value)} maxLength={200} className={fieldClass} /></div>
        <div><label htmlFor="cost-contact" className={labelClass}>Contact name</label><input id="cost-contact" value={draft.supplier.contactName} onChange={(event) => setSupplier("contactName", event.target.value)} maxLength={200} className={fieldClass} /></div>
        <div className="sm:col-span-2"><label htmlFor="cost-address" className={labelClass}>Supplier address</label><textarea id="cost-address" value={draft.supplier.address} onChange={(event) => setSupplier("address", event.target.value)} rows={2} maxLength={1000} className={`${fieldClass} h-auto py-2`} /></div>
        <div><label htmlFor="cost-email" className={labelClass}>Supplier email</label><input id="cost-email" type="email" value={draft.supplier.email} onChange={(event) => setSupplier("email", event.target.value)} maxLength={320} className={fieldClass} /></div>
        <div><label htmlFor="cost-telephone" className={labelClass}>Supplier telephone</label><input id="cost-telephone" type="tel" value={draft.supplier.telephone} onChange={(event) => setSupplier("telephone", event.target.value)} maxLength={100} className={fieldClass} /></div>
        <div><label htmlFor="cost-quantity" className={labelClass}>Quantity *</label><input id="cost-quantity" type="number" min="0.001" step="0.001" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} className={fieldClass} /></div>
        <div><label htmlFor="cost-unit-price" className={labelClass}>Unit price *</label><div className="flex gap-2"><input id="cost-unit-price" type="number" min="0" step="0.01" value={draft.unitPrice} onChange={(event) => setDraft({ ...draft, unitPrice: event.target.value })} className={fieldClass} /><select aria-label="Currency" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as SupportedCurrency })} className="rounded-xl border border-border/60 bg-background px-2 text-sm"><option value="GBP">GBP £</option><option value="EUR">EUR €</option></select></div></div>
        <div className="sm:col-span-2 flex justify-end rounded-xl bg-muted/30 px-4 py-3 text-sm font-bold">Total: {formatCurrency(draftTotal, draft.currency)}</div>
        <div className="sm:col-span-2"><label htmlFor="cost-note" className={labelClass}>Note</label><textarea id="cost-note" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} rows={3} maxLength={5000} className={`${fieldClass} h-auto py-2`} /></div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4 rounded-xl border border-border/50 px-4 py-3"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.paid} onChange={(event) => setDraft({ ...draft, paid: event.target.checked, paymentDate: event.target.checked ? draft.paymentDate || todayLocal() : "" })} className="h-4 w-4 accent-primary" /> Paid / completed</label><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><label htmlFor="cost-payment-date" className="text-xs font-semibold text-muted-foreground">Payment date</label><input id="cost-payment-date" type="date" disabled={!draft.paid} value={draft.paymentDate} onChange={(event) => setDraft({ ...draft, paymentDate: event.target.value })} className="rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm disabled:opacity-50" /></div></div>
      </div>
      {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
      <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save changes" : "Add cost"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}
