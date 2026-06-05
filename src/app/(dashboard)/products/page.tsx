"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Boxes,
  LayoutGrid,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProducts, type CatalogProduct } from "@/lib/hooks/use-products";

const PAGE_SIZE = 50;

interface ProductForm {
  name: string;
  planogramName: string;
  segment: string;
  code: string;
  defaultQty: string;
  image: string;
}

const emptyForm = (): ProductForm => ({
  name: "", planogramName: "", segment: "", code: "", defaultQty: "1", image: "",
});

export default function ProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();

  const [search, setSearch] = useState("");
  const [planogramFilter, setPlanogramFilter] = useState("all");
  const [page, setPage] = useState(0);

  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [toDelete, setToDelete] = useState<CatalogProduct | null>(null);

  const planogramNames = useMemo(
    () => [...new Set(products.map((p) => p.planogramName).filter(Boolean))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products;
    if (planogramFilter !== "all") list = list.filter((p) => p.planogramName === planogramFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.segment.toLowerCase().includes(q) ||
          p.planogramName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, search, planogramFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const withComponents = useMemo(() => products.filter((p) => p.components.length > 0).length, [products]);

  // ── Add / Edit ──
  const openAdd = () => { setForm(emptyForm()); setAdding(true); };
  const openEdit = useCallback((p: CatalogProduct) => {
    setEditing(p);
    setForm({
      name: p.name, planogramName: p.planogramName, segment: p.segment,
      code: p.code, defaultQty: String(p.defaultQty), image: p.image ?? "",
    });
  }, []);

  const closeDialogs = () => { setEditing(null); setAdding(false); setForm(emptyForm()); };

  const submit = useCallback(async () => {
    const payload = {
      name: form.name.trim(),
      planogramName: form.planogramName.trim(),
      segment: form.segment.trim(),
      code: form.code.trim(),
      defaultQty: Math.max(0, parseInt(form.defaultQty, 10) || 0),
      image: form.image.trim() || null,
    };
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
            Product catalog · <span className="font-semibold text-primary">{products.length.toLocaleString()} products</span>
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={openAdd} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </motion.div>
      </motion.div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: Package, label: "Total Products", value: products.length, color: "text-primary bg-primary/10 border-primary/20" },
          { icon: LayoutGrid, label: "Planograms", value: planogramNames.length, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { icon: Boxes, label: "With Components", value: withComponents, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        ].map((chip) => (
          <div key={chip.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}>
            <chip.icon className="h-4 w-4" /> {chip.label}: {chip.value.toLocaleString()}
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input placeholder="Search name, code, segment, planogram…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 rounded-xl bg-card/70 glass border-border/40" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 glass px-4 py-2 text-sm font-medium hover:bg-accent/40 transition-colors focus-visible:outline-none min-w-[220px] justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{planogramFilter === "all" ? "All Planograms" : planogramFilter}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1 max-h-[320px] overflow-y-auto">
            <DropdownMenuItem onClick={() => { setPlanogramFilter("all"); setPage(0); }}
              className={cn("rounded-xl cursor-pointer text-sm", planogramFilter === "all" && "bg-primary/10 text-primary font-semibold")}>
              All Planograms
            </DropdownMenuItem>
            {planogramNames.map((name) => (
              <DropdownMenuItem key={name} onClick={() => { setPlanogramFilter(name); setPage(0); }}
                className={cn("rounded-xl cursor-pointer text-sm", planogramFilter === name && "bg-primary/10 text-primary font-semibold")}>
                {name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Loading products…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planogram</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Segment</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comp.</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {pageItems.length === 0 ? (
                    <tr><td colSpan={8}><div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Package className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm font-medium">No products match</p></div></td></tr>
                  ) : (
                    pageItems.map((p, i) => (
                      <motion.tr key={p.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15, delay: Math.min(i, 12) * 0.01 }}
                        className="border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0">
                        <td className="px-4 py-3 text-[11px] font-bold text-muted-foreground tabular-nums">{safePage * PAGE_SIZE + i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15 overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="text-sm font-medium">{p.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.planogramName ? <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">{p.planogramName}</Badge> : <span className="text-xs text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.segment || "—"}</td>
                        <td className="px-4 py-3">
                          {p.code ? <span className="inline-flex items-center rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-xs font-mono font-semibold">{p.code}</span> : <span className="text-xs text-muted-foreground/40">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">{p.defaultQty}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">{p.components.length}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(p)} title="Edit"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setToDelete(p)} title="Delete"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium tabular-nums text-muted-foreground min-w-[90px] text-center">Page {safePage + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={adding || !!editing} onOpenChange={(o) => !o && closeDialogs()}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {editing ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editing ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name *</Label>
              <Input className="rounded-xl bg-muted/30 border-border/40" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Planogram</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40" value={form.planogramName} onChange={(e) => setForm((f) => ({ ...f, planogramName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Segment</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40" value={form.segment} onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40 font-mono" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Default Qty</Label>
                <Input type="number" min={0} className="rounded-xl bg-muted/30 border-border/40" value={form.defaultQty} onChange={(e) => setForm((f) => ({ ...f, defaultQty: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image URL</Label>
              <Input className="rounded-xl bg-muted/30 border-border/40" placeholder="/planogram/…  or  https://…" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="border-t border-border/30 pt-4">
            <Button variant="ghost" className="rounded-xl" onClick={closeDialogs}>Cancel</Button>
            <Button onClick={submit} disabled={!form.name.trim()} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              {editing ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Product?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">This cannot be undone.</p>
              </div>
            </div>
          </DialogHeader>
          {toDelete && (
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
              <p className="text-sm font-semibold">{toDelete.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{toDelete.planogramName || "—"}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
