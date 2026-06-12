"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Boxes,
  Package,
  PackageCheck,
  PackageX,
  Pencil,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type CatalogItem } from "@/lib/data/inventory/catalog";
import type { InventoryComponent } from "@/lib/data/inventory/types";
import { useInventory } from "@/lib/store/inventory-store";

const PAGE_SIZE = 50;

function qtyClass(qty: number) {
  if (qty === 0) return "bg-red-500/10 border-red-500/25 text-red-500";
  if (qty < 30) return "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400";
  return "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400";
}

interface EditForm {
  description: string;
  code: string;
  qtyAvailable: string;
  components: InventoryComponent[];
}

export default function AllComponentsPage() {
  // Shared inventory store (session-persistent across pages)
  const { items, updateItem, deleteItem } = useInventory();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Edit dialog
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);

  // Delete confirm
  const [toDelete, setToDelete] = useState<CatalogItem | null>(null);

  // ── Filtering ──
  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (it) =>
          it.description.toLowerCase().includes(q) ||
          it.code.toLowerCase().includes(q) ||
          it.components.some(
            (c) => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q),
          ),
      );
    }
    return list;
  }, [items, search]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  // Reset to first page when filters change
  const onSearch = (v: string) => { setSearch(v); setPage(0); };

  // ── Stats (full set) ──
  const totalQty = useMemo(() => items.reduce((s, it) => s + it.qtyAvailable, 0), [items]);
  const outOfStock = useMemo(() => items.filter((it) => it.qtyAvailable === 0).length, [items]);
  const inStock = items.length - outOfStock;

  // ── Edit ──
  const openEdit = useCallback((it: CatalogItem) => {
    setEditing(it);
    setForm({
      description: it.description,
      code: it.code,
      qtyAvailable: String(it.qtyAvailable),
      components: it.components.map((c) => ({ ...c })),
    });
  }, []);

  const saveEdit = useCallback(() => {
    if (!editing || !form) return;
    const qty = Math.max(0, parseInt(form.qtyAvailable, 10) || 0);
    const cleanedComps = form.components
      .map((c) => ({ label: c.label.trim(), code: c.code.trim() }))
      .filter((c) => c.label || c.code);
    updateItem(editing.id, {
      description: form.description.trim(),
      code: form.code.trim(),
      qtyAvailable: qty,
      components: cleanedComps,
    });
    setEditing(null);
    setForm(null);
  }, [editing, form, updateItem]);

  const updateComp = (idx: number, key: keyof InventoryComponent, value: string) => {
    setForm((f) =>
      f
        ? { ...f, components: f.components.map((c, i) => (i === idx ? { ...c, [key]: value } : c)) }
        : f,
    );
  };
  const addComp = () =>
    setForm((f) => (f ? { ...f, components: [...f.components, { label: "", code: "" }] } : f));
  const removeComp = (idx: number) =>
    setForm((f) => (f ? { ...f, components: f.components.filter((_, i) => i !== idx) } : f));

  // ── Delete ──
  const confirmDelete = useCallback(() => {
    if (!toDelete) return;
    deleteItem(toDelete.id);
    setToDelete(null);
  }, [toDelete, deleteItem]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              Inventory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              All components ·{" "}
              <span className="font-semibold text-primary">{items.length.toLocaleString()} components</span>
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/inventory/add-component">
              <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold">
                <Plus className="h-4 w-4" />
                Add Component
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stat chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Package, label: "Total Components", value: items.length, color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Boxes, label: "Total Qty Available", value: totalQty, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { icon: PackageCheck, label: "In Stock", value: inStock, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: PackageX, label: "Out of Stock", value: outOfStock, color: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20" },
        ].map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}
          >
            <chip.icon className="h-4 w-4" />
            {chip.label}: {chip.value.toLocaleString()}
          </motion.div>
        ))}
      </motion.div>

      {/* Search + category filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search component name, code, parts..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9 rounded-xl bg-card/70 glass border-border/40"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Component Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Components</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Qty Available</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {pageItems.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Package className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No components match your search</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((it, i) => (
                    <motion.tr
                      key={it.id}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.16, delay: Math.min(i, 12) * 0.012 }}
                      className="group border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0"
                    >
                      {/* Row number (global index within filtered set) */}
                      <td className="px-4 py-3 align-middle">
                        <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                          {safePage * PAGE_SIZE + i + 1}
                        </span>
                      </td>

                      {/* Component name */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
                            <Boxes className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium">{it.description || "—"}</p>
                        </div>
                      </td>

                      {/* Finished code */}
                      <td className="px-4 py-3 align-middle">
                        {it.code ? (
                          <span className="inline-flex items-center rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-xs font-mono font-semibold">
                            {it.code}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Components */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-wrap items-center gap-1 max-w-[260px]">
                          {it.components.length > 0 ? (
                            it.components.map((c, ci) => (
                              <span
                                key={ci}
                                title={c.label}
                                className="inline-flex items-center rounded-md bg-muted/30 border border-border/30 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                              >
                                {c.code}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3 align-middle text-right">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-xl px-3 py-1 text-sm font-bold tabular-nums border",
                            qtyClass(it.qtyAvailable),
                          )}
                        >
                          {it.qtyAvailable.toLocaleString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEdit(it)}
                            title="Modify"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setToDelete(it)}
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer + pagination */}
        <div className="px-5 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span>
            {filtered.length !== items.length && (
              <> (filtered from {items.length.toLocaleString()})</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium tabular-nums text-muted-foreground min-w-[90px] text-center">
              Page {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/70 hover:bg-accent/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Edit dialog ── */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) { setEditing(null); setForm(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" /> Modify Component
            </DialogTitle>
          </DialogHeader>

          {form && (
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Component Name</Label>
                <Input
                  className="rounded-xl bg-muted/30 border-border/40"
                  value={form.description}
                  onChange={(e) => setForm((f) => (f ? { ...f, description: e.target.value } : f))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</Label>
                  <Input
                    className="rounded-xl bg-muted/30 border-border/40 font-mono"
                    value={form.code}
                    onChange={(e) => setForm((f) => (f ? { ...f, code: e.target.value } : f))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty Available</Label>
                  <Input
                    type="number"
                    min="0"
                    className="rounded-xl bg-muted/30 border-border/40"
                    value={form.qtyAvailable}
                    onChange={(e) => setForm((f) => (f ? { ...f, qtyAvailable: e.target.value } : f))}
                  />
                </div>
              </div>

              {/* Components editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Components</Label>
                  <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1.5 border-border/40 h-7" onClick={addComp}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
                {form.components.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground rounded-lg border border-dashed border-border/40 bg-muted/10 px-3 py-3 text-center">
                    No components. Click &ldquo;Add&rdquo; to create one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.components.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Label (e.g. Pendant)"
                          className="rounded-xl bg-muted/30 border-border/40 text-xs"
                          value={c.label}
                          onChange={(e) => updateComp(idx, "label", e.target.value)}
                        />
                        <Input
                          placeholder="Code"
                          className="rounded-xl bg-muted/30 border-border/40 text-xs font-mono w-28"
                          value={c.code}
                          onChange={(e) => updateComp(idx, "code", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeComp(idx)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Remove component"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border/30 pt-4">
            <Button variant="ghost" className="rounded-xl" onClick={() => { setEditing(null); setForm(null); }}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Component?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">This action cannot be undone.</p>
              </div>
            </div>
          </DialogHeader>
          {toDelete && (
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
              <p className="text-sm font-semibold">{toDelete.description || "—"}</p>
              {toDelete.code && (
                <div className="mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{toDelete.code}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5 shadow-md shadow-destructive/20" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
