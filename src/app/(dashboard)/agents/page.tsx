"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Users,
  ChevronDown,
  Pencil,
  Trash2,
  Star,
  Briefcase,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAgents, type Agent } from "@/lib/hooks/use-agents";

function ReferredPointsBadge({ points }: { points: number }) {
  const tier =
    points >= 15
      ? { label: "Gold", cls: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" }
      : points >= 8
        ? { label: "Silver", cls: "bg-slate-400/10 border-slate-400/25 text-slate-500 dark:text-slate-300", dot: "bg-slate-400" }
        : { label: "Bronze", cls: "bg-orange-700/10 border-orange-700/25 text-orange-700 dark:text-orange-400", dot: "bg-orange-600" };
  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${tier.cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${tier.dot}`} />
        <span className="text-[11px] font-bold tabular-nums">{points}</span>
      </div>
      <span className={`text-[10px] font-semibold ${tier.cls.split(" ").filter((c) => c.startsWith("text-")).join(" ")}`}>{tier.label}</span>
    </div>
  );
}

const FILTERS = [
  { label: "All Agents", value: "all" },
  { label: "Gold (15+)", value: "gold" },
  { label: "Silver (8–14)", value: "silver" },
  { label: "Bronze (0–7)", value: "bronze" },
];

interface AgentForm { name: string; address: string; city: string; contactNumber: string; email: string; referredPoints: string }
const emptyForm = (): AgentForm => ({ name: "", address: "", city: "", contactNumber: "", email: "", referredPoints: "0" });

export default function AgentsPage() {
  const { agents, loading, createAgent, updateAgent, deleteAgent } = useAgents();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [editing, setEditing] = useState<Agent | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AgentForm>(emptyForm());
  const [toDelete, setToDelete] = useState<Agent | null>(null);

  const filtered = useMemo(() => {
    let list = [...agents];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.contactNumber.includes(q));
    }
    if (filter === "gold") list = list.filter((a) => a.referredPoints >= 15);
    else if (filter === "silver") list = list.filter((a) => a.referredPoints >= 8 && a.referredPoints < 15);
    else if (filter === "bronze") list = list.filter((a) => a.referredPoints < 8);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [agents, search, filter]);

  const totalPoints = agents.reduce((s, a) => s + a.referredPoints, 0);

  const openAdd = () => { setForm(emptyForm()); setAdding(true); };
  const openEdit = useCallback((a: Agent) => {
    setEditing(a);
    setForm({ name: a.name, address: a.address, city: a.city, contactNumber: a.contactNumber, email: a.email, referredPoints: String(a.referredPoints) });
  }, []);
  const closeDialogs = () => { setEditing(null); setAdding(false); setForm(emptyForm()); };

  const submit = useCallback(async () => {
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      referredPoints: Math.max(0, parseInt(form.referredPoints, 10) || 0),
    };
    if (!payload.name) return;
    if (editing) await updateAgent(editing.id, payload);
    else await createAgent(payload);
    closeDialogs();
  }, [form, editing, updateAgent, createAgent]);

  const confirmDelete = useCallback(() => {
    if (!toDelete) return;
    deleteAgent(toDelete.id);
    setToDelete(null);
  }, [toDelete, deleteAgent]);

  const dialogOpen = adding || !!editing;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" /> Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{agents.length} registered agents</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={openAdd} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> Add Agent
          </Button>
        </motion.div>
      </motion.div>

      {/* Chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: Users, label: "Total Agents", value: agents.length, color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Star, label: "Gold", value: agents.filter((a) => a.referredPoints >= 15).length, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { icon: Star, label: "Silver", value: agents.filter((a) => a.referredPoints >= 8 && a.referredPoints < 15).length, color: "text-slate-500 dark:text-slate-300 bg-slate-400/10 border-slate-400/20" },
          { icon: Briefcase, label: "Total Referrals", value: totalPoints, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
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
          <Input placeholder="Search agents…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/70 glass border-border/40" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 glass px-4 py-2 text-sm font-medium hover:bg-accent/40 transition-colors focus-visible:outline-none min-w-[180px] justify-between">
            <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><span>{FILTERS.find((f) => f.value === filter)?.label}</span></div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1">
            {FILTERS.map((f) => (
              <DropdownMenuItem key={f.value} onClick={() => setFilter(f.value)} className={cn("rounded-xl cursor-pointer text-sm", filter === f.value && "bg-primary/10 text-primary font-semibold")}>{f.label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">Loading agents…</span></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Agent</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">City</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Referred</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6}><div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Users className="h-10 w-10 mb-3 opacity-20" /><p className="text-sm font-medium">No agents — add one</p></div></td></tr>
                  ) : (
                    filtered.map((a, i) => (
                      <motion.tr key={a.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15, delay: Math.min(i, 12) * 0.01 }}
                        className="border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0">
                        <td className="px-5 py-3 text-[11px] font-bold text-muted-foreground tabular-nums">{i + 1}</td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium">{a.name}</p>
                          <p className="text-[11px] text-muted-foreground">{a.email} <span className="font-mono">· {a.id}</span></p>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{a.city || "—"}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{a.contactNumber || "—"}</td>
                        <td className="px-5 py-3"><ReferredPointsBadge points={a.referredPoints} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => openEdit(a)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setToDelete(a)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
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
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialogs()}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {editing ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
              {editing ? "Edit Agent" : "Add Agent"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name *</Label>
              <Input className="rounded-xl bg-muted/30 border-border/40" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referred Points</Label>
                <Input type="number" min={0} className="rounded-xl bg-muted/30 border-border/40" value={form.referredPoints} onChange={(e) => setForm((f) => ({ ...f, referredPoints: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</Label>
              <Input className="rounded-xl bg-muted/30 border-border/40" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Number</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40" value={form.contactNumber} onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                <Input className="rounded-xl bg-muted/30 border-border/40" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border/30 pt-4">
            <Button variant="ghost" className="rounded-xl" onClick={closeDialogs}>Cancel</Button>
            <Button onClick={submit} disabled={!form.name.trim()} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">{editing ? "Save Changes" : "Add Agent"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0"><AlertTriangle className="h-5 w-5" /></div>
              <div><DialogTitle className="text-base font-bold">Delete Agent?</DialogTitle><p className="text-xs text-muted-foreground mt-1">This cannot be undone.</p></div>
            </div>
          </DialogHeader>
          {toDelete && <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3"><p className="text-sm font-semibold">{toDelete.name}</p><p className="text-[11px] font-mono text-muted-foreground mt-1">{toDelete.id}</p></div>}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl gap-1.5" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
