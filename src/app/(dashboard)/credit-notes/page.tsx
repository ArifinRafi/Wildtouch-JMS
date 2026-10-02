"use client";

import { useEffect, useMemo, useState } from "react";
import { FileMinus2, Loader2, Plus, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";
import { useRole } from "@/lib/hooks/use-role";

interface CreditApplication {
  invoiceId: string;
  invoiceNumber: string;
  orderNumber: string;
  amount: number;
  appliedAt: string;
}
interface CreditNoteRecord {
  id: string;
  creditNoteNumber: string;
  clientId: string;
  clientName: string;
  currency: SupportedCurrency;
  amount: number;
  remaining: number;
  reason: "return" | "not_delivered" | "other";
  note: string;
  date: string;
  status: "active" | "void";
  applications: CreditApplication[];
  createdBy: string;
}
interface ClientChoice { id: string; name: string }
interface Draft { clientId: string; currency: SupportedCurrency; amount: string; reason: CreditNoteRecord["reason"]; note: string; date: string }

const fieldClass = "h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30";
const labelClass = "mb-1.5 block text-xs font-semibold text-muted-foreground";
const reasons: Record<CreditNoteRecord["reason"], string> = { return: "Returned goods", not_delivered: "Not delivered", other: "Other" };

function todayLocal() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function blankDraft(): Draft { return { clientId: "", currency: "GBP", amount: "", reason: "return", note: "", date: todayLocal() }; }
function dateLabel(date: string) { return date ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB") : "—"; }

export default function CreditNotesPage() {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const [notes, setNotes] = useState<CreditNoteRecord[]>([]);
  const [clients, setClients] = useState<ClientChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "used" | "void">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [voidingId, setVoidingId] = useState<string | null>(null);

  useEffect(() => {
    if (roleLoading || !isAdmin) { if (!roleLoading) setLoading(false); return; }
    let active = true;
    Promise.all([fetch("/api/credit-notes", { cache: "no-store" }), fetch("/api/clients")])
      .then(async ([notesResponse, clientsResponse]) => {
        if (!notesResponse.ok || !clientsResponse.ok) throw new Error("Could not load credit notes");
        return Promise.all([notesResponse.json(), clientsResponse.json()]);
      })
      .then(([noteList, clientList]: [CreditNoteRecord[], ClientChoice[]]) => { if (active) { setNotes(noteList); setClients(clientList); } })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Could not load credit notes"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAdmin, roleLoading]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) =>
      (filter === "all" || (filter === "available" ? note.status === "active" && note.remaining > 0 : filter === "used" ? note.status === "active" && note.remaining === 0 : note.status === "void")) &&
      (!query || [note.clientName, note.clientId, note.creditNoteNumber, note.note].some((value) => value.toLowerCase().includes(query))),
    );
  }, [notes, search, filter]);
  const balances = notes.reduce<Record<SupportedCurrency, number>>((sum, note) => { if (note.status === "active") sum[note.currency] += note.remaining; return sum; }, { GBP: 0, EUR: 0 });

  const save = async () => {
    if (!isAdmin || saving) return;
    setSaving(true); setFormError("");
    try {
      const response = await fetch("/api/credit-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const created = await response.json();
      if (!response.ok) throw new Error(created.error || "Could not create credit note");
      setNotes((current) => [created, ...current]);
      setDialogOpen(false);
    } catch (caught) { setFormError(caught instanceof Error ? caught.message : "Could not create credit note"); }
    finally { setSaving(false); }
  };
  const voidNote = async (note: CreditNoteRecord) => {
    if (!window.confirm(`Void unused credit note ${note.creditNoteNumber}? It will remain in the audit history.`)) return;
    setVoidingId(note.id); setError("");
    try {
      const response = await fetch(`/api/credit-notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "void" }) });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.error || "Could not void credit note");
      setNotes((current) => current.map((item) => item.id === note.id ? updated : item));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not void credit note"); }
    finally { setVoidingId(null); }
  };

  if (!roleLoading && !isAdmin) return <div className="rounded-xl border border-border/40 p-8 text-sm">Credit Notes are available to Admin only.</div>;
  return <div className="space-y-6 pb-12">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="flex items-center gap-3 text-3xl font-bold"><FileMinus2 className="h-7 w-7 text-primary" /> Credit Notes</h1><p className="mt-1 text-sm text-muted-foreground">Customer credit for returned or undelivered goods. Credit is applied to the next same-currency invoice.</p></div>{!roleLoading && isAdmin && <Button onClick={() => { setDraft(blankDraft()); setFormError(""); setDialogOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Add credit note</Button>}</div>
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3"><div className="rounded-xl border border-border/40 bg-card/70 px-4 py-3 text-sm">Available GBP <strong className="ml-2">{formatCurrency(balances.GBP, "GBP")}</strong></div><div className="rounded-xl border border-border/40 bg-card/70 px-4 py-3 text-sm">Available EUR <strong className="ml-2">{formatCurrency(balances.EUR, "EUR")}</strong></div></div>
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/40 bg-card/70 p-4"><div className="min-w-[220px] flex-1"><label htmlFor="credit-search" className={labelClass}>Search</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input id="credit-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Client, credit number or note" className={`${fieldClass} pl-9`} /></div></div><div><label htmlFor="credit-filter" className={labelClass}>Status</label><select id="credit-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className={fieldClass}><option value="all">All</option><option value="available">Available</option><option value="used">Fully used</option><option value="void">Voided</option></select></div></div>
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card/70">{loading || roleLoading ? <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading credit notes…</div> : filtered.length === 0 ? <p className="py-20 text-center text-sm text-muted-foreground">No credit notes match this view.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1020px] border-collapse text-sm"><thead><tr className="border-b border-border/30 bg-muted/20 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Credit note / date</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Reason / note</th><th className="px-4 py-3 text-right">Issued</th><th className="px-4 py-3 text-right">Available</th><th className="px-4 py-3">Used on invoices</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{filtered.map((note) => <tr key={note.id} className="border-b border-border/20 align-top last:border-b-0 hover:bg-accent/20"><td className="px-4 py-4"><p className="font-mono font-semibold">{note.creditNoteNumber}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(note.date)}</p></td><td className="px-4 py-4"><p className="font-semibold">{note.clientName}</p><p className="text-xs text-muted-foreground">{note.clientId}</p></td><td className="max-w-[250px] px-4 py-4"><p>{reasons[note.reason]}</p>{note.note && <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{note.note}</p>}</td><td className="whitespace-nowrap px-4 py-4 text-right font-semibold">{formatCurrency(note.amount, note.currency)}</td><td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-emerald-700">{note.status === "void" ? "—" : formatCurrency(note.remaining, note.currency)}</td><td className="px-4 py-4 text-xs">{note.applications.length ? note.applications.map((application) => <p key={application.invoiceId} className="mb-1"><a href={`/invoices/${application.invoiceId}`} className="font-mono text-primary hover:underline">{application.invoiceNumber}</a> · {formatCurrency(application.amount, note.currency)}<span className="block text-muted-foreground">{new Date(application.appliedAt).toLocaleString("en-GB")}</span></p>) : "—"}</td><td className="px-4 py-4 text-xs">{note.status === "void" ? "Voided" : note.remaining === 0 ? "Fully used" : "Available"}</td><td className="px-4 py-4 text-right">{note.status === "active" && note.applications.length === 0 && <button type="button" onClick={() => void voidNote(note)} disabled={voidingId === note.id} title="Void unused note" aria-label={`Void ${note.creditNoteNumber}`} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-50">{voidingId === note.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}</button>}</td></tr>)}</tbody></table></div>}</div>
    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !saving) setDialogOpen(false); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Add credit note</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label htmlFor="credit-client" className={labelClass}>Client *</label><select id="credit-client" value={draft.clientId} onChange={(event) => setDraft({ ...draft, clientId: event.target.value })} className={fieldClass}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} ({client.id})</option>)}</select></div><div><label htmlFor="credit-date" className={labelClass}>Date *</label><input id="credit-date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} className={fieldClass} /></div><div><label htmlFor="credit-reason" className={labelClass}>Reason *</label><select id="credit-reason" value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value as Draft["reason"] })} className={fieldClass}><option value="return">Returned goods</option><option value="not_delivered">Not delivered</option><option value="other">Other</option></select></div><div><label htmlFor="credit-amount" className={labelClass}>Credit amount *</label><input id="credit-amount" type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} className={fieldClass} /></div><div><label htmlFor="credit-currency" className={labelClass}>Currency *</label><select id="credit-currency" value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as SupportedCurrency })} className={fieldClass}><option value="GBP">GBP (£)</option><option value="EUR">EUR (€)</option></select></div><div className="sm:col-span-2"><label htmlFor="credit-note" className={labelClass}>Note</label><textarea id="credit-note" rows={3} maxLength={2000} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Return, non-delivery or other details" className={`${fieldClass} h-auto py-2`} /></div></div><p className="text-xs text-muted-foreground">Credit is applied after VAT to future invoices in the same currency. Unused credit stays on the client account.</p>{formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}<DialogFooter><Button variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button><Button disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create credit note"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
