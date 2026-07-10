"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface PartialInvoiceOrder {
  id: string;
  orderNumber: string;
  total: number;
  amountInvoiced?: number;
  client?: { name?: string };
}

const gbp = (n: number) => `£${(Number(n) || 0).toFixed(2)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Dialog for issuing a partial (installment) invoice against an order.
 * Shows total / already invoiced / remaining, takes an amount (with quick
 * 25% / 50% / full-remaining shortcuts) and opens the new invoice on success.
 */
export function PartialInvoiceDialog({
  order,
  onClose,
  onCreated,
}: {
  order: PartialInvoiceOrder | null;
  onClose: () => void;
  onCreated?: (orderId: string, amountInvoiced: number) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const total = round2(order?.total ?? 0);
  const invoiced = round2(order?.amountInvoiced ?? 0);
  const remaining = round2(Math.max(0, total - invoiced));

  // Reset the form each time the dialog opens for an order.
  useEffect(() => {
    setAmount("");
    setError("");
    setBusy(false);
  }, [order?.id]);

  const parsed = useMemo(() => round2(Math.max(0, Number(amount) || 0)), [amount]);
  const balanceAfter = round2(Math.max(0, remaining - parsed));
  const valid = parsed > 0 && parsed <= remaining + 0.005;

  const create = async () => {
    if (!order || !valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/partial-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to create the partial invoice.");
        setBusy(false);
        return;
      }
      onCreated?.(order.id, data.order?.amountInvoiced ?? invoiced + parsed);
      onClose();
      router.push(`/invoices/${data.invoice.id}`);
    } catch {
      setError("Failed to create the partial invoice.");
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Partial Invoice</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {order?.orderNumber} · {order?.client?.name || "No client"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Balance summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Order total", value: gbp(total), cls: "" },
            { label: "Invoiced", value: gbp(invoiced), cls: "text-emerald-600 dark:text-emerald-400" },
            { label: "Remaining", value: gbp(remaining), cls: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className={cn("text-sm font-bold tabular-nums mt-0.5", s.cls)}>{s.value}</p>
            </div>
          ))}
        </div>

        {remaining <= 0 ? (
          <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            This order is fully invoiced — nothing left to bill.
          </p>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Amount to invoice now (£)</label>
              <input
                type="number"
                min={0.01}
                max={remaining}
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder={`up to ${remaining.toFixed(2)}`}
                autoFocus
                className="mt-1.5 h-10 w-full rounded-xl border border-border/60 bg-card px-3 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="mt-2 flex gap-1.5">
                {[
                  { label: "25%", v: round2(remaining * 0.25) },
                  { label: "50%", v: round2(remaining * 0.5) },
                  { label: `Remaining (${gbp(remaining)})`, v: remaining },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => { setAmount(String(q.v)); setError(""); }}
                    className="rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {parsed > 0 && valid && (
              <p className="text-xs text-muted-foreground">
                After this invoice, <span className="font-semibold text-foreground">{gbp(balanceAfter)}</span> will remain
                to be invoiced on {order?.orderNumber}.
              </p>
            )}
            {parsed > remaining + 0.005 && (
              <p className="text-xs font-medium text-destructive">
                Amount exceeds the remaining balance of {gbp(remaining)}.
              </p>
            )}
            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" className="rounded-xl" onClick={onClose} disabled={busy}>Cancel</Button>
          {remaining > 0 && (
            <Button
              onClick={create}
              disabled={!valid || busy}
              className="rounded-xl gap-1.5 bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Create Invoice {parsed > 0 && valid ? `· ${gbp(parsed)}` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
