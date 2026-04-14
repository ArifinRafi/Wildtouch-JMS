"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Boxes,
  Factory,
  TrendingUp,
  Printer,
  Info,
  ImagePlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import type { Product } from "@/lib/store/app-store";

// ─── Form ─────────────────────────────────────────────────────────────────────
interface ProductForm { name: string; inStock: string; notes: string; imageUrl: string; }
const emptyForm = (): ProductForm => ({ name: "", inStock: "0", notes: "", imageUrl: "" });

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const store = useAppStore();
  const { products, productionLogs } = store;

  const [search, setSearch] = useState("");
  const [dlgOpen, setDlgOpen]       = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<ProductForm>(emptyForm());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // ── Compute "In Production" per product name from pending logs ───────────
  const inProductionMap = useMemo(() => {
    const map = new Map<string, number>(); // normalised name → total qty
    productionLogs
      .filter((l) => !l.complete)
      .forEach((l) => {
        const key = l.product.trim().toLowerCase();
        map.set(key, (map.get(key) ?? 0) + (l.qtyOut ?? 0));
      });
    return map;
  }, [productionLogs]);

  // ── Pending-log-only products (appear in production but not in product list) ─
  const pendingOnlyProducts = useMemo(() => {
    const known = new Set(products.map((p) => p.name.trim().toLowerCase()));
    const extras = new Map<string, { name: string; qty: number }>();
    productionLogs
      .filter((l) => !l.complete)
      .forEach((l) => {
        const key = l.product.trim().toLowerCase();
        if (!known.has(key)) {
          if (!extras.has(key)) extras.set(key, { name: l.product.trim(), qty: 0 });
          extras.get(key)!.qty += l.qtyOut ?? 0;
        }
      });
    return [...extras.values()];
  }, [products, productionLogs]);

  // ── Filtered products ─────────────────────────────────────────────────────
  const visibleProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.notes.toLowerCase().includes(q)
    );
  }, [products, search]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalInStock      = products.reduce((s, p) => s + p.inStock, 0);
  const totalInProduction = [...inProductionMap.values()].reduce((s, v) => s + v, 0);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setDlgOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, inStock: String(p.inStock), notes: p.notes, imageUrl: p.imageUrl ?? "" });
    setFormError("");
    setDlgOpen(true);
  };

  const handleSave = useCallback(() => {
    if (!form.name.trim()) { setFormError("Product name is required."); return; }
    const inStock = Math.max(0, Number(form.inStock) || 0);
    if (editingId) {
      store.updateProduct(editingId, { name: form.name.trim(), inStock, notes: form.notes.trim(), imageUrl: form.imageUrl || undefined });
    } else {
      // Check for duplicate name
      const exists = products.some(
        (p) => p.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      );
      if (exists) { setFormError("A product with this name already exists."); return; }
      store.addProduct({ name: form.name.trim(), inStock, notes: form.notes.trim(), imageUrl: form.imageUrl || undefined });
    }
    setDlgOpen(false);
  }, [form, editingId, products, store]);

  // ── Print ─────────────────────────────────────────────────────────────────
  const printProducts = useCallback(() => {
    const allRows = [
      ...visibleProducts.map((p) => {
        const inProd = inProductionMap.get(p.name.trim().toLowerCase()) ?? 0;
        return `<tr>
          <td><strong>${p.name}</strong></td>
          <td class="num">${p.inStock}</td>
          <td class="num">${inProd || "—"}</td>
          <td>${p.notes || "—"}</td>
        </tr>`;
      }),
      ...pendingOnlyProducts.map((po) => `<tr class="pending-only">
        <td><em>${po.name}</em> <small>(production only)</small></td>
        <td class="num">0</td>
        <td class="num">${po.qty}</td>
        <td>—</td>
      </tr>`),
    ].join("");

    const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><title>Wildtouch JMS — Products</title>
<style>
  @page { size: A4; margin: 20mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 11px; color: #111; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #6d28d9; padding-bottom: 8px; margin-bottom: 14px; }
  .brand { font-size: 18px; font-weight: 800; color: #6d28d9; }
  .meta h2 { font-size: 13px; font-weight: 700; }
  .meta p  { font-size: 9px; color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #6d28d9; color: #fff; }
  thead th { padding: 7px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  tbody tr:nth-child(even) { background: #f5f3ff; }
  tbody tr { border-bottom: 1px solid #e5e7eb; }
  tbody td { padding: 7px 10px; vertical-align: middle; }
  tbody td.num { text-align: right; font-weight: 600; }
  tbody tr.pending-only { color: #7c3aed; }
  footer { margin-top: 16px; font-size: 8px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style></head><body>
<header>
  <div class="brand">Wildtouch JMS</div>
  <div class="meta">
    <h2>Products — Stock &amp; Production Overview</h2>
    <p>Printed: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
  </div>
</header>
<table>
  <thead><tr><th>Product Name</th><th style="text-align:right">In Stock</th><th style="text-align:right">In Production</th><th>Notes</th></tr></thead>
  <tbody>${allRows}</tbody>
</table>
<footer>Wildtouch Jewellery Management System — Confidential</footer>
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }, [visibleProducts, pendingOnlyProducts, inProductionMap]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live stock levels — auto-updated when production logs complete
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={openAdd}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </motion.div>
      </motion.div>

      {/* Stat chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Package,    label: "Total Products",  value: products.length,      color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Boxes,      label: "Total In Stock",  value: totalInStock,         color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: Factory,    label: "In Production",   value: totalInProduction,    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { icon: TrendingUp, label: "Production Items",value: pendingOnlyProducts.length + products.filter(p => (inProductionMap.get(p.name.trim().toLowerCase()) ?? 0) > 0).length, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
        ].map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}
          >
            <chip.icon className="h-4 w-4" />
            {chip.label}: {chip.value}
          </motion.div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl bg-card/70 glass border-border/40"
        />
      </motion.div>

      {/* Products table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product Name</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">In Stock</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    In Production
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-xs">
                        Total quantity currently being made by home workers (pending logs only).
                        Auto-added to In Stock when a log is marked Complete.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {visibleProducts.length === 0 && pendingOnlyProducts.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={5}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                      >
                        <Package className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No products yet</p>
                        <p className="text-xs mt-1 opacity-60">
                          Add a product manually, or complete a production log to auto-add one
                        </p>
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* ── Products from the store ── */}
                    {visibleProducts.map((product, i) => {
                      const inProd = inProductionMap.get(product.name.trim().toLowerCase()) ?? 0;
                      return (
                        <motion.tr
                          key={product.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.22, delay: i * 0.04 }}
                          className="group border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0"
                        >
                          {/* Name */}
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <motion.img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  whileHover={{ scale: 1.18 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                  onClick={() => setLightboxUrl(product.imageUrl!)}
                                  className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border/30 bg-muted/20 cursor-zoom-in"
                                />
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
                                  <Package className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold">{product.name}</p>
                                <p className="text-[10px] text-muted-foreground">{product.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* In Stock */}
                          <td className="px-5 py-4 align-middle text-right">
                            <span className={cn(
                              "inline-flex items-center justify-center rounded-xl px-3 py-1 text-sm font-bold tabular-nums",
                              product.inStock === 0
                                ? "bg-red-500/10 border border-red-500/25 text-red-500"
                                : "bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                            )}>
                              {product.inStock.toLocaleString()}
                            </span>
                          </td>

                          {/* In Production */}
                          <td className="px-5 py-4 align-middle text-right">
                            {inProd > 0 ? (
                              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1 text-sm font-bold tabular-nums bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400">
                                <Factory className="h-3.5 w-3.5" />
                                {inProd.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="px-5 py-4 align-middle">
                            <p className="text-xs text-muted-foreground max-w-[260px] truncate">{product.notes || "—"}</p>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => openEdit(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                title="Edit product"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => store.deleteProduct(product.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                                title="Delete product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}

                    {/* ── Products that only exist in pending logs ── */}
                    {pendingOnlyProducts.length > 0 && (
                      <>
                        <tr key="divider">
                          <td colSpan={5} className="px-5 py-2 bg-amber-500/5 border-y border-amber-500/15">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Factory className="h-3 w-3" />
                              In Production Only — not yet added to products
                            </p>
                          </td>
                        </tr>
                        {pendingOnlyProducts.map((po, i) => (
                          <motion.tr
                            key={`pending-${po.name}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.22, delay: i * 0.04 }}
                            className="border-b border-border/20 bg-amber-500/5"
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                                  <Factory className="h-4 w-4 text-amber-500" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{po.name}</p>
                                  <p className="text-[10px] text-muted-foreground">Will be auto-added when log completes</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 align-middle text-right">
                              <span className="text-xs text-muted-foreground/40">—</span>
                            </td>
                            <td className="px-5 py-4 align-middle text-right">
                              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1 text-sm font-bold tabular-nums bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400">
                                <Factory className="h-3.5 w-3.5" />
                                {po.qty.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-xs text-muted-foreground/40">—</span>
                            </td>
                            <td className="px-5 py-4 align-middle">
                              <span className="text-[10px] text-muted-foreground/40 italic">Auto-managed</span>
                            </td>
                          </motion.tr>
                        ))}
                      </>
                    )}
                  </>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{products.length}</span> product{products.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totalInStock.toLocaleString()}</span> in stock &nbsp;·&nbsp;
            <span className="font-semibold text-amber-600 dark:text-amber-400">{totalInProduction.toLocaleString()}</span> in production
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={printProducts}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold text-foreground transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            Print / Download PDF
          </motion.button>
        </div>
      </motion.div>

      {/* Floating Add button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        onClick={openAdd}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full px-5 py-3 bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
      >
        <Plus className="h-5 w-5" />
        Add Product
      </motion.button>

      {/* ── IMAGE LIGHTBOX ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.img
              src={lightboxUrl}
              alt="Product full view"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain cursor-default"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition-colors"
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ADD / EDIT DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingId ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {formError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                {formError}
              </motion.p>
            )}

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Product Image <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
              </Label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer overflow-hidden"
                style={{ minHeight: form.imageUrl ? "auto" : 96 }}>
                {form.imageUrl ? (
                  <div className="relative w-full">
                    <img src={form.imageUrl} alt="Product preview" className="w-full max-h-40 object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setForm((f) => ({ ...f, imageUrl: "" })); }}
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/80 hover:bg-destructive text-white text-xs font-bold"
                      title="Remove image"
                    >✕</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 p-4">
                    <ImagePlus className="h-7 w-7 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground/60">Click to upload image</span>
                    <span className="text-[10px] text-muted-foreground/40">PNG, JPG, WEBP</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setForm((f) => ({ ...f, imageUrl: url }));
                  }}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product Name *</Label>
              <Input
                placeholder="e.g. Floor, Keyrings, Pin Badges"
                value={form.name}
                onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, name: e.target.value })); }}
                className="rounded-xl bg-muted/30 border-border/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                In Stock <span className="normal-case font-normal text-muted-foreground/60">(current quantity)</span>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.inStock}
                onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.value }))}
                className="rounded-xl bg-muted/30 border-border/40"
              />
              <p className="text-[11px] text-muted-foreground/70 pl-1">
                This will automatically increase when a production log for this product is marked Complete.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Notes <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                placeholder="e.g. Display spinner, Seasonal item…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="rounded-xl bg-muted/30 border-border/40 min-h-[72px]"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/30 bg-transparent rounded-b-2xl">
            <Button variant="outline" onClick={() => setDlgOpen(false)} className="rounded-xl border-border/40">Cancel</Button>
            <Button onClick={handleSave} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              {editingId ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
