"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Boxes,
  Minus,
  X,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useProducts, type CatalogProduct } from "@/lib/hooks/use-products";
import { useInventory } from "@/lib/store/inventory-store";

const PAGE_SIZE = 50;

interface ProductComponentRow { code: string; label: string; qtyPerUnit: number }
interface ProductForm { name: string; code: string; components: ProductComponentRow[] }
const emptyForm = (): ProductForm => ({ name: "", code: "", components: [] });

export default function ProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { items: inventory } = useInventory();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [compSearch, setCompSearch] = useState("");
  const [toDelete, setToDelete] = useState<CatalogProduct | null>(null);

  const dialogOpen = adding || !!editing;

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const withComponents = useMemo(() => products.filter((p) => p.components.length > 0).length, [products]);

  // Inventory components available to add (excluding ones already on the form)
  const availableComponents = useMemo(() => {
    const chosen = new Set(form.components.map((c) => c.code));
    const q = compSearch.trim().toLowerCase();
    return inventory
      .filter((it) => !chosen.has(it.code))
      .filter((it) => !q || it.description.toLowerCase().includes(q) || it.code.toLowerCase().includes(q))
      .slice(0, 30);
  }, [inventory, form.components, compSearch]);

  const openAdd = () => { setForm(emptyForm()); setCompSearch(""); setAdding(true); };
  const openEdit = useCallback((p: CatalogProduct) => {
    setEditing(p);
    setCompSearch("");
    setForm({
      name: p.name,
      code: p.code,
      components: p.components.map((c) => ({ code: c.code, label: c.label || c.code, qtyPerUnit: c.qtyPerUnit || 1 })),
    });
  }, []);
  const closeDialogs = () => { setEditing(null); setAdding(false); setForm(emptyForm()); setCompSearch(""); };

  const addComponent = (code: string, label: string) =>
    setForm((f) => ({ ...f, components: [...f.components, { code, label, qtyPerUnit: 1 }] }));
  const removeComponent = (code: string) =>
    setForm((f) => ({ ...f, components: f.components.filter((c) => c.code !== code) }));
  const setComponentQty = (code: string, qty: number) =>
    setForm((f) => ({ ...f, components: f.components.map((c) => (c.code === code ? { ...c, qtyPerUnit: Math.max(1, qty) } : c)) }));

  const submit = useCallback(async () => {
    const payload = { name: form.name.trim(), code: form.code.trim(), components: form.components };
    if (!payload.name) return;
    if (editing) await updateProduct(editing.id, payload);
    else await createProduct(payload);
    closeDialogs();
  }, [form, editing, updateProduct, createProduct]);

  const confirmDelete = useCallback(() => {
    if (!toDelete) return;
    deleteProduct(toDelete.id);
    setToDelete(null);
  }, [toDelete, deleteProduct]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <Package className="h-7 w-7 text-primary" /> Products
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Products built from inventory components · <span className="font-semibold text-primary">{products.length.toLocaleString()}</span>
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={openAdd} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Create a Product
          </Button>
        </motion.div>
      </motion.div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: Package, label: "Total Products", value: products.length, color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Boxes, label: "With Components", value: withComponents, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: Boxes, label: "Inventory Components", value: inventory.length, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
        ].map((chip) => (
          <div key={chip.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}>
            <chip.icon className="h-4 w-4" /> {chip.label}: {chip.value.toLocaleString()}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input placeholder="Search products by name or code…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-9 rounded-xl bg-card/70 glass border-border/40" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Loading products…</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Components</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {pageItems.length === 0 ? (
                    <tr><td colSpan={5}><div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Package className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm font-medium">No products yet — create one</p></div></td></tr>
                  ) : (
                    pageItems.map((p, i) => (
                      <motion.tr key={p.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15, delay: Math.min(i, 12) * 0.01 }}
                        className="border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0">
                        <td className="px-4 py-3 text-[11px] font-bold text-muted-foreground tabular-nums">{safePage * PAGE_SIZE + i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                        <td className="px-4 py-3">
                          {p.code ? <span className="inline-flex items-center rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-xs font-mono font-semibold">{p.code}</span> : <span className="text-xs text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {p.components.length ? (
                            <div className="flex flex-wrap gap-1">
                              {p.components.slice(0, 4).map((c, ci) => (
                                <span key={ci} title={`${c.label} ×${c.qtyPerUnit}`} className="inline-flex items-center rounded-md bg-primary/5 border border-primary/15 px-1.5 py-0.5 text-[10px] font-mono text-primary">{c.code}×{c.qtyPerUnit}</span>
                              ))}
                              {p.components.length > 4 && <span className="text-[10px] text-muted-foreground">+{p.components.length - 4}</span>}
                            </div>
                          ) : <span className="text-xs text-muted-foreground/40">none</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(p)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setToDelete(p)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">Showing <span className="font-semibold text-foreground">{safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span></p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-xs font-medium tabular-nums text-muted-foreground min-w-[90px] text-center">Page {safePage + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialogs()}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {editing ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editing ? "Edit Product" : "Create a Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product Name *</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40" placeholder="e.g. Bag Charm Gold Bird" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product Code</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40 font-mono" placeholder="e.g. BC01" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              </div>
            </div>

            {/* Components builder */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Components needed (from inventory)</Label>

              {/* Selected components */}
              {form.components.length > 0 ? (
                <div className="space-y-1.5">
                  {form.components.map((c) => (
                    <div key={c.code} className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.label}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{c.code}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setComponentQty(c.code, c.qtyPerUnit - 1)} disabled={c.qtyPerUnit <= 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card hover:bg-accent/60 disabled:opacity-30"><Minus className="h-3.5 w-3.5" /></button>
                        <input type="number" min={1} value={c.qtyPerUnit} onChange={(e) => setComponentQty(c.code, parseInt(e.target.value, 10) || 1)} className="h-8 w-14 rounded-lg border border-border/40 bg-card text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
                        <button onClick={() => setComponentQty(c.code, c.qtyPerUnit + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card hover:bg-accent/60"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button onClick={() => removeComponent(c.code)} title="Remove" className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground rounded-xl border border-dashed border-border/40 px-3 py-4 text-center">No components added yet. Search and add from inventory below.</p>
              )}

              {/* Component picker */}
              <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input placeholder="Search inventory components to add…" value={compSearch} onChange={(e) => setCompSearch(e.target.value)} className="pl-9 rounded-none border-0 border-b border-border/40 bg-transparent focus-visible:ring-0" />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableComponents.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">{compSearch ? "No matching components" : "Type to search components"}</p>
                  ) : (
                    availableComponents.map((it) => (
                      <button key={it.id} onClick={() => addComponent(it.code, it.description)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-accent/40 transition-colors border-b border-border/15 last:border-b-0">
                        <span className="text-sm truncate">{it.description}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground">{it.code}</span>
                          <Plus className="h-3.5 w-3.5 text-primary" />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/30 pt-4">
            <Button variant="ghost" className="rounded-xl" onClick={closeDialogs}>Cancel</Button>
            <Button onClick={submit} disabled={!form.name.trim()} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              {editing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0"><AlertTriangle className="h-5 w-5" /></div>
              <div><DialogTitle className="text-base font-bold">Delete Product?</DialogTitle><p className="text-xs text-muted-foreground mt-1">This cannot be undone.</p></div>
            </div>
          </DialogHeader>
          {toDelete && <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3"><p className="text-sm font-semibold">{toDelete.name}</p>{toDelete.code && <p className="text-[11px] font-mono text-muted-foreground mt-1">{toDelete.code}</p>}</div>}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
