"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  LayoutGrid,
  Plus,
  Minus,
  Trash2,
  Save,
  Box,
  Wand2,
  X,
  Columns3,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { uploadImage, thumbUrl, cloudinaryConfigured } from "@/lib/cloudinary";

interface RowState { description: string; cells: number[]; image: string }
interface SideState { label: string; columns: number; rows: RowState[] }

export default function NewPlanogramPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"setup" | "edit">("setup");
  const [name, setName] = useState("");
  const [numSides, setNumSides] = useState(4);
  const [rowsPerSide, setRowsPerSide] = useState(8);
  const [colsPerSide, setColsPerSide] = useState(4);
  const [sides, setSides] = useState<SideState[]>([]);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const inputCls = "rounded-xl bg-muted/30 border-border/40";

  const generate = () => {
    if (!name.trim()) { setError("Please enter a planogram name."); return; }
    setError("");
    const s = Math.min(12, Math.max(1, numSides));
    const r = Math.min(40, Math.max(1, rowsPerSide));
    const c = Math.min(12, Math.max(1, colsPerSide));
    setSides(Array.from({ length: s }, (_, i) => ({
      label: `Side ${i + 1}`,
      columns: c,
      rows: Array.from({ length: r }, () => ({ description: "", cells: Array(c).fill(1), image: "" })),
    })));
    setActive(0);
    setMode("edit");
  };

  const cfg = sides[active];

  const mutateSide = (fn: (s: SideState) => SideState) =>
    setSides((prev) => prev.map((s, i) => (i === active ? fn(s) : s)));

  const setDesc = (ri: number, v: string) =>
    mutateSide((s) => ({ ...s, rows: s.rows.map((r, i) => (i === ri ? { ...r, description: v } : r)) }));
  const setCell = (ri: number, ci: number, v: number) =>
    mutateSide((s) => ({ ...s, rows: s.rows.map((r, i) => (i === ri ? { ...r, cells: r.cells.map((c, j) => (j === ci ? Math.max(0, v) : c)) } : r)) }));
  const addRow = () =>
    mutateSide((s) => ({ ...s, rows: [...s.rows, { description: "", cells: Array(s.columns).fill(1), image: "" }] }));
  const setImage = (ri: number, url: string) =>
    mutateSide((s) => ({ ...s, rows: s.rows.map((r, i) => (i === ri ? { ...r, image: url } : r)) }));
  const handleUpload = async (ri: number, file: File | undefined) => {
    if (!file) return;
    const key = `${active}:${ri}`;
    setUploading((u) => ({ ...u, [key]: true }));
    setError("");
    try {
      const url = await uploadImage(file);
      setImage(ri, url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed.");
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };
  const removeRow = (ri: number) =>
    mutateSide((s) => ({ ...s, rows: s.rows.filter((_, i) => i !== ri) }));
  const addColumn = () =>
    mutateSide((s) => ({ ...s, columns: s.columns + 1, rows: s.rows.map((r) => ({ ...r, cells: [...r.cells, 1] })) }));
  const removeColumn = (ci: number) =>
    mutateSide((s) => (s.columns <= 1 ? s : ({ ...s, columns: s.columns - 1, rows: s.rows.map((r) => ({ ...r, cells: r.cells.filter((_, j) => j !== ci) })) })));

  const sideTotal = (s: SideState) => s.rows.reduce((a, r) => a + r.cells.reduce((x, y) => x + y, 0), 0);
  const grandTotal = sides.reduce((a, s) => a + sideTotal(s), 0);
  const filledRows = sides.reduce((a, s) => a + s.rows.filter((r) => r.description.trim()).length, 0);

  const save = async () => {
    if (!name.trim()) { setError("Please enter a planogram name."); return; }
    if (filledRows === 0) { setError("Add at least one product description before saving."); return; }
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/planograms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), sides }),
      });
      if (!res.ok) throw new Error("save failed");
      const created = await res.json();
      router.push(`/planogram/custom/${created.id}`);
    } catch {
      setError("Could not save the planogram. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Link href="/planogram" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Planograms
        </Link>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
          <LayoutGrid className="h-7 w-7 text-primary" />
          {mode === "setup" ? "New Planogram" : name || "New Planogram"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "setup"
            ? "Name it and choose the grid size to generate the layout."
            : `${sides.length} sides · ${grandTotal} total units · ${filledRows} products`}
        </p>
      </motion.div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 border border-destructive/20 font-medium">{error}</p>}

      {mode === "setup" ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-6 space-y-5 max-w-2xl">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Planogram Name *</Label>
            <Input className={inputCls} placeholder="e.g. Summer Seaside Stand" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sides</Label>
              <Input type="number" min={1} max={12} className={inputCls} value={numSides} onChange={(e) => setNumSides(parseInt(e.target.value, 10) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rows / side</Label>
              <Input type="number" min={1} max={40} className={inputCls} value={rowsPerSide} onChange={(e) => setRowsPerSide(parseInt(e.target.value, 10) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Columns / side</Label>
              <Input type="number" min={1} max={12} className={inputCls} value={colsPerSide} onChange={(e) => setColsPerSide(parseInt(e.target.value, 10) || 1)} />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">You can add or remove rows and columns on any side afterwards.</p>
          <Button onClick={generate} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
            <Wand2 className="h-4 w-4" /> Generate Grid
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="space-y-1.5 max-w-md">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Planogram Name</Label>
            <Input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Side tabs */}
          <div className="flex flex-wrap gap-2">
            {sides.map((s, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={cn("relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2",
                  i === active ? "bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/20" : "bg-card/70 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40")}>
                <Box className="h-3.5 w-3.5" /> {s.label}
                <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold", i === active ? "bg-white/20" : "bg-muted/60")}>{sideTotal(s)}</span>
              </button>
            ))}
          </div>

          {!cloudinaryConfigured() && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
              Image upload isn&rsquo;t configured yet — set the Cloudinary env vars to enable per-product images.
            </p>
          )}

          {/* Grid */}
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
              className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/30">
                      <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">Row</th>
                      <th className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16">Image</th>
                      <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[180px]">Description</th>
                      {Array.from({ length: cfg?.columns ?? 0 }, (_, ci) => (
                        <th key={ci} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-28">
                          <div className="flex items-center justify-center gap-1">
                            Col {ci + 1}
                            {cfg.columns > 1 && (
                              <button onClick={() => removeColumn(ci)} title="Remove column" className="text-muted-foreground/50 hover:text-destructive"><X className="h-3 w-3" /></button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-16">Total</th>
                      <th className="px-2 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {cfg?.rows.map((r, ri) => (
                      <tr key={ri} className="border-b border-border/15 last:border-b-0 hover:bg-accent/10">
                        <td className="px-3 py-2 text-center text-[11px] font-bold text-muted-foreground tabular-nums">{ri + 1}</td>
                        <td className="px-2 py-2">
                          <div className="flex justify-center">
                            {r.image ? (
                              <div className="relative group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={thumbUrl(r.image, 80)} alt="" className="h-10 w-10 rounded-lg object-cover border border-border/40" />
                                <button onClick={() => setImage(ri, "")} title="Remove image"
                                  className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors" title="Upload image">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(ri, e.target.files?.[0])} />
                                {uploading[`${active}:${ri}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                              </label>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Input value={r.description} onChange={(e) => setDesc(ri, e.target.value)} placeholder="Product name…" className="rounded-lg bg-muted/20 border-border/30 h-9 text-sm" />
                        </td>
                        {r.cells.map((v, ci) => (
                          <td key={ci} className="px-2 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => setCell(ri, ci, v - 1)} disabled={v <= 0} className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-card hover:bg-accent/60 disabled:opacity-30"><Minus className="h-3 w-3" /></button>
                              <input type="number" min={0} value={v} onChange={(e) => setCell(ri, ci, parseInt(e.target.value, 10) || 0)} className="h-7 w-12 rounded-md border border-border/40 bg-muted/30 text-center text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" />
                              <button onClick={() => setCell(ri, ci, v + 1)} className="flex h-6 w-6 items-center justify-center rounded-md border border-border/40 bg-card hover:bg-accent/60"><Plus className="h-3 w-3" /></button>
                            </div>
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center text-sm font-bold tabular-nums text-primary">{r.cells.reduce((a, b) => a + b, 0)}</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => removeRow(ri)} title="Remove row" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/20 bg-muted/10 gap-2 flex-wrap">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40" onClick={addRow}><Plus className="h-3.5 w-3.5" /> Add Row</Button>
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40" onClick={addColumn}><Columns3 className="h-3.5 w-3.5" /> Add Column</Button>
                </div>
                <p className="text-xs text-muted-foreground">Side total: <span className="font-semibold text-foreground">{cfg ? sideTotal(cfg) : 0}</span></p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" className="gap-2 rounded-xl border-border/40" onClick={() => setMode("setup")}><ArrowLeft className="h-4 w-4" /> Back to setup</Button>
            <Button onClick={save} disabled={saving} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Planogram"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
