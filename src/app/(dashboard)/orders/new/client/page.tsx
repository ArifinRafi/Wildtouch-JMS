"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  UserRound,
  Search,
  RefreshCcw,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StepNav } from "@/components/orders/step-nav";
import { useOrderDraft } from "@/lib/store/order-draft";
import { useAppStore, type Client } from "@/lib/store/app-store";

function addressOf(c: Client): string {
  if (c.invoiceAddressFull?.trim()) return c.invoiceAddressFull;
  return [c.address, c.city].filter(Boolean).join(", ");
}

export default function ClientStepPage() {
  const { draft, patchDraft } = useOrderDraft();
  const { clients, clientsLoading } = useAppStore();
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => clients.find((c) => c.id === draft.client?.clientId) ?? null,
    [clients, draft.client],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const selectClient = (c: Client) => {
    const invoiceAddress = addressOf(c);
    const deliveryAddress = c.deliveryAddress?.trim() || invoiceAddress;
    patchDraft({
      client: {
        clientId: c.id,
        name: c.name,
        email: c.email ?? "",
        contactNumber: c.contactNumber ?? "",
        invoiceAddress,
        deliveryAddress,
        vatRate: c.vatRate ?? 0,
      },
    });
  };

  const setField = (key: "invoiceAddress" | "deliveryAddress", value: string) => {
    if (!draft.client) return;
    patchDraft({ client: { ...draft.client, [key]: value } });
  };

  const changeClient = () => patchDraft({ client: null });

  // ── No client selected: picker ──
  if (!draft.client?.clientId) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-6">
          <div className="flex items-center gap-2 mb-1">
            <UserRound className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Select a client</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Choose the client this order is for. Their addresses auto-fill next.</p>

          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input placeholder="Search clients by name, id or city…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-card/70 glass border-border/40" />
          </div>

          {clientsLoading ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading clients…</span></div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No clients match your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filtered.map((c) => (
                <button key={c.id} onClick={() => selectClient(c)}
                  className="text-left rounded-2xl border border-border/40 bg-card/60 hover:border-primary/40 hover:bg-accent/30 transition-colors p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">{c.id}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.city || "—"}</p>
                  {c.email && <p className="text-[11px] text-muted-foreground mt-0.5 truncate flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>}
                </button>
              ))}
            </div>
          )}
        </motion.div>
        <StepNav backHref="/orders/new/inventory" nextDisabled nextLabel="Next" />
      </div>
    );
  }

  // ── Client selected: details + addresses ──
  const c = draft.client;
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Selected client */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/70 glass px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/15"><Building2 className="h-5 w-5 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{c.name} {selected ? <span className="text-[11px] font-mono text-muted-foreground">· {selected.id}</span> : null}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              {c.email && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
              {c.contactNumber && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.contactNumber}</span>}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40 shrink-0" onClick={changeClient}>
          <RefreshCcw className="h-3.5 w-3.5" /> Change
        </Button>
      </div>

      {/* Addresses */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Addresses for this order</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice Address</Label>
            <textarea rows={4} value={c.invoiceAddress ?? ""} onChange={(e) => setField("invoiceAddress", e.target.value)}
              className="w-full rounded-xl bg-muted/30 border border-border/40 px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Delivery Address</Label>
            <textarea rows={4} value={c.deliveryAddress ?? ""} onChange={(e) => setField("deliveryAddress", e.target.value)}
              className="w-full rounded-xl bg-muted/30 border border-border/40 px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Pre-filled from the client record — edit if this order ships elsewhere.</p>
      </motion.div>

      <StepNav backHref="/orders/new/inventory" nextHref="/orders/new/review" nextDisabled={!c.invoiceAddress?.trim()} />
    </div>
  );
}
