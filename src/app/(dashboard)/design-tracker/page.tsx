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
  CheckCircle2,
  RotateCcw,
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

const CATEGORY_TYPES = ["", "Glitter", "Pin Badge", "Keyring", "Magnet", "Brooch"];

const cellInput = "h-8 w-full rounded-lg border border-border/40 bg-muted/30 px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function DesignTrackerPage() {
  const { designs, loading, addDesign, updateDesign, deleteDesign } = useDesigns();
  const { isAdmin } = useRole();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"live" | "completed">("live");
  const [toDelete, setToDelete] = useState<Design | null>(null);
  const [clients, setClients] = useState<string[]>([]);

  // Existing client names for the Client picker.
  useEffect(() => {
    let on = true;
    fetch("/api/clients").then((r) => (r.ok ? r.json() : [])).then((list: { name?: string }[]) => {
      if (on) setClients([...new Set(list.map((c) => c.name).filter((n): n is string => !!n))].sort());
    }).catch(() => {});
    return () => { on = false; };
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
    };
    try { await updateDesign(editingId, payload); setEditingId(null); setNewRowId(null); setDraft({}); }
    catch { /* ignore */ } finally { setSaving(false); }
  }, [editingId, draft, updateDesign]);

  const handleUpload = useCallback(async (id: string, file: File | undefined) => {
    if (!file) return;
    setUploadingId(id);
    try { const url = await uploadImage(file); setDraft((p) => ({ ...p, image: url })); }
    catch { /* ignore */ } finally { setUploadingId(null); }
  }, []);

  const setCompleted = (d: Design, v: boolean) => { updateDesign(d.id, { completed: v }).catch(() => {}); };

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
                  {["Design", "Client", "Category", "Notes", "Code Sheet", "New Brochure", "Themed Brochure", "Completed", ""].map((h, i) => (
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
                        <td className="px-3 py-3 min-w-[150px]">
                          {editing ? (
                            <select value={v.categoryType ?? ""} onChange={(e) => df("categoryType", e.target.value)} className={cellInput}>
                              {CATEGORY_TYPES.map((t) => <option key={t} value={t}>{t || "Select type…"}</option>)}
                            </select>
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
                            {editing ? <input value={String(v[k] ?? "")} onChange={(e) => df(k, e.target.value)} className={cellInput} />
                              : <p className="text-xs text-muted-foreground line-clamp-2">{String(d[k] || "—")}</p>}
                          </td>
                        ))}
                        {/* Completed */}
                        <td className="px-3 py-3">
                          {d.completed ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400">Completed</Badge>
                              <button onClick={() => setCompleted(d, false)} title="Reopen" className="text-muted-foreground/60 hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => setCompleted(d, true)} className="h-8 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-600/90 text-white text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</Button>
                          )}
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
