"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPackingSlipHtml } from "@/lib/packing-slip";
import type { Order } from "@/lib/store/orders-store";

export default function PackingListViewPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) { if (on) setNotFound(true); return; }
        const data = await res.json();
        if (on) setOrder(data);
      } catch { if (on) setNotFound(true); }
      finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  const printSlip = () => {
    if (!order) return;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    win.document.write(buildPackingSlipHtml(order));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  if (loading) return <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Loading packing slip…</span></div>;
  if (notFound || !order) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-base font-semibold">Order not found</p>
      <Link href="/orders" className="text-sm text-primary mt-2">Back to Orders</Link>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 max-w-[900px]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href={`/orders/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Order
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Packing Slip · <span className="font-mono">{order.orderNumber}</span></h1>
          <Button onClick={printSlip} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
            <Printer className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </motion.div>

      {/* On-screen packing slip — identical to the printed PDF (same HTML) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border/40 bg-white overflow-hidden shadow-sm">
        <iframe
          title="Packing Slip"
          srcDoc={buildPackingSlipHtml(order)}
          className="w-full block"
          style={{ border: 0, height: 900 }}
          onLoad={(e) => {
            try {
              const doc = e.currentTarget.contentDocument;
              if (doc) e.currentTarget.style.height = `${doc.documentElement.scrollHeight + 8}px`;
            } catch { /* srcDoc is same-origin */ }
          }}
        />
      </motion.div>
    </div>
  );
}
