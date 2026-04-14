"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  Search,
  Package,
  CheckCircle2,
  Clock,
  CalendarRange,
  UserPlus,
  FileText,
  Printer,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { clients } from "@/lib/mock-data/clients";
import { useAppStore } from "@/lib/store/app-store";
import type { ProductionStaff, ProductionLog } from "@/lib/store/app-store";
import { WorkerPerformanceChart } from "@/components/production/worker-performance-chart";

// ─── Constants ────────────────────────────────────────────────────────────────
const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const now = new Date();
const yearOptions = (() => {
  const cy = now.getFullYear();
  return [cy - 2, cy - 1, cy, cy + 1].map(String);
})();

// ─── Form types ───────────────────────────────────────────────────────────────
const emptyStaffForm = { name: "", contactNumber: "", email: "", address: "", city: "" };

interface LogForm {
  staffId: string; clientId: string; product: string;
  dateOut: string; qtyOut: string; dateIn: string; qtyIn: string;
  notes: string; complete: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomeWorkersPage() {
  const store = useAppStore();
  const { staff, productionLogs: logs } = store;

  const [search,   setSearch]   = useState("");
  const [selMonth, setSelMonth] = useState(months[now.getMonth()]);
  const [selYear,  setSelYear]  = useState(String(now.getFullYear()));

  // ── Staff dialog ──
  const [staffDlgOpen,   setStaffDlgOpen]   = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm,      setStaffForm]      = useState(emptyStaffForm);
  const [staffFormError, setStaffFormError] = useState("");

  // ── Log dialog ──
  const [logDlgOpen,   setLogDlgOpen]   = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logForm,      setLogForm]      = useState<LogForm>({
    staffId: "", clientId: "", product: "",
    dateOut: "", qtyOut: "", dateIn: "", qtyIn: "", notes: "", complete: false,
  });
  const [logFormError, setLogFormError] = useState("");

  // ── Helpers ───────────────────────────────────────────────────────────────
  const staffById  = useMemo(() => new Map(staff.map((s) => [s.id, s])),  [staff]);
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), []);

  const monthPrefix = `${selYear}-${String(months.indexOf(selMonth) + 1).padStart(2, "0")}`;

  const visibleLogs = useMemo(() => {
    let list = logs.filter((l) => l.dateOut?.startsWith(monthPrefix));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => {
        const s = staffById.get(l.staffId);
        const c = clientById.get(l.clientId);
        return (
          s?.name.toLowerCase().includes(q) ||
          c?.name.toLowerCase().includes(q) ||
          l.product.toLowerCase().includes(q) ||
          l.notes.toLowerCase().includes(q)
        );
      });
    }
    return list.sort((a, b) => (b.dateOut ?? "").localeCompare(a.dateOut ?? ""));
  }, [logs, monthPrefix, search, staffById, clientById]);

  const completedCount = visibleLogs.filter((l) => l.complete).length;
  const pendingCount   = visibleLogs.length - completedCount;

  // ── Staff CRUD ──────────────────────────────────────────────────────────
  const openAddStaff = () => {
    setEditingStaffId(null);
    setStaffForm(emptyStaffForm);
    setStaffFormError("");
    setStaffDlgOpen(true);
  };

  const handleStaffSave = useCallback(() => {
    if (!staffForm.name.trim())  { setStaffFormError("Name is required.");  return; }
    if (!staffForm.email.trim()) { setStaffFormError("Email is required."); return; }
    if (editingStaffId) {
      store.updateStaff(editingStaffId, staffForm);
    } else {
      store.addStaff(staffForm);
    }
    setStaffDlgOpen(false);
  }, [staffForm, editingStaffId, store]);

  // ── Log CRUD ────────────────────────────────────────────────────────────
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const openAddLog = () => {
    setEditingLogId(null);
    setLogForm({
      staffId: "", clientId: "", product: "",
      dateOut: `${monthPrefix}-${String(now.getDate()).padStart(2, "0")}`,
      qtyOut: "", dateIn: "", qtyIn: "", notes: "", complete: false,
    });
    setLogFormError("");
    setLogDlgOpen(true);
  };

  const openEditLog = (log: ProductionLog) => {
    setEditingLogId(log.id);
    setLogForm({
      staffId:  log.staffId,
      clientId: log.clientId,
      product:  log.product,
      dateOut:  log.dateOut ?? "",
      qtyOut:   log.qtyOut?.toString() ?? "",
      dateIn:   log.dateIn ?? "",
      qtyIn:    log.qtyIn?.toString() ?? "",
      notes:    log.notes,
      complete: log.complete,
    });
    setLogFormError("");
    setLogDlgOpen(true);
  };

  const handleLogSave = useCallback(() => {
    if (!logForm.staffId)        { setLogFormError("Production staff is required."); return; }
    if (!logForm.clientId)       { setLogFormError("Client is required.");           return; }
    if (!logForm.product.trim()) { setLogFormError("Product is required.");          return; }
    if (!logForm.dateOut)        { setLogFormError("Date Out is required.");         return; }

    const built: Omit<ProductionLog, "id"> = {
      staffId:  logForm.staffId,
      clientId: logForm.clientId,
      product:  logForm.product.trim(),
      dateOut:  logForm.dateOut || null,
      qtyOut:   logForm.qtyOut  ? Number(logForm.qtyOut) : null,
      dateIn:   logForm.dateIn  || null,
      qtyIn:    logForm.qtyIn   ? Number(logForm.qtyIn)  : null,
      notes:    logForm.notes.trim(),
      complete: logForm.complete,
    };

    if (editingLogId) {
      store.updateLog(editingLogId, built);
    } else {
      store.addLog(built);
    }
    setLogDlgOpen(false);
  }, [logForm, editingLogId, store]);

  // ── Print PDF ───────────────────────────────────────────────────────────
  const printMonthLog = useCallback(() => {
    const rows = visibleLogs
      .map((log) => {
        const s = staffById.get(log.staffId);
        const c = clientById.get(log.clientId);
        return `<tr>
          <td>${s?.name ?? "—"}<br/><small>${log.staffId}</small></td>
          <td>${c?.name ?? "—"}<br/><small>${log.clientId}</small></td>
          <td>${log.product}</td>
          <td>${log.dateOut ? formatDate(log.dateOut) : "—"}</td>
          <td>${log.qtyOut ?? "—"}</td>
          <td>${log.dateIn ? formatDate(log.dateIn) : "—"}</td>
          <td>${log.qtyIn ?? "—"}</td>
          <td>${log.notes || "—"}</td>
          <td>${log.complete ? "✅ Done" : "⏳ Pending"}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><title>Wildtouch JMS — Home Workers Production Log — ${selMonth} ${selYear}</title>
<style>
  @page { size: A4 landscape; margin: 18mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 10px; color: #111; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #6d28d9; padding-bottom: 8px; margin-bottom: 14px; }
  .brand { font-size: 18px; font-weight: 800; color: #6d28d9; }
  .meta h2 { font-size: 13px; font-weight: 700; }
  .meta p  { font-size: 9px; color: #666; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #6d28d9; color: #fff; }
  thead th { padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap; }
  tbody tr:nth-child(even) { background: #f5f3ff; }
  tbody tr { border-bottom: 1px solid #e5e7eb; }
  tbody td { padding: 6px 8px; vertical-align: top; }
  tbody td small { font-size: 8px; color: #9ca3af; display: block; margin-top: 1px; }
  footer { margin-top: 16px; font-size: 8px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style></head><body>
<header>
  <div class="brand">Wildtouch JMS</div>
  <div class="meta">
    <h2>Home Workers — Production Log</h2>
    <p>${selMonth} ${selYear} | ${visibleLogs.length} log${visibleLogs.length === 1 ? "" : "s"} | Printed: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
  </div>
</header>
<table>
  <thead><tr>
    <th>Production Staff</th><th>Client</th><th>Product</th>
    <th>Date Out</th><th>Qty Out</th><th>Date In</th><th>Qty In</th>
    <th>Notes</th><th>Complete</th>
  </tr></thead>
  <tbody>${rows || `<tr><td colspan="9" style="text-align:center;padding:20px;color:#9ca3af;">No logs for this month</td></tr>`}</tbody>
</table>
<footer>Wildtouch Jewellery Management System — Confidential</footer>
</body></html>`;

    const win = window.open("", "_blank", "width=1100,height=750");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  }, [visibleLogs, selMonth, selYear, staffById, clientById]);

  // ── Render ──────────────────────────────────────────────────────────────
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
            Home Workers — Production Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Month-by-month production tracking for home-based staff
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={openAddStaff}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            Add Production Staff
          </Button>
        </motion.div>
      </motion.div>

      {/* Summary chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Users,        label: "Total Staff",     value: staff.length,       color: "text-primary bg-primary/10 border-primary/20" },
          { icon: FileText,     label: "Logs This Month", value: visibleLogs.length, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { icon: CheckCircle2, label: "Completed",       value: completedCount,     color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: Clock,        label: "Pending",         value: pendingCount,       color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
        ].map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}
          >
            <chip.icon className="h-4 w-4" />
            {chip.label}: {chip.value}
          </motion.div>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <Select value={selMonth} onValueChange={(v) => setSelMonth(v ?? selMonth)}>
            <SelectTrigger size="sm" className="w-36 rounded-xl border-border/40 bg-card/70 glass">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selYear} onValueChange={(v) => setSelYear(v ?? selYear)}>
            <SelectTrigger size="sm" className="w-24 rounded-xl border-border/40 bg-card/70 glass">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search staff, client, product, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                {["Production Staff","Client","Product","Date Out","Qty Out","Date In","Qty In","Notes","Complete","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {visibleLogs.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={10}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                      >
                        <Package className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No production logs for {selMonth} {selYear}</p>
                        <p className="text-xs mt-1 opacity-60">Click "Add Log" to create the first entry</p>
                      </motion.div>
                    </td>
                  </tr>
                ) : visibleLogs.map((log, i) => {
                  const s = staffById.get(log.staffId);
                  const c = clientById.get(log.clientId);
                  return (
                    <motion.tr
                      key={log.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.22, delay: i * 0.03 }}
                      className="group border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0"
                    >
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <p className="text-sm font-semibold">{s?.name ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{log.staffId}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="text-sm font-medium max-w-[180px] truncate">{c?.name ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{log.clientId}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="text-sm">{log.product}</p>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <p className="text-xs tabular-nums">{log.dateOut ? formatDate(log.dateOut) : "—"}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="text-sm tabular-nums font-medium">{log.qtyOut ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <p className="text-xs tabular-nums text-muted-foreground">{log.dateIn ? formatDate(log.dateIn) : "—"}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="text-sm tabular-nums">{log.qtyIn ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">{log.notes || "—"}</p>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {log.complete ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-amber-500/10 border border-amber-500/25">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Pending</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => openEditLog(log)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Edit log"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => store.deleteLog(log.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Delete log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted-foreground">
            {visibleLogs.length > 0 ? (
              <>Showing <span className="font-semibold text-foreground">{visibleLogs.length}</span> log{visibleLogs.length === 1 ? "" : "s"} for <span className="font-semibold text-foreground">{selMonth} {selYear}</span></>
            ) : (
              <>No logs for <span className="font-semibold text-foreground">{selMonth} {selYear}</span></>
            )}
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={printMonthLog}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 hover:bg-accent/60 px-4 py-2 text-xs font-semibold text-foreground transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            Print / Download PDF
          </motion.button>
        </div>
      </motion.div>

      {/* Worker Performance Chart */}
      <WorkerPerformanceChart
        logs={logs}
        staff={staff}
        monthPrefix={monthPrefix}
        monthLabel={`${selMonth} ${selYear}`}
      />

      {/* Floating Add Log button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        onClick={openAddLog}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full px-5 py-3 bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
      >
        <Plus className="h-5 w-5" />
        Add Log
      </motion.button>

      {/* ── STAFF DIALOG ──────────────────────────────────────────────────────── */}
      <Dialog open={staffDlgOpen} onOpenChange={setStaffDlgOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingStaffId ? "Edit Production Staff" : "Add Production Staff"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {staffFormError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                {staffFormError}
              </motion.p>
            )}
            {[
              { id: "name",          label: "Full Name",      placeholder: "e.g. Aman Singh",           type: "text"  },
              { id: "contactNumber", label: "Contact Number", placeholder: "e.g. +44 121 555 0101",     type: "tel"   },
              { id: "email",         label: "Email",          placeholder: "e.g. aman@wildtouch.co.uk", type: "email" },
              { id: "address",       label: "Address",        placeholder: "e.g. 12 Beech Road",        type: "text"  },
              { id: "city",          label: "City",           placeholder: "e.g. Birmingham",           type: "text"  },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</Label>
                <Input
                  id={field.id} type={field.type} placeholder={field.placeholder}
                  value={staffForm[field.id as keyof typeof staffForm]}
                  onChange={(e) => { setStaffFormError(""); setStaffForm((f) => ({ ...f, [field.id]: e.target.value })); }}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
            ))}
          </div>
          <DialogFooter className="border-t border-border/30 bg-transparent rounded-b-2xl">
            <Button variant="outline" onClick={() => setStaffDlgOpen(false)} className="rounded-xl border-border/40">Cancel</Button>
            <Button onClick={handleStaffSave} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              {editingStaffId ? "Save Changes" : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── LOG DIALOG ────────────────────────────────────────────────────────── */}
      <Dialog open={logDlgOpen} onOpenChange={setLogDlgOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl bg-card border-border/40 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingLogId ? "Edit Production Log" : "New Production Log"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {logFormError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                {logFormError}
              </motion.p>
            )}
            {/* Staff */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Production Staff</Label>
              <Select value={logForm.staffId} onValueChange={(v) => { setLogFormError(""); setLogForm((f) => ({ ...f, staffId: v ?? "" })); }}>
                <SelectTrigger className="w-full rounded-xl bg-muted/30 border-border/40"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>{staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Client */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</Label>
              <Select value={logForm.clientId} onValueChange={(v) => { setLogFormError(""); setLogForm((f) => ({ ...f, clientId: v ?? "" })); }}>
                <SelectTrigger className="w-full rounded-xl bg-muted/30 border-border/40"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Product */}
            <div className="space-y-1.5">
              <Label htmlFor="product" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</Label>
              <Input
                id="product" placeholder="e.g. Floor, Keyrings, Pin Badges"
                value={logForm.product}
                onChange={(e) => { setLogFormError(""); setLogForm((f) => ({ ...f, product: e.target.value })); }}
                className="rounded-xl bg-muted/30 border-border/40"
              />
            </div>
            {/* Date Out + Qty Out */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateOut" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date Out</Label>
                <input id="dateOut" type="date" value={logForm.dateOut}
                  onChange={(e) => { setLogFormError(""); setLogForm((f) => ({ ...f, dateOut: e.target.value })); }}
                  className="h-9 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qtyOut" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantity Out</Label>
                <Input id="qtyOut" type="number" min="0" placeholder="e.g. 200"
                  value={logForm.qtyOut}
                  onChange={(e) => setLogForm((f) => ({ ...f, qtyOut: e.target.value }))}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
            </div>
            {/* Date In + Qty In */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateIn" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Date In <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
                </Label>
                <input id="dateIn" type="date" value={logForm.dateIn}
                  onChange={(e) => setLogForm((f) => ({ ...f, dateIn: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qtyIn" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Quantity In <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
                </Label>
                <Input id="qtyIn" type="number" min="0" placeholder="e.g. 200"
                  value={logForm.qtyIn}
                  onChange={(e) => setLogForm((f) => ({ ...f, qtyIn: e.target.value }))}
                  className="rounded-xl bg-muted/30 border-border/40"
                />
              </div>
            </div>
            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</Label>
              <Textarea id="notes" placeholder="e.g. Made at home, came to collect from office..."
                value={logForm.notes}
                onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
                className="rounded-xl bg-muted/30 border-border/40 min-h-[72px]"
              />
            </div>
            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</Label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setLogForm((f) => ({ ...f, complete: false }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border transition-all",
                    !logForm.complete
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                      : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-amber-500/10"
                  )}
                >
                  <Clock className="h-4 w-4" /> Pending
                </button>
                <button type="button" onClick={() => setLogForm((f) => ({ ...f, complete: true }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold border transition-all",
                    logForm.complete
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-emerald-500/10"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" /> Complete
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border/30 bg-transparent rounded-b-2xl">
            <Button variant="outline" onClick={() => setLogDlgOpen(false)} className="rounded-xl border-border/40">Cancel</Button>
            <Button onClick={handleLogSave} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              {editingLogId ? "Save Changes" : "Add Log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
