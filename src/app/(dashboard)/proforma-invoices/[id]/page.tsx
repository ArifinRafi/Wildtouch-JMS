"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, FilePenLine, LayoutGrid, Loader2, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { buildProformaHtml, type ProformaDocument } from "@/lib/proforma-document-html";
import { applyPlanogramQuantities, buildPlanogramSidesHtml, groupOrderLinesForPdf, resolvePlanogramForPdf, type PdfPlanogram, type PdfMeta } from "@/lib/planogram-pdf";
import { thumbUrl } from "@/lib/cloudinary";
import { useRole } from "@/lib/hooks/use-role";

interface Proforma extends ProformaDocument {
  id: string;
  status: string;
  approvalNeedsRetry?: boolean;
  planogram: { id: string; name: string };
  grid?: { slots?: number[][][]; segQty?: number[][][]; rowQty?: number[][][] };
  poNumber: string;
  referenceNumber: string;
  notes: string;
}

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export default function ProformaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { canWrite, isLoading: roleLoading } = useRole();
  const [quote, setQuote] = useState<Proforma | null>(null);
  const [planogram, setPlanogram] = useState<PdfPlanogram | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (roleLoading || !canWrite) { if (!roleLoading) setLoading(false); return; }
    let active = true;
    (async () => {
      try {
        const response = await fetch(`/api/proforma-invoices/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Proforma invoice not found");
        const data: Proforma = await response.json();
        if (!active) return;
        setQuote(data);
        resolvePlanogramForPdf(data.planogram.id).then((result) => { if (active) setPlanogram(result); }).catch(() => {});
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Could not load proforma"); }
      finally { if (active) setLoading(false); }
    })();
    fetch("/api/products").then((response) => response.ok ? response.json() : []).then((products: Array<{ name?: string; code?: string; image?: string }>) => {
      if (!active) return;
      const imageMap: Record<string, string> = {};
      for (const product of products) {
        if (!product.image) continue;
        if (product.name) imageMap[`name:${product.name.toLowerCase()}`] = product.image;
        if (product.code) imageMap[`code:${product.code.toLowerCase()}`] = product.image;
      }
      setProductImages(imageMap);
    }).catch(() => {});
    return () => { active = false; };
  }, [id, canWrite, roleLoading]);

  const printDocument = () => {
    if (!quote) return;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    win.document.write(buildProformaHtml(quote));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  const printPlanogram = () => {
    if (!quote) return;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    const meta: PdfMeta = {
      orderNumber: `Proforma ${quote.proformaNumber}`,
      invoiceNumber: quote.proformaNumber,
      dateStr: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString("en-GB") : "—",
      clientName: quote.client.name ?? "",
      contactName: quote.client.contactName ?? "",
      companyName: quote.client.companyName ?? quote.client.name ?? "",
      address: quote.client.invoiceAddress ?? "",
      telephone: quote.client.contactNumber ?? "",
      email: quote.client.email ?? "",
      poNumber: quote.poNumber,
      referenceNumber: quote.referenceNumber,
      additionalInformation: quote.notes,
      brandCardImage: quote.client.brandCardImage ?? "",
      barcodeImage: quote.client.barcodeImage ?? "",
      orderGroups: groupOrderLinesForPdf(quote.lineItems.map((line) => ({ ...line, qty: line.qtyOrdered }))),
    };
    const html = planogram ? buildPlanogramSidesHtml(meta, applyPlanogramQuantities(planogram, quote.grid), (product) => {
      const url = productImages[`name:${product.toLowerCase()}`] ?? "";
      return url ? thumbUrl(url, 96) : "";
    }) : `<!doctype html><html><head><title>Proforma-Planogram-${esc(quote.proformaNumber)}</title><style>body{font-family:Arial;padding:32px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ccc;text-align:left}</style></head><body><h1>Planogram — ${esc(quote.planogram.name)}</h1><p>Proforma ${esc(quote.proformaNumber)} · ${esc(quote.client.name)} · ${esc(meta.dateStr)}</p><p>${esc(quote.client.invoiceAddress)}</p><p>PO ${esc(quote.poNumber)} · Reference ${esc(quote.referenceNumber)}</p><table><thead><tr><th>Product</th><th>Code</th><th>Qty</th></tr></thead><tbody>${quote.lineItems.map((line) => `<tr><td>${esc(line.description)}</td><td>${esc(line.code)}</td><td>${line.qtyOrdered}</td></tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const approve = async () => {
    if (!quote || !window.confirm(`Approve ${quote.proformaNumber}? This creates the actual order and invoice and removes the proforma.`)) return;
    setWorking(true); setError("");
    try {
      const response = await fetch(`/api/proforma-invoices/${id}/approve`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not approve proforma");
      router.push(`/invoices/${result.invoice.id}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not approve proforma"); }
    finally { setWorking(false); }
  };

  const remove = async () => {
    if (!quote || !window.confirm(`Delete ${quote.proformaNumber}? This cannot be undone.`)) return;
    setWorking(true); setError("");
    try {
      const response = await fetch(`/api/proforma-invoices/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "Could not delete proforma");
      router.push("/proforma-invoices");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not delete proforma"); }
    finally { setWorking(false); }
  };

  if (!roleLoading && !canWrite) return <div className="rounded-xl border border-border/40 p-8 text-sm">Proforma invoices and pricing are available to Admin and Manager only.</div>;
  if (loading || roleLoading) return <div className="flex items-center gap-2 py-20 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading proforma…</div>;
  if (!quote) return <div className="space-y-4 py-20 text-center"><p>{error || "Proforma not found"}</p><Link href="/proforma-invoices" className="text-sm text-primary">Back to Proforma Invoices</Link></div>;

  return <div className="space-y-6 pb-12">
    <Link href="/proforma-invoices" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to Proforma Invoices</Link>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">{quote.proformaNumber}</h1><p className="mt-1 text-sm text-muted-foreground">Unconfirmed quotation for {quote.client.name} · {formatCurrency(quote.total, quote.currency)}</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={printDocument} className="gap-2"><Printer className="h-4 w-4" /> Download Proforma Invoice PDF</Button>
        <Button variant="outline" onClick={printPlanogram} className="gap-2"><LayoutGrid className="h-4 w-4" /> Planogram PDF</Button>
        <Button variant="outline" onClick={() => router.push(`/orders/new/planogram?proforma=1&edit=${quote.id}`)} disabled={working || quote.status !== "pending" || quote.approvalNeedsRetry} className="gap-2"><FilePenLine className="h-4 w-4" /> Edit</Button>
        <Button onClick={approve} disabled={working} className="gap-2"><Check className="h-4 w-4" /> Approve</Button>
        <Button variant="destructive" onClick={remove} disabled={working || quote.status !== "pending" || quote.approvalNeedsRetry} className="gap-2"><Trash2 className="h-4 w-4" /> Delete</Button>
      </div>
    </div>
    {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
    {quote.status === "approving" && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">Approval is in progress or was interrupted. If it does not finish, wait two minutes and use Approve again; the same order and invoice will be reused.</p>}
    {quote.approvalNeedsRetry && quote.status === "pending" && <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">The order was created, but approval did not finish. Use Approve again to complete the existing order and invoice; editing and deletion are disabled.</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,820px)_280px]">
      <div className="overflow-hidden rounded-2xl border border-border/40 bg-white shadow-sm"><iframe title="Proforma Invoice" srcDoc={buildProformaHtml(quote)} className="block w-full" style={{ border: 0, height: 900 }} onLoad={(event) => { const doc = event.currentTarget.contentDocument; if (doc) event.currentTarget.style.height = `${doc.documentElement.scrollHeight + 8}px`; }} /></div>
      <aside className="rounded-2xl border border-border/40 bg-card/70 p-5"><div className="mb-2 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Planogram</h2></div><p className="text-sm">{quote.planogram.name}</p><p className="mt-1 text-xs text-muted-foreground">{quote.lineItems.reduce((sum, line) => sum + line.qtyOrdered, 0)} units</p><div className="mt-4 space-y-2 border-t border-border/30 pt-4">{quote.lineItems.map((line, index) => <div key={index} className="flex justify-between gap-2 text-xs"><span className="truncate">{line.description}</span><span className="font-semibold">×{line.qtyOrdered}</span></div>)}</div></aside>
    </div>
  </div>;
}
