"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Plus, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/currency";
import { useRole } from "@/lib/hooks/use-role";

interface ProformaRow {
  id: string;
  proformaNumber: string;
  status: string;
  client: { name?: string; companyName?: string };
  planogram: { name?: string };
  total: number;
  currency: string;
  createdAt: string | null;
}

export default function ProformaInvoicesPage() {
  const { canWrite, isLoading: roleLoading } = useRole();
  const [rows, setRows] = useState<ProformaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/proforma-invoices", { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Could not load proforma invoices");
      setRows(await response.json());
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load proformas"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (!roleLoading && canWrite) void load(); else if (!roleLoading) setLoading(false); }, [canWrite, roleLoading, load]);
  const filtered = useMemo(() => rows.filter((row) => [row.proformaNumber, row.client.name, row.client.companyName, row.planogram.name].some((value) => String(value ?? "").toLowerCase().includes(search.toLowerCase()))), [rows, search]);

  if (!roleLoading && !canWrite) return <div className="rounded-2xl border border-border/40 bg-card p-8 text-sm">Proforma invoices and pricing are available to Admin and Manager only.</div>;
  return <div className="space-y-6 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold tracking-tight">Proforma Invoices</h1><p className="mt-1 text-sm text-muted-foreground">Unconfirmed customer quotes. Approval converts a quote into a real order and invoice.</p></div>
      <Link href="/orders/new/planogram?proforma=1" className={buttonVariants({ className: "gap-2 rounded-xl" })}><Plus className="h-4 w-4" /> New Proforma</Link>
    </div>
    <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search number, client or planogram" className="pl-9" /></div>
    {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    {loading ? <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading proformas…</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-border/50 p-12 text-center text-sm text-muted-foreground">No proforma invoices found.</div> :
      <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card/70"><table className="w-full text-sm"><thead className="border-b border-border/40 bg-muted/20 text-left text-xs text-muted-foreground"><tr><th className="p-4">Proforma</th><th className="p-4">Client</th><th className="p-4">Planogram</th><th className="p-4">Status</th><th className="p-4">Created</th><th className="p-4 text-right">Total</th><th className="p-4" /></tr></thead><tbody>{filtered.map((row) => <tr key={row.id} className="border-b border-border/20 last:border-0"><td className="p-4 font-semibold"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{row.proformaNumber}</span></td><td className="p-4">{row.client.name || "—"}</td><td className="p-4">{row.planogram.name || "—"}</td><td className="p-4 text-xs">{row.status === "approving" ? "Approval in progress · retry if interrupted" : "Pending"}</td><td className="p-4 text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB") : "—"}</td><td className="p-4 text-right font-semibold">{formatCurrency(row.total, row.currency)}</td><td className="p-4 text-right"><Link href={`/proforma-invoices/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Open</Link></td></tr>)}</tbody></table></div>}
  </div>;
}
