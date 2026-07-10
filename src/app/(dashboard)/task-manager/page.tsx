"use client";

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks,
  Plus,
  Loader2,
  Trash2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Flag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EMPLOYEE_NAMES } from "@/lib/data/employees";
import { useTasks, type Task, type TaskPriority, type TaskStatus } from "@/lib/hooks/use-tasks";

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "bg-slate-500/10 border-slate-500/25 text-slate-600 dark:text-slate-300",
  medium: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
  high: "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400",
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const cellSelect = "h-8 rounded-lg border border-border/40 bg-muted/30 px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export default function TaskManagerPage() {
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks();

  const [date, setDate] = useState(today());
  const [empName, setEmpName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // Employee suggestions: the shared employee log + any names already used in tasks.
  const employeeOptions = useMemo(() => {
    const set = new Set<string>(EMPLOYEE_NAMES);
    tasks.forEach((t) => t.employeeName && set.add(t.employeeName));
    return [...set].sort();
  }, [tasks]);

  // Tasks for the selected date, ordered High → Medium → Low priority.
  const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.date === date)
        .sort((a, b) => (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, date],
  );
  const stats = useMemo(() => ({
    total: dayTasks.length,
    pending: dayTasks.filter((t) => t.status === "pending").length,
    complete: dayTasks.filter((t) => t.status === "complete").length,
  }), [dayTasks]);

  const add = useCallback(async () => {
    if (!date) { setError("Select a date first."); return; }
    if (!taskName.trim()) { setError("Enter a task name."); return; }
    if (!empName.trim()) { setError("Enter an employee name."); return; }
    setError(""); setAdding(true);
    try {
      await addTask({ date, employeeName: empName.trim(), taskName: taskName.trim(), status, priority });
      setTaskName(""); setEmpName(""); setStatus("pending"); setPriority("medium");
    } catch { setError("Could not add the task."); }
    finally { setAdding(false); }
  }, [date, empName, taskName, status, priority, addTask]);

  const toggleStatus = (t: Task) => updateTask(t.id, { status: t.status === "complete" ? "pending" : "complete" }).catch(() => {});
  const setTaskPriority = (t: Task, p: TaskPriority) => updateTask(t.id, { priority: p }).catch(() => {});

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <ListChecks className="h-7 w-7 text-primary" /> Task Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Assign dated tasks to employees · track status &amp; priority</p>
        </div>
        {/* Date selector (calendar) */}
        <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 glass px-3 py-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm font-semibold focus-visible:outline-none" />
        </div>
      </motion.div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Tasks", value: stats.total, color: "text-primary bg-primary/10 border-primary/20" },
          { label: "Pending", value: stats.pending, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: "Complete", value: stats.complete, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        ].map((c) => (
          <div key={c.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${c.color}`}>{c.label}: {c.value}</div>
        ))}
      </div>

      {/* Add task */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass p-4">
        <div className="flex items-center gap-2 mb-3"><Plus className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">New task for {new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</h3></div>
        {error && <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-1.5 border border-destructive/20 mb-3">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Employee</Label>
            <EmployeeCombo value={empName} options={employeeOptions} onChange={setEmpName} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Task name</Label>
            <Input value={taskName} onChange={(e) => setTaskName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="e.g. Pack Dudley Zoo order" className="rounded-xl bg-muted/30 border-border/40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={cn(cellSelect, "w-full h-10 rounded-xl")}>
              <option value="pending">Pending</option>
              <option value="complete">Complete</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Priority</Label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={cn(cellSelect, "w-full h-10 rounded-xl")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <Button onClick={add} disabled={adding} className="h-10 gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold disabled:opacity-60">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Task
          </Button>
        </div>
      </motion.div>

      {/* Task list for the date */}
      <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm font-medium">Loading tasks…</span></div>
        ) : dayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4"><ListChecks className="h-7 w-7 text-primary" /></div>
            <p className="text-base font-semibold">No tasks for this date</p>
            <p className="text-sm text-muted-foreground mt-1">Pick a date and add a task above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  {["", "Employee", "Task", "Priority", "Status", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {dayTasks.map((t) => (
                    <motion.tr key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className={cn("border-b border-border/15 last:border-b-0 hover:bg-accent/10", t.status === "complete" && "bg-emerald-500/[0.04]")}>
                      <td className="px-4 py-3 w-10">
                        <button onClick={() => toggleStatus(t)} title={t.status === "complete" ? "Mark pending" : "Mark complete"}>
                          {t.status === "complete" ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{t.employeeName || "—"}</td>
                      <td className={cn("px-4 py-3 text-sm", t.status === "complete" && "line-through text-muted-foreground")}>{t.taskName || "—"}</td>
                      <td className="px-4 py-3">
                        <select value={t.priority} onChange={(e) => setTaskPriority(t, e.target.value as TaskPriority)}
                          className={cn("h-7 rounded-lg border px-2 text-[11px] font-semibold capitalize focus-visible:outline-none", PRIORITY_STYLE[t.priority])}>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[10px] font-semibold capitalize", t.status === "complete" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400")}>{t.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteTask(t.id).catch(() => {})} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors ml-auto"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Employee field: type freely, or search + pick from the existing employee log. */
function EmployeeCombo({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return list.slice(0, 8);
  }, [value, options]);

  return (
    <div className="relative">
      <Input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search or type name…" className="rounded-xl bg-muted/30 border-border/40" />
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
