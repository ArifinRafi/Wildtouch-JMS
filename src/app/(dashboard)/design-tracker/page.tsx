"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool,
  Plus,
  Search,
  Loader2,
  Trash2,
  Pencil,
  ImagePlus,
  AlertTriangle,
  Save,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { uploadImage, thumbUrl } from "@/lib/cloudinary";
import { useRole } from "@/lib/hooks/use-role";
import { useDesigns, type Design, type NewDesign } from "@/lib/hooks/use-designs";

const cellInput = "h-8 w-full rounded-lg border border-border/40 bg-muted/30 px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

// Design pipeline stages (kept in sync with the server-side list). The final
// stage means the design is finished → available in River.
const DESIGN_STAGES = ["New Design Request", "Research", "Feedback", "New Design Template"] as const;
const DESIGN_FINAL_STAGE = "New Design Template";
const STAGE_STYLE: Record<string, string> = {
  "New Design Request": "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  "Research": "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  "Feedback": "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
  "New Design Template": "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
};

export default function DesignTrackerPage() {
  const { designs, loading, addDesign, updateDesign, deleteDesign } = useDesigns();
  const { isAdmin } = useRole();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"live" | "completed">("live");
  const [toDelete, setToDelete] = useState<Design | null>(null);
  const [clients, setClients] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Existing client names for the Client picker.
  useEffect(() => {
    let on = true;
    fetch("/api/clients").then((r) => (r.ok ? r.json() : [])).then((list: { name?: string }[]) => {
      if (on) setClients([...new Set(list.map((c) => c.name).filter((n): n is string => !!n))].sort());
    }).catch(() => {});
    return () => { on = false; };
  }, []);

  // Category options (managed list — add/delete).
  useEffect(() => {
    let on = true;
    fetch("/api/design-categories").then((r) => (r.ok ? r.json() : [])).then((d: { id: string; name: string }[]) => on && setCategories(d)).catch(() => {});
    return () => { on = false; };
  }, []);

  const ensureCategory = useCallback(async (name: string) => {
    const n = (name ?? "").trim();
    if (!n || categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) return;
    try {
      const res = await fetch("/api/design-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) });
      if (res.ok) {
        const c = await res.json();
        setCategories((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c].sort((a, b) => a.name.localeCompare(b.name))));
      }
    } catch { /* ignore */ }
  }, [categories]);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/design-categories/${id}`, { method: "DELETE" }).catch(() => {});
  }, []);

  // Row-level inline editing (one row at a time).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Design>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const liveCount = useMemo(() => designs.filter((d) => !d.completed).length, [designs]);
  const completedCount = useMemo(() => designs.filter((d) => d.completed).length, [designs]);

  const filtered = useMemo(() => {
    const byTab = designs.filter((d) => (tab === "completed" ? d.completed : !d.completed));
    const q = search.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter((d) => d.name.toLowerCase().includes(q) || d.categoryName.toLowerCase().includes(q) || d.notes.toLowerCase().includes(q));
  }, [designs, search, tab]);

  const startEdit = (d: Design) => { setDraft({ ...d }); setEditingId(d.id); };
  const df = (k: keyof Design, v: string) => setDraft((p) => ({ ...p, [k]: v }));

  const addRow = useCallback(async () => {
    try {
      const created = await addDesign({ name: "" });
      setTab("live");
      setNewRowId(created.id);
      setDraft({ ...created });
      setEditingId(created.id);
    } catch { /* ignore */ }
  }, [addDesign]);

  const cancelEdit = useCallback(async () => {
    if (editingId && editingId === newRowId) { try { await deleteDesign(editingId); } catch { /* ignore */ } }
    setEditingId(null); setNewRowId(null); setDraft({});
  }, [editingId, newRowId, deleteDesign]);

  const saveRow = useCallback(async () => {
    if (!editingId) return;
    setSaving(true);
    const payload: NewDesign = {
      name: (draft.name ?? "").trim(), image: draft.image ?? "",
      clientName: (draft.clientName ?? "").trim(),
      categoryName: (draft.categoryName ?? "").trim(), categoryType: draft.categoryType ?? "",
      notes: (draft.notes ?? "").trim(), addedToCodeSheet: (draft.addedToCodeSheet ?? "").trim(),
      addedToNewDesignBrochure: (draft.addedToNewDesignBrochure ?? "").trim(),
      addedToThemedBrochure: (draft.addedToThemedBrochure ?? "").trim(),
      stage: draft.stage ?? "New Design Request",
    };
    try {
      await ensureCategory(payload.categoryType ?? "");
      await updateDesign(editingId, payload);
      setEditingId(null); setNewRowId(null); setDraft({});
    }
    catch { /* ignore */ } finally { setSaving(false); }
  }, [editingId, draft, updateDesign, ensureCategory]);

  const handleUpload = useCallback(async (id: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(id);
    try { const url = await uploadImage(file); setDraft((p) => ({ ...p, image: url })); }
    catch { /* ignore */ } finally { setUploadingId(null); }
  }, []);

  // Change a design's pipeline stage; the server keeps `completed` (River) in sync.
  const setStage = (d: Design, stage: string) => { updateDesign(d.id, { stage }).catch(() => {}); };

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    try { await deleteDesign(toDelete.id); } catch { /* ignore */ }
    setToDelete(null);
  }, [toDelete, deleteDesign]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <PenTool className="h-7 w-7 text-primary" /> Design Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            New component designs · <span className="font-semibold text-primary">{designs.length}</span> total · {completedCount} completed → available in River
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={addRow} disabled={!!editingId} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-lg shadow-primary/20 disabled:opacity-50">
            <Plus className="h-4 w-4" /> Add Design
          </Button>
        </motion.div>
      </motion.div>

      {/* Tabs + search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 rounded-xl border border-border/40 bg-muted/20 p-1">
          {([["live", "Live Designs", liveCount], ["completed", "Completed", completedCount]] as const).map(([key, label, n]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors flex items-center gap-2",
                tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", tab === key ? "bg-primary/10 text-primary" : "bg-muted/60")}>{n}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input placeholder="Search designs…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl bg-card/70 glass border-border/40" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading designs…</span></div>
        ) : designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4"><PenTool className="h-7 w-7 text-primary" /></div>
            <p className="text-base font-semibold">No designs yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">Add a design row — it opens editable. Fill it in like a spreadsheet, then Save.</p>
            <Button onClick={addRow} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold"><Plus className="h-4 w-4" /> Add Design</Button>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible min-h-[360px]">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  {["Design", "Client", "Category", "Notes", "Code Sheet", "New Brochure", "Themed Brochure", "Stage", ""].map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">No {tab === "completed" ? "completed" : "live"} designs.</td></tr>
                )}
                <AnimatePresence mode="popLayout">
                  {filtered.map((d) => {
                    const editing = editingId === d.id;
                    const v = editing ? draft : d;
                    return (
                      <motion.tr key={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={cn("border-b border-border/15 last:border-b-0 align-top", d.completed && "bg-emerald-500/[0.04]", editing && "bg-primary/[0.04]")}>
                        {/* Design: image + name */}
                        <td className="px-3 py-3 min-w-[230px]">
                          <div className="flex items-center gap-3">
                            {editing ? (
                              <>
                                <button type="button" onClick={() => document.getElementById(`di-${d.id}`)?.click()} title="Upload image"
                                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border/50 bg-muted/20 hover:border-primary/40">
                                  {uploadingId === d.id ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : v.image ? <img src={thumbUrl(v.image, 96)} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-muted-foreground/40" />}
                                </button>
                                <input id={`di-${d.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(d.id, e.target.files?.[0])} />
                                <input value={v.name ?? ""} onChange={(e) => df("name", e.target.value)} placeholder="Design name…" className={cn(cellInput, "text-sm")} />
                              </>
                            ) : (
                              <>
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/20">
                                  {d.image ? <img src={thumbUrl(d.image, 96)} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-muted-foreground/40" />}
                                </span>
                                <span className="text-sm font-medium">{d.name || <span className="text-muted-foreground/50">Untitled</span>}</span>
                              </>
                            )}
                          </div>
                        </td>
                        {/* Client */}
                        <td className="px-3 py-3 min-w-[160px]">
                          {editing ? <ClientCombo value={v.clientName ?? ""} options={clients} onChange={(val) => df("clientName", val)} />
                            : <span className="text-sm">{d.clientName || <span className="text-muted-foreground/40">—</span>}</span>}
                        </td>
                        {/* Category type */}
                        <td className="px-3 py-3 min-w-[170px]">
                          {editing ? (
                            <CategoryCombo value={v.categoryType ?? ""} categories={categories}
                              onChange={(val) => df("categoryType", val)} onAddCategory={ensureCategory} onDeleteCategory={deleteCategory} />
                          ) : (
                            d.categoryType ? <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">{d.categoryType}</Badge> : <span className="text-muted-foreground/40 text-sm">—</span>
                          )}
                        </td>
                        {/* Notes */}
                        <td className="px-3 py-3 max-w-[280px]">
                          {editing ? <textarea value={v.notes ?? ""} onChange={(e) => df("notes", e.target.value)} rows={3} className={cn(cellInput, "h-auto py-1.5 resize-y min-w-[200px]")} />
                            : <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">{d.notes || "—"}</p>}
                        </td>
                        {/* Text columns */}
                        {(["addedToCodeSheet", "addedToNewDesignBrochure", "addedToThemedBrochure"] as (keyof Design)[]).map((k) => (
                          <td key={k} className="px-3 py-3 max-w-[160px]">
                            {editing ? (
                              k === "addedToThemedBrochure" ? (
                                <select value={String(v[k] ?? "")} onChange={(e) => df(k, e.target.value)} className={cellInput}>
                                  <option value="">—</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              ) : (
                                <input value={String(v[k] ?? "")} onChange={(e) => df(k, e.target.value)} className={cellInput} />
                              )
                            ) : (
                              <p className="text-xs text-muted-foreground line-clamp-2">{String(d[k] || "—")}</p>
                            )}
                          </td>
                        ))}
                        {/* Stage — while editing it lives in the draft (saved with the name);
                            on a locked row it applies immediately. */}
                        <td className="px-3 py-3 min-w-[190px]">
                          {(() => {
                            const cur = v.stage || (v.completed ? DESIGN_FINAL_STAGE : "New Design Request");
                            return (
                              <select
                                value={cur}
                                onChange={(e) => (editing ? df("stage", e.target.value) : setStage(d, e.target.value))}
                                title={cur === DESIGN_FINAL_STAGE ? "Finished — available in River" : "Set the design stage"}
                                className={cn("h-8 w-full rounded-lg border px-2 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30", STAGE_STYLE[cur] ?? STAGE_STYLE["New Design Request"])}
                              >
                                {DESIGN_STAGES.map((s) => (
                                  <option key={s} value={s}>{s === DESIGN_FINAL_STAGE ? `${s} → River` : s}</option>
                                ))}
                              </select>
                            );
                          })()}
                        </td>
                        {/* Actions: Save (editing) / Edit (locked) */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            {editing ? (
                              <>
                                <button onClick={saveRow} disabled={saving} title="Save" className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 disabled:opacity-50"><Save className="h-3.5 w-3.5" /></button>
                                <button onClick={cancelEdit} title="Cancel" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/40 border border-border/40"><X className="h-3.5 w-3.5" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(d)} disabled={!!editingId} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 disabled:opacity-40"><Pencil className="h-3.5 w-3.5" /></button>
                                {isAdmin && <button onClick={() => setToDelete(d)} disabled={!!editingId} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /></button>}
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0"><AlertTriangle className="h-5 w-5" /></div>
              <div><DialogTitle className="text-base font-bold">Delete design?</DialogTitle><p className="text-xs text-muted-foreground mt-1">This cannot be undone.</p></div>
            </div>
          </DialogHeader>
          {toDelete && <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3"><p className="text-sm font-semibold">{toDelete.name || "Untitled design"}</p></div>}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Category field: pick from the managed list, delete options, or type a new one (added on save). */
function CategoryCombo({
  value, categories, onChange, onAddCategory, onDeleteCategory,
}: {
  value: string;
  categories: { id: string; name: string }[];
  onChange: (v: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const q = value.trim().toLowerCase();
  const matches = useMemo(() => (q ? categories.filter((c) => c.name.toLowerCase().includes(q)) : categories), [q, categories]);
  const exact = categories.some((c) => c.name.toLowerCase() === q);

  return (
    <div className="relative">
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Type / select…" className={cellInput} />
      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[180px] rounded-xl border border-border/40 bg-popover shadow-xl max-h-56 overflow-y-auto">
          {value.trim() && !exact && (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onAddCategory(value.trim()); setOpen(false); }}
              className="flex w-full items-center px-3 py-1.5 text-left text-xs font-semibold text-primary hover:bg-accent/40 border-b border-border/10">+ Add &ldquo;{value.trim()}&rdquo;</button>
          )}
          {matches.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-1 px-1.5 py-0.5 hover:bg-accent/40 border-b border-border/10 last:border-b-0">
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(c.name); setOpen(false); }}
                className="flex-1 min-w-0 truncate text-left text-xs px-1.5 py-1">{c.name}</button>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => onDeleteCategory(c.id)} title="Delete category"
                className="shrink-0 p-1 text-muted-foreground/60 hover:text-destructive"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {matches.length === 0 && !value.trim() && <p className="px-3 py-2 text-xs text-muted-foreground">No categories yet.</p>}
        </div>
      )}
    </div>
  );
}

/** Client field: type freely, or search + pick from the existing client list. */
function ClientCombo({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return list.slice(0, 8);
  }, [value, options]);

  return (
    <div className="relative">
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Client / type name…" className={cellInput} />
      {open && matches.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border/40 bg-popover shadow-xl max-h-52 overflow-y-auto">
          {matches.map((o) => (
            <button key={o} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(o); setOpen(false); }}
              className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-accent/40 border-b border-border/10 last:border-b-0">{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}
