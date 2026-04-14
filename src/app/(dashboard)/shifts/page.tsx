"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Users, Phone, Mail, MapPin, Pencil, Trash2,
  Sun, Sunset, Moon, CalendarDays, ChevronLeft, ChevronRight,
  UserCheck, UserX, Save, CheckCircle2, BarChart3,
  TrendingUp, Clock, CalendarCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type ShiftType        = "morning" | "evening" | "night";
type AttendanceStatus = "attended" | "absent" | null;

interface Employee {
  id: string; name: string; address: string;
  city: string; contactNumber: string; email: string;
}

interface DayRecord {
  shift:  ShiftType | null;
  status: AttendanceStatus;
}

type RecordMap = Record<string, Record<string, DayRecord>>; // date → empId → record

// ─── Shift config ─────────────────────────────────────────────────────────────
const shiftCfg: Record<ShiftType, { label: string; icon: React.ElementType; cls: string; bg: string }> = {
  morning: { label: "Morning", icon: Sun,    cls: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-500/10 border-amber-500/25"  },
  evening: { label: "Evening", icon: Sunset, cls: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/25" },
  night:   { label: "Night",   icon: Moon,   cls: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/25" },
};

// ─── Seed ─────────────────────────────────────────────────────────────────────
const seed: Employee[] = [
  { id: "EMP-001", name: "Sarah Mitchell", address: "12 Elm Street",  city: "Birmingham", contactNumber: "+44 121 456 7890", email: "sarah.m@wildtouch.co.uk"   },
  { id: "EMP-002", name: "Tom Bradley",    address: "7 Oak Avenue",   city: "Manchester", contactNumber: "+44 161 234 5678", email: "t.bradley@wildtouch.co.uk" },
  { id: "EMP-003", name: "Aisha Patel",    address: "3 Rose Lane",    city: "London",     contactNumber: "+44 207 889 0011", email: "a.patel@wildtouch.co.uk"   },
  { id: "EMP-004", name: "Kevin Shaw",     address: "29 Birch Road",  city: "Leeds",      contactNumber: "+44 113 667 4422", email: "k.shaw@wildtouch.co.uk"    },
  { id: "EMP-005", name: "Emma Ford",      address: "18 Maple Close", city: "Bristol",    contactNumber: "+44 117 554 9988", email: "e.ford@wildtouch.co.uk"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt   = (d: Date) => d.toISOString().slice(0, 10);
const today = () => fmt(new Date());
const dim   = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const fdow  = (y: number, m: number) => new Date(y, m, 1).getDay();

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from + "T00:00:00");
  const end = new Date(to   + "T00:00:00");
  while (cur <= end) { dates.push(fmt(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ShiftBadge({ shift }: { shift: ShiftType | null }) {
  if (!shift) return <span className="text-xs text-muted-foreground italic">—</span>;
  const { label, icon: Icon, cls, bg } = shiftCfg[shift];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${bg}`}>
      <Icon className={`h-3.5 w-3.5 ${cls}`} />
      <span className={`text-[11px] font-semibold ${cls}`}>{label}</span>
    </span>
  );
}

function MiniCalendar({
  year, month, selected, markedDays,
  onSelect, onPrev, onNext,
}: {
  year: number; month: number; selected: string; markedDays: Set<string>;
  onSelect: (k: string) => void; onPrev: () => void; onNext: () => void;
}) {
  const days   = dim(year, month);
  const start  = fdow(year, month);
  const mLabel = new Date(year, month, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
  const todayK = today();

  return (
    <div className="rounded-2xl border border-border/40 bg-card/70 glass p-5 space-y-4">
      <div className="flex items-center justify-between">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onPrev}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </motion.button>
        <p className="text-sm font-semibold">{mLabel}</p>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onNext}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-[10px] font-semibold uppercase text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: start }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: days }).map((_, idx) => {
          const day = idx + 1;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isSel   = key === selected;
          const isToday = key === todayK;
          const hasMark = markedDays.has(key);
          return (
            <motion.button key={key} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(key)}
              className={cn("relative flex flex-col items-center justify-center rounded-lg h-9 text-sm font-medium transition-colors",
                isSel   ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : isToday ? "bg-primary/15 text-primary border border-primary/30"
                : "hover:bg-accent/40 text-foreground")}>
              {day}
              {hasMark && !isSel && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-2 border-t border-border/20">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="h-2 w-2 rounded bg-primary/30 border border-primary/40" />Today
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />Has records
        </div>
      </div>
    </div>
  );
}

// ─── SaveBar ──────────────────────────────────────────────────────────────────
function SaveBar({
  dirty, saving, saved, label, onSave,
}: {
  dirty: boolean; saving: boolean; saved: boolean;
  label: string; onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-muted/10">
      <p className="text-xs text-muted-foreground">
        {saved && !dirty ? "All changes saved." : dirty ? "You have unsaved changes." : "No changes to save."}
      </p>
      <motion.button
        whileHover={dirty && !saving ? { scale: 1.04 } : {}}
        whileTap={dirty && !saving ? { scale: 0.94 } : {}}
        disabled={!dirty || saving}
        onClick={onSave}
        className={cn(
          "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold border transition-all min-w-[130px] justify-center",
          saving ? "bg-primary/10 border-primary/20 text-primary cursor-wait"
          : saved && !dirty ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 opacity-70 cursor-default"
          : dirty ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 cursor-pointer"
          : "opacity-25 bg-muted/20 border-border/20 text-muted-foreground cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {saving ? (
            <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full" />
              Saving…
            </motion.span>
          ) : saved && !dirty ? (
            <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />{label} Saved
            </motion.span>
          ) : (
            <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <Save className="h-4 w-4" />Save {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const emptyForm = { name: "", address: "", city: "", contactNumber: "", email: "" };

export default function ShiftsPage() {
  const [employees, setEmployees] = useState<Employee[]>(seed);
  const [nextIdx,   setNextIdx]   = useState(seed.length + 1);

  // live = current unsaved UI state; persisted = saved to "DB"
  const [live,      setLive]      = useState<RecordMap>({});
  const [persisted, setPersisted] = useState<RecordMap>({});

  // per-section save UI state
  const [shiftSaving,    setShiftSaving]    = useState(false);
  const [shiftSaved,     setShiftSaved]     = useState(false);
  const [attendSaving,   setAttendSaving]   = useState(false);
  const [attendSaved,    setAttendSaved]    = useState(false);

  // calendar state (shared between Shift Assigner + Attendance Tracker)
  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selDate,  setSelDate]  = useState(today());

  // Report date range
  const [reportFrom, setReportFrom] = useState(
    fmt(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [reportTo, setReportTo] = useState(today());

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form,      setForm]      = useState(emptyForm);
  const [formError, setFormError] = useState("");

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getLive = (date: string, empId: string): DayRecord =>
    live[date]?.[empId] ?? { shift: null, status: null };

  const getSaved = (date: string, empId: string): DayRecord =>
    persisted[date]?.[empId] ?? { shift: null, status: null };

  const patchLive = useCallback((date: string, empId: string, patch: Partial<DayRecord>) => {
    setLive((prev) => ({
      ...prev,
      [date]: { ...(prev[date] ?? {}), [empId]: { ...getLive(date, empId), ...patch } },
    }));
    setShiftSaved(false);
    setAttendSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shift dirty: any live.shift ≠ persisted.shift for selected date
  const shiftDirty = useMemo(() => employees.some((e) => {
    const l = getLive(selDate, e.id);
    const s = getSaved(selDate, e.id);
    return l.shift !== s.shift;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [live, persisted, selDate, employees]);

  // Attend dirty: any live.status ≠ persisted.status for selected date
  const attendDirty = useMemo(() => employees.some((e) => {
    const l = getLive(selDate, e.id);
    const s = getSaved(selDate, e.id);
    return l.status !== s.status;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [live, persisted, selDate, employees]);

  // Save shifts for selected date
  const saveShifts = useCallback(() => {
    setShiftSaving(true);
    setTimeout(() => {
      setPersisted((prev) => {
        const updated = { ...(prev[selDate] ?? {}) };
        employees.forEach((e) => {
          const cur = live[selDate]?.[e.id];
          const existing = prev[selDate]?.[e.id] ?? { shift: null, status: null };
          updated[e.id] = { ...existing, shift: cur?.shift ?? null };
        });
        return { ...prev, [selDate]: updated };
      });
      // sync live status from persisted for this date (keep status in live)
      setShiftSaving(false);
      setShiftSaved(true);
    }, 600);
  }, [selDate, employees, live]);

  // Save attendance for selected date
  const saveAttendance = useCallback(() => {
    setAttendSaving(true);
    setTimeout(() => {
      setPersisted((prev) => {
        const updated = { ...(prev[selDate] ?? {}) };
        employees.forEach((e) => {
          const cur = live[selDate]?.[e.id];
          const existing = prev[selDate]?.[e.id] ?? { shift: null, status: null };
          updated[e.id] = { ...existing, status: cur?.status ?? null };
        });
        return { ...prev, [selDate]: updated };
      });
      setAttendSaving(false);
      setAttendSaved(true);
    }, 600);
  }, [selDate, employees, live]);

  // ── Calendar helpers ─────────────────────────────────────────────────────────
  const prevMonth = () => { if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); } else setCalMonth((m) => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); } else setCalMonth((m) => m + 1); };

  const markedDays = useMemo(
    () => new Set(Object.entries(persisted).filter(([, r]) => Object.values(r).some((v) => v.shift)).map(([k]) => k)),
    [persisted]
  );
  const attendedDays = useMemo(
    () => new Set(Object.entries(persisted).filter(([, r]) => Object.values(r).some((v) => v.status === "attended")).map(([k]) => k)),
    [persisted]
  );

  // ── Selected date stats (from persisted) ─────────────────────────────────────
  const selPersisted   = persisted[selDate] ?? {};
  const assignedCount  = Object.values(selPersisted).filter((r) => r.shift).length;
  const attendedCount  = Object.values(selPersisted).filter((r) => r.status === "attended").length;
  const absentCount    = Object.values(selPersisted).filter((r) => r.status === "absent").length;

  const selDateLabel = new Date(selDate + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const openAdd  = () => { setEditingId(null); setForm(emptyForm); setFormError(""); setShowModal(true); };
  const openEdit = (e: Employee) => { setEditingId(e.id); setForm({ name: e.name, address: e.address, city: e.city, contactNumber: e.contactNumber, email: e.email }); setFormError(""); setShowModal(true); };
  const handleModalSave = () => {
    if (!form.name.trim())  { setFormError("Name is required.");  return; }
    if (!form.email.trim()) { setFormError("Email is required."); return; }
    if (editingId) {
      setEmployees((prev) => prev.map((e) => e.id === editingId ? { ...e, ...form } : e));
    } else {
      const id = `EMP-${String(nextIdx).padStart(3, "0")}`;
      setNextIdx((n) => n + 1);
      setEmployees((prev) => [...prev, { id, ...form }]);
    }
    setShowModal(false);
  };

  // ── Report ───────────────────────────────────────────────────────────────────
  const reportData = useMemo(() => {
    const range = datesBetween(reportFrom, reportTo);
    return employees.map((emp) => {
      let scheduled = 0, attended = 0, absent = 0, unmarked = 0;
      range.forEach((d) => {
        const r = persisted[d]?.[emp.id];
        if (!r?.shift) return;
        scheduled++;
        if (r.status === "attended") attended++;
        else if (r.status === "absent") absent++;
        else unmarked++;
      });
      const rate = scheduled > 0 ? Math.round((attended / scheduled) * 100) : null;
      return { emp, scheduled, attended, absent, unmarked, rate };
    });
  }, [employees, persisted, reportFrom, reportTo]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Shift Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employee shifts, attendance and reports</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={openAdd} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </motion.div>
      </motion.div>

      {/* Summary chips */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3">
        {[
          { icon: Users,        label: "Total Employees",   value: employees.length,   color: "text-primary bg-primary/10 border-primary/20" },
          { icon: CalendarDays, label: "Days with Shifts",  value: markedDays.size,    color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { icon: UserCheck,    label: "Attended Today",    value: Object.values(persisted[today()] ?? {}).filter((r) => r.status === "attended").length, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { icon: UserX,        label: "Absent Today",      value: Object.values(persisted[today()] ?? {}).filter((r) => r.status === "absent").length,   color: "text-red-500 bg-red-500/10 border-red-500/20" },
        ].map((chip, i) => (
          <motion.div key={chip.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.06 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}>
            <chip.icon className="h-4 w-4" />{chip.label}: {chip.value}
          </motion.div>
        ))}
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="employees">
        <TabsList className="rounded-xl bg-muted/40 border border-border/30 p-1 gap-1 h-auto flex-wrap">
          <TabsTrigger value="employees" className="rounded-lg text-sm font-medium data-active:bg-card data-active:shadow-sm data-active:text-foreground px-4 py-2">
            <Users className="h-3.5 w-3.5 mr-2" />Employees
          </TabsTrigger>
          <TabsTrigger value="shift-assigner" className="rounded-lg text-sm font-medium data-active:bg-card data-active:shadow-sm data-active:text-foreground px-4 py-2">
            <CalendarDays className="h-3.5 w-3.5 mr-2" />Shift Assigner
          </TabsTrigger>
          <TabsTrigger value="attendance-tracker" className="rounded-lg text-sm font-medium data-active:bg-card data-active:shadow-sm data-active:text-foreground px-4 py-2">
            <CalendarCheck className="h-3.5 w-3.5 mr-2" />Attendance Tracker
          </TabsTrigger>
          <TabsTrigger value="report" className="rounded-lg text-sm font-medium data-active:bg-card data-active:shadow-sm data-active:text-foreground px-4 py-2">
            <BarChart3 className="h-3.5 w-3.5 mr-2" />Report
          </TabsTrigger>
        </TabsList>

        {/* ══ EMPLOYEES ══════════════════════════════════════════════════════ */}
        <TabsContent value="employees" className="mt-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    {["Employee","Address","City","Contact Number","Email","Actions"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {employees.length === 0 ? (
                      <tr key="empty"><td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <Users className="h-10 w-10 mb-3 opacity-20" />
                          <p className="text-sm font-medium">No employees yet — add one above</p>
                        </div>
                      </td></tr>
                    ) : employees.map((emp, i) => (
                      <motion.tr key={emp.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.22, delay: i * 0.04 }}
                        className="group border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0">
                        <td className="px-5 py-3.5 align-middle">
                          <p className="text-sm font-semibold">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.id}</p>
                        </td>
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground line-clamp-2">{emp.address}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 align-middle"><p className="text-sm font-medium">{emp.city}</p></td>
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            <p className="text-xs tabular-nums">{emp.contactNumber}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            <p className="text-xs truncate max-w-[180px]">{emp.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(emp)}
                              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setEmployees((p) => p.filter((e) => e.id !== emp.id))}
                              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            {employees.length > 0 && (
              <div className="px-5 py-3 border-t border-border/20 bg-muted/10">
                <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{employees.length}</span> employees registered</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ══ SHIFT ASSIGNER ═════════════════════════════════════════════════ */}
        <TabsContent value="shift-assigner" className="mt-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-5 items-start">

            <MiniCalendar year={calYear} month={calMonth} selected={selDate} markedDays={markedDays}
              onSelect={(k) => { setSelDate(k); setShiftSaved(false); }}
              onPrev={prevMonth} onNext={nextMonth} />

            {/* Shift assignment panel */}
            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border/30 bg-muted/20">
                <p className="text-sm font-semibold">{selDateLabel}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Assign a shift to each employee for this date
                </p>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/20 flex-1">
                {employees.map((emp, i) => {
                  const rec = getLive(selDate, emp.id);
                  return (
                    <motion.div key={emp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-4 px-6 py-4">
                      {/* Avatar */}
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
                        rec.shift ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")}>
                        {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.id}</p>
                      </div>
                      {/* Current saved shift badge */}
                      <div className="w-24 shrink-0">
                        <ShiftBadge shift={getSaved(selDate, emp.id).shift} />
                      </div>
                      {/* Shift selector */}
                      <Select value={rec.shift ?? "none"}
                        onValueChange={(v) => { patchLive(selDate, emp.id, { shift: v === "none" ? null : v as ShiftType }); setShiftSaved(false); }}>
                        <SelectTrigger size="sm" className="w-36 rounded-xl border-border/40 bg-muted/30 shrink-0">
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— No shift —</SelectItem>
                          <SelectItem value="morning">🌅 Morning</SelectItem>
                          <SelectItem value="evening">🌆 Evening</SelectItem>
                          <SelectItem value="night">🌙 Night</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  );
                })}
              </div>

              {/* Save bar */}
              <SaveBar dirty={shiftDirty} saving={shiftSaving} saved={shiftSaved} label="Shifts" onSave={saveShifts} />
            </div>
          </motion.div>
        </TabsContent>

        {/* ══ ATTENDANCE TRACKER ═════════════════════════════════════════════ */}
        <TabsContent value="attendance-tracker" className="mt-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-5 items-start">

            {/* Left: date info + stats */}
            <div className="space-y-4">
              {/* Date selector — simple prev/next + display */}
              <div className="rounded-2xl border border-border/40 bg-card/70 glass p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected Date</p>
                <div className="flex items-center justify-between">
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { const d = new Date(selDate + "T00:00:00"); d.setDate(d.getDate() - 1); setSelDate(fmt(d)); setAttendSaved(false); }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </motion.button>
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {new Date(selDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(selDate + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" })}
                    </p>
                  </div>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { const d = new Date(selDate + "T00:00:00"); d.setDate(d.getDate() + 1); setSelDate(fmt(d)); setAttendSaved(false); }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Attendance stats for the selected date */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/20">
                  {[
                    { label: "Assigned", value: assignedCount, cls: "text-primary" },
                    { label: "Attended", value: attendedCount, cls: "text-emerald-500" },
                    { label: "Absent",   value: absentCount,   cls: "text-red-400" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className={`text-xl font-bold ${s.cls}`}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {assignedCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Attendance rate</span>
                      <span className="font-semibold">{Math.round((attendedCount / assignedCount) * 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-emerald-500"
                        animate={{ width: `${Math.round((attendedCount / assignedCount) * 100)}%` }}
                        transition={{ duration: 0.4 }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: attendance marking */}
            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-border/30 bg-muted/20">
                <p className="text-sm font-semibold">{selDateLabel}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Mark attendance for each employee. Shift must be assigned first in Shift Assigner.
                </p>
              </div>

              <div className="divide-y divide-border/20 flex-1">
                {employees.map((emp, i) => {
                  const liveRec  = getLive(selDate, emp.id);
                  const savedRec = getSaved(selDate, emp.id);
                  const hasShift = savedRec.shift !== null; // attendance only available if shift saved
                  const status   = liveRec.status;

                  return (
                    <motion.div key={emp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className={cn("flex items-center gap-4 px-6 py-4 transition-colors",
                        status === "attended" ? "bg-emerald-500/[0.04]" : status === "absent" ? "bg-red-500/[0.03]" : "")}>
                      {/* Avatar */}
                      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
                        status === "attended" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : status === "absent"  ? "bg-red-500/15 text-red-500"
                        : "bg-muted/50 text-muted-foreground")}>
                        {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.id}</p>
                      </div>
                      {/* Shift badge (read-only) */}
                      <div className="w-24 shrink-0">
                        <ShiftBadge shift={savedRec.shift} />
                      </div>
                      {/* Attended / Absent */}
                      <div className="flex items-center gap-2 shrink-0">
                        <motion.button
                          whileHover={hasShift ? { scale: 1.04 } : {}} whileTap={hasShift ? { scale: 0.94 } : {}}
                          disabled={!hasShift}
                          onClick={() => hasShift && patchLive(selDate, emp.id, { status: status === "attended" ? null : "attended" })}
                          className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all",
                            !hasShift ? "opacity-30 cursor-not-allowed bg-muted/20 border-border/20 text-muted-foreground"
                            : status === "attended" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm"
                            : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-emerald-400")}>
                          <UserCheck className="h-3.5 w-3.5" />Attended
                        </motion.button>
                        <motion.button
                          whileHover={hasShift ? { scale: 1.04 } : {}} whileTap={hasShift ? { scale: 0.94 } : {}}
                          disabled={!hasShift}
                          onClick={() => hasShift && patchLive(selDate, emp.id, { status: status === "absent" ? null : "absent" })}
                          className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition-all",
                            !hasShift ? "opacity-30 cursor-not-allowed bg-muted/20 border-border/20 text-muted-foreground"
                            : status === "absent" ? "bg-red-500/20 border-red-500/40 text-red-500 shadow-sm"
                            : "bg-muted/30 border-border/30 text-muted-foreground hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500")}>
                          <UserX className="h-3.5 w-3.5" />Absent
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <SaveBar dirty={attendDirty} saving={attendSaving} saved={attendSaved} label="Attendance" onSave={saveAttendance} />
            </div>
          </motion.div>
        </TabsContent>

        {/* ══ REPORT ═════════════════════════════════════════════════════════ */}
        <TabsContent value="report" className="mt-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5">

            {/* Date range picker */}
            <div className="rounded-2xl border border-border/40 bg-card/70 glass p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</Label>
                  <input type="date" value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="h-9 rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</Label>
                  <input type="date" value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="h-9 rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 [color-scheme:dark]" />
                </div>
                <div className="flex items-center gap-3 sm:ml-auto">
                  {[
                    { label: "Scheduled", value: reportData.reduce((s, r) => s + r.scheduled, 0), cls: "text-primary bg-primary/10 border-primary/20" },
                    { label: "Attended",  value: reportData.reduce((s, r) => s + r.attended,  0), cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Absent",    value: reportData.reduce((s, r) => s + r.absent,    0), cls: "text-red-500 bg-red-500/10 border-red-500/20" },
                  ].map((stat) => (
                    <div key={stat.label} className={`flex flex-col items-center rounded-xl border px-4 py-2 ${stat.cls}`}>
                      <span className="text-lg font-bold">{stat.value}</span>
                      <span className="text-[10px] font-semibold">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Report table */}
            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/20">
                      {["Employee","Scheduled Shifts","Attended","Absent","Unmarked","Attendance Rate"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.every((r) => r.scheduled === 0) ? (
                      <tr><td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                          <p className="text-sm font-medium">No saved shifts in this date range</p>
                          <p className="text-xs mt-1 opacity-60">Assign and save shifts in the Shift Assigner tab first</p>
                        </div>
                      </td></tr>
                    ) : reportData.map((row, i) => (
                      <motion.tr key={row.emp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/20 hover:bg-accent/20 transition-colors last:border-b-0">
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                              {row.emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{row.emp.name}</p>
                              <p className="text-[10px] text-muted-foreground">{row.emp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 align-middle">
                          <span className="text-sm font-semibold tabular-nums">{row.scheduled}</span>
                        </td>
                        <td className="px-5 py-3.5 align-middle">
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{row.attended}</span>
                        </td>
                        <td className="px-5 py-3.5 align-middle">
                          <span className="text-sm font-semibold text-red-500 tabular-nums">{row.absent}</span>
                        </td>
                        <td className="px-5 py-3.5 align-middle">
                          <span className="text-sm text-muted-foreground tabular-nums">{row.unmarked}</span>
                        </td>
                        <td className="px-5 py-3.5 align-middle">
                          {row.rate === null ? (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-24 rounded-full bg-muted/50 overflow-hidden">
                                <motion.div className={cn("h-full rounded-full", row.rate >= 80 ? "bg-emerald-500" : row.rate >= 50 ? "bg-amber-500" : "bg-red-500")}
                                  animate={{ width: `${row.rate}%` }} transition={{ duration: 0.5 }} />
                              </div>
                              <span className={cn("text-sm font-bold tabular-nums",
                                row.rate >= 80 ? "text-emerald-600 dark:text-emerald-400" : row.rate >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-500")}>
                                {row.rate}%
                              </span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ── Add/Edit Modal ────────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border/40">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                {formError}
              </motion.p>
            )}
            {[
              { id: "name",          label: "Full Name",      placeholder: "e.g. Jane Smith",           type: "text"  },
              { id: "address",       label: "Address",        placeholder: "e.g. 12 Oak Street",        type: "text"  },
              { id: "city",          label: "City",           placeholder: "e.g. Birmingham",           type: "text"  },
              { id: "contactNumber", label: "Contact Number", placeholder: "e.g. +44 121 000 0000",     type: "tel"   },
              { id: "email",         label: "Email",          placeholder: "e.g. jane@wildtouch.co.uk", type: "email" },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{field.label}</Label>
                <Input id={field.id} type={field.type} placeholder={field.placeholder}
                  value={form[field.id as keyof typeof form]}
                  onChange={(e) => { setFormError(""); setForm((f) => ({ ...f, [field.id]: e.target.value })); }}
                  className="rounded-xl bg-muted/30 border-border/40" />
              </div>
            ))}
          </div>
          <DialogFooter className="border-t border-border/30 bg-transparent rounded-b-2xl">
            <Button variant="outline" onClick={() => setShowModal(false)} className="rounded-xl border-border/40">Cancel</Button>
            <Button onClick={handleModalSave} className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold">
              {editingId ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
