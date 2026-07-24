"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ReceiptText,
  LayoutGrid,
  UserRound,
  MapPin,
  Package,
  AlertTriangle,
} from "lucide-react";
import { StepNav } from "@/components/orders/step-nav";
import { useOrderDraft } from "@/lib/store/order-draft";
import { useOrders } from "@/lib/store/orders-store";
import { useAppStore } from "@/lib/store/app-store";
import { useProducts } from "@/lib/hooks/use-products";
import { buildCategoryLookup, priceLinesByCategory, groupIntoCategoryLines } from "@/lib/invoicing";

export default function ReviewStepPage() {
  const router = useRouter();
  const { draft, reset } = useOrderDraft();
  const { refresh: refreshOrders } = useOrders();
  const { clients } = useAppStore();
  const { products } = useProducts();
  const [error, setError] = useState("");

  const lineItems = draft.lineItems ?? [];
  const totalUnits = lineItems.reduce((s, li) => s + li.qtyOrdered, 0);
  const ready = !!draft.planogram && lineItems.length > 0 && !!draft.client?.clientId;

  // Invoice preview — each product is priced from the CLIENT's price for the
  // product's CATEGORY (group), then grouped so the invoice shows one line per
  // category. Mirrors what the confirm API does server-side.
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const liveClient = clients.find((c) => c.id === draft.client?.clientId);
  const vatRate = liveClient?.vatRate ?? draft.client?.vatRate ?? 0;
  const pricedLines = priceLinesByCategory(lineItems, buildCategoryLookup(products), liveClient?.categoryPrices ?? {});
  const categoryLines = groupIntoCategoryLines(pricedLines);
  const subtotal = round2(pricedLines.reduce((s, li) => s + li.lineTotal, 0));
  const vat = round2((subtotal * vatRate) / 100);
  const grandTotal = round2(subtotal + vat);
  const gbp = (n: number) => `£${n.toFixed(2)}`;

  const confirm = async (): Promise<boolean> => {
    if (!ready) {
      setError("Order is incomplete. Please complete the earlier steps.");
      return false;
    }
    setError("");
    try {
      const res = await fetch("/api/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planogram: draft.planogram,
          lineItems: draft.lineItems,
          componentRequirements: draft.componentRequirements,
          client: draft.client,
          notes: draft.notes,
        }),
      });
      if (!res.ok) throw new Error("confirm failed");
      const { invoice } = await res.json();
      reset();
      // Pull the fresh order list into the shared store so the Orders page
      // shows the new order immediately — no manual page refresh needed.
      refreshOrders().catch(() => {});
      router.push(`/invoices/${invoice.id}`);
      return true;
    } catch {
      setError("Could not confirm the order. Please try again.");
      return false;
    }
  };

  if (!ready) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/40 bg-card/70 glass p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500/60 mx-auto mb-3" />
          <p className="text-sm font-medium">This order isn&rsquo;t complete yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Go back and make sure a planogram, products and a client are selected.</p>
        </div>
        <StepNav backHref="/orders/new/client" nextDisabled isLast nextLabel="Confirm Order" />
      </div>
    );
  }

  const c = draft.client!;

  return (
    <div className="space-y-6 max-w-4xl">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 border border-destructive/20 font-medium">{error}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Planogram + client cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-5">
          <div className="flex items-center gap-2 mb-3"><LayoutGrid className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Planogram</h3></div>
          <p className="text-sm font-medium">{draft.planogram!.name}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{lineItems.length} products · {totalUnits} units</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-5">
          <div className="flex items-center gap-2 mb-3"><UserRound className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Client</h3></div>
          <p className="text-sm font-medium">{c.name} <span className="text-[11px] font-mono text-muted-foreground">· {c.clientId}</span></p>
          {c.email && <p className="text-[11px] text-muted-foreground mt-1">{c.email}</p>}
          {c.contactNumber && <p className="text-[11px] text-muted-foreground">{c.contactNumber}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-5">
          <div className="flex items-center gap-2 mb-3"><MapPin className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Delivery</h3></div>
          <p className="text-[11px] text-muted-foreground whitespace-pre-line">{c.deliveryAddress || c.invoiceAddress || "—"}</p>
        </motion.div>
      </div>

      {/* Line items */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.12 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border/20 bg-muted/10">
          <Package className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Order items</h3>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-10">#</th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} className="border-b border-border/15 last:border-b-0">
                  <td className="px-5 py-2.5 text-[11px] text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-5 py-2.5 text-sm font-medium">{li.description}</td>
                  <td className="px-5 py-2.5 text-right text-sm font-semibold tabular-nums">{li.qtyOrdered}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-muted/20">
                <td />
                <td className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total units</td>
                <td className="px-5 py-3 text-right text-sm font-black tabular-nums text-primary">{totalUnits}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* Invoice totals (VAT comes from the client) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <ReceiptText className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Invoice preview — billed by category</h3>
        </div>
        {/* Category lines — exactly what the generated invoice will show */}
        <div className="overflow-x-auto rounded-xl border border-border/30 mb-3">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {categoryLines.map((l, i) => (
                <tr key={i} className="border-b border-border/15 last:border-b-0">
                  <td className="px-4 py-2 text-sm font-medium">{l.description}</td>
                  <td className="px-4 py-2 text-right text-sm tabular-nums">{l.qty}</td>
                  <td className="px-4 py-2 text-right text-sm tabular-nums">{gbp(l.unitPrice)}</td>
                  <td className="px-4 py-2 text-right text-sm tabular-nums font-semibold">{gbp(l.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-border/30 bg-muted/10 p-3 text-sm max-w-sm ml-auto">
          <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-medium">{gbp(subtotal)}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-muted-foreground">VAT ({vatRate}%)</span><span className="tabular-nums font-medium">{gbp(vat)}</span></div>
          <div className="flex justify-between py-1 mt-1 border-t border-border/30 font-bold"><span>Total incl. VAT</span><span className="tabular-nums text-primary">{gbp(grandTotal)}</span></div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Prices come from this client&rsquo;s <span className="font-semibold">Category Pricing</span> (client profile → Category Pricing);
          VAT rate <span className="font-semibold">{vatRate}%</span> is also set per client. Categories priced at £0 have no price set for this client.
        </p>
      </motion.div>

      <p className="text-[11px] text-muted-foreground">Confirming creates the order and generates an invoice for this client.</p>

      <StepNav backHref="/orders/new/client" isLast nextLabel="Confirm Order" onNext={confirm} />
    </div>
  );
}
