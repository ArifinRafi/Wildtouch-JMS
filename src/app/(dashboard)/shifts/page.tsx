"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  CalendarDays,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useEmployees, type Employee, type EmployeeInput } from "@/lib/hooks/use-employees";
import { useShifts, type Shift, type ShiftAttendance, type ShiftInput } from "@/lib/hooks/use-shifts";

const inputClass = "h-10 rounded-xl border border-border/40 bg-muted/30 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localMonth(date = new Date()) {
  return localDate(date).slice(0, 7);
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

function moveMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function durationTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function calculatePreview(startTime: string, finishTime: string, lunchTime: string) {
  if (!startTime || !finishTime) return { hours: 0, chargeableHours: 0 };
  const start = minutesFromTime(startTime);
  const finish = minutesFromTime(finishTime);
  const duration = finish >= start ? finish - start : finish + 24 * 60 - start;
  const lunch = minutesFromTime(lunchTime);
  return {
    hours: Number((duration / 60).toFixed(2)),
    chargeableHours: Number((Math.max(0, duration - lunch) / 60).toFixed(2)),
  };
}

function decimalHours(value: number) {
  return value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function dateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function dayLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
}

const emptyEmployee: EmployeeInput = { name: "", address: "", city: "", contactNumber: "", email: "" };

interface ShiftForm {
  employeeId: string;
  date: string;
  startTime: string;
  finishTime: string;
  lunchTime: string;
  extraHours: string;
  notes: string;
  attendance: ShiftAttendance;
}

const emptyShift = (employeeId = ""): ShiftForm => ({
  employeeId,
  date: localDate(),
  startTime: "09:00",
  finishTime: "17:00",
  lunchTime: "00:30",
  extraHours: "0",
  notes: "",
  attendance: "unmarked",
});

export default function ShiftsPage() {
  const { employees, loading: employeesLoading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { shifts, loading: shiftsLoading, createShift, updateShift, deleteShift } = useShifts();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(localMonth());
  const [shiftForm, setShiftForm] = useState<ShiftForm>(emptyShift());
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftSaving, setShiftSaving] = useState(false);
  const [shiftError, setShiftError] = useState("");
  const [employeeDialog, setEmployeeDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeInput>(emptyEmployee);
  const [employeeError, setEmployeeError] = useState("");
  const [employeeSaving, setEmployeeSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "employee" | "shift"; id: string; label: string } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [reportFrom, setReportFrom] = useState(`${localMonth()}-01`);
  const [reportTo, setReportTo] = useState(localDate());
  const [reportEmployeeId, setReportEmployeeId] = useState("all");
  const [dailyDutiesDate, setDailyDutiesDate] = useState(localDate());
  const [activeTab, setActiveTab] = useState("shift-editor");

  useEffect(() => {
    if (!selectedEmployeeId && employees[0]) {
      setSelectedEmployeeId(employees[0].id);
      setShiftForm((current) => ({ ...current, employeeId: employees[0].id }));
    }
  }, [employees, selectedEmployeeId]);

  const preview = useMemo(
    () => calculatePreview(shiftForm.startTime, shiftForm.finishTime, shiftForm.lunchTime),
    [shiftForm.startTime, shiftForm.finishTime, shiftForm.lunchTime],
  );
  const monthRange = useMemo(() => monthBounds(selectedMonth), [selectedMonth]);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) ?? null;
  const employeeMonthShifts = useMemo(
    () => shifts.filter((shift) => shift.employeeId === selectedEmployeeId && shift.date >= monthRange.from && shift.date <= monthRange.to),
    [shifts, selectedEmployeeId, monthRange],
  );
  const monthShifts = useMemo(
    () => shifts.filter((shift) => shift.date >= monthRange.from && shift.date <= monthRange.to),
    [shifts, monthRange],
  );
  const reportShifts = useMemo(
    () => shifts.filter((shift) => shift.date >= reportFrom && shift.date <= reportTo && (reportEmployeeId === "all" || shift.employeeId === reportEmployeeId)),
    [shifts, reportFrom, reportTo, reportEmployeeId],
  );
  const reportRows = useMemo(() => employees
    .filter((employee) => reportEmployeeId === "all" || employee.id === reportEmployeeId)
    .map((employee) => {
      const records = reportShifts.filter((shift) => shift.employeeId === employee.id);
      return {
        employee,
        shifts: records.length,
        hours: records.reduce((sum, shift) => sum + shift.hours, 0),
        lunchMinutes: records.reduce((sum, shift) => sum + shift.lunchMinutes, 0),
        extraHours: records.reduce((sum, shift) => sum + shift.extraHours, 0),
        chargeableHours: records.reduce((sum, shift) => sum + shift.chargeableHours, 0),
        attended: records.filter((shift) => shift.attendance === "attended").length,
        absent: records.filter((shift) => shift.attendance === "absent").length,
      };
    }), [employees, reportShifts, reportEmployeeId]);
  const dailyDuties = useMemo(
    () => shifts.filter((shift) => shift.date === dailyDutiesDate).sort((a, b) => a.startTime.localeCompare(b.startTime) || a.employeeName.localeCompare(b.employeeName)),
    [shifts, dailyDutiesDate],
  );

  const resetShiftForm = useCallback((employeeId = selectedEmployeeId) => {
    setEditingShiftId(null);
    setShiftForm(emptyShift(employeeId));
    setShiftError("");
  }, [selectedEmployeeId]);

  const chooseEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    resetShiftForm(employeeId);
  };

  const submitShift = useCallback(async () => {
    if (!shiftForm.employeeId) { setShiftError("Select an employee."); return; }
    if (!shiftForm.date || !shiftForm.startTime || !shiftForm.finishTime) { setShiftError("Date, start time and finish time are required."); return; }
    if (!/^\d{2}:[0-5]\d$/.test(shiftForm.lunchTime) || minutesFromTime(shiftForm.lunchTime) > 24 * 60) { setShiftError("Enter lunch time as HH:MM, for example 00:30."); return; }
    setShiftSaving(true);
    setShiftError("");
    const input: ShiftInput = {
      employeeId: shiftForm.employeeId,
      date: shiftForm.date,
      startTime: shiftForm.startTime,
      finishTime: shiftForm.finishTime,
      lunchMinutes: minutesFromTime(shiftForm.lunchTime),
      extraHours: Math.max(0, Number(shiftForm.extraHours) || 0),
      notes: shiftForm.notes.trim(),
      attendance: shiftForm.attendance,
    };
    try {
      if (editingShiftId) await updateShift(editingShiftId, input);
      else await createShift(input);
      setSelectedEmployeeId(input.employeeId);
      setSelectedMonth(input.date.slice(0, 7));
      resetShiftForm(input.employeeId);
    } catch (error) {
      setShiftError(error instanceof Error ? error.message : "Could not save shift.");
    } finally {
      setShiftSaving(false);
    }
  }, [shiftForm, editingShiftId, updateShift, createShift, resetShiftForm]);

  const editShift = (shift: Shift) => {
    setEditingShiftId(shift.id);
    setSelectedEmployeeId(shift.employeeId);
    setSelectedMonth(shift.date.slice(0, 7));
    setShiftForm({
      employeeId: shift.employeeId,
      date: shift.date,
      startTime: shift.startTime,
      finishTime: shift.finishTime,
      lunchTime: durationTime(shift.lunchMinutes),
      extraHours: String(shift.extraHours),
      notes: shift.notes,
      attendance: shift.attendance,
    });
    setShiftError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeAttendance = async (shift: Shift, attendance: ShiftAttendance) => {
    setShiftError("");
    try {
      await updateShift(shift.id, { attendance });
    } catch (error) {
      setShiftError(error instanceof Error ? error.message : "Could not update attendance.");
    }
  };

  const openEmployee = (employee?: Employee) => {
    setEditingEmployee(employee ?? null);
    setEmployeeForm(employee ? { name: employee.name, address: employee.address, city: employee.city, contactNumber: employee.contactNumber, email: employee.email } : emptyEmployee);
    setEmployeeError("");
    setEmployeeDialog(true);
  };

  const submitEmployee = async () => {
    if (!employeeForm.name.trim()) { setEmployeeError("Name is required."); return; }
    setEmployeeSaving(true);
    setEmployeeError("");
    try {
      const saved = editingEmployee
        ? await updateEmployee(editingEmployee.id, employeeForm)
        : await createEmployee(employeeForm);
      setSelectedEmployeeId(saved.id);
      setShiftForm((current) => ({ ...current, employeeId: saved.id }));
      setEmployeeDialog(false);
    } catch (error) {
      setEmployeeError(error instanceof Error ? error.message : "Could not save employee.");
    } finally {
      setEmployeeSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      if (deleteTarget.type === "shift") await deleteShift(deleteTarget.id);
      else await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete this record.");
    }
  };

  const loading = employeesLoading || shiftsLoading;
  const totalChargeable = monthShifts.reduce((sum, shift) => sum + shift.chargeableHours, 0);

  return (
    <div className="space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><CalendarClock className="h-7 w-7 text-primary" />Shift Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">Individual employee timesheets, attendance and monthly hours</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setActiveTab("daily-duties")} className="gap-2 rounded-xl border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"><CalendarDays className="h-4 w-4" />Daily Duties</Button>
          <Button onClick={() => openEmployee()} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 font-semibold text-white"><Plus className="h-4 w-4" />Add Employee</Button>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {[
          { icon: Users, label: "Employees", value: employees.length, cls: "text-primary bg-primary/10 border-primary/20" },
          { icon: CalendarClock, label: "Shifts This Month", value: monthShifts.length, cls: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
          { icon: Clock, label: "Chargeable Hours", value: decimalHours(totalChargeable), cls: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { icon: UserCheck, label: "Attended", value: monthShifts.filter((shift) => shift.attendance === "attended").length, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        ].map((item) => <div key={item.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${item.cls}`}><item.icon className="h-4 w-4" />{item.label}: {item.value}</div>)}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/40 bg-card/70 py-24 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading shift records…</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto flex-wrap gap-1 rounded-xl border border-border/30 bg-muted/40 p-1">
            <TabsTrigger value="shift-editor" className="rounded-lg px-4 py-2"><CalendarClock className="mr-2 h-3.5 w-3.5" />Shift Editor</TabsTrigger>
            <TabsTrigger value="employees" className="rounded-lg px-4 py-2"><Users className="mr-2 h-3.5 w-3.5" />Employees</TabsTrigger>
            <TabsTrigger value="daily-duties" className="rounded-lg px-4 py-2"><CalendarDays className="mr-2 h-3.5 w-3.5" />Daily Duties</TabsTrigger>
            <TabsTrigger value="report" className="rounded-lg px-4 py-2"><BarChart3 className="mr-2 h-3.5 w-3.5" />Report</TabsTrigger>
          </TabsList>

          <TabsContent value="shift-editor" className="mt-5 space-y-5">
            <div className="rounded-2xl border border-border/40 bg-card/70 p-5 glass">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="text-base font-semibold">{editingShiftId ? "Edit employee shift" : "Add employee shift"}</h2><p className="text-xs text-muted-foreground">Fields follow the monthly timesheet format.</p></div>
                {editingShiftId && <Button variant="outline" className="rounded-xl" onClick={() => resetShiftForm()}>Cancel editing</Button>}
              </div>
              {shiftError && <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{shiftError}</p>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-1.5 xl:col-span-2"><Label>Employee name *</Label><select value={shiftForm.employeeId} onChange={(event) => chooseEmployee(event.target.value)} className={cn(inputClass, "w-full")}><option value="">Select employee…</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} ({employee.id})</option>)}</select></div>
                <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={shiftForm.date} onChange={(event) => setShiftForm((current) => ({ ...current, date: event.target.value }))} className={inputClass} /></div>
                <div className="space-y-1.5"><Label>Start Time *</Label><Input type="time" value={shiftForm.startTime} onChange={(event) => setShiftForm((current) => ({ ...current, startTime: event.target.value }))} className={inputClass} /></div>
                <div className="space-y-1.5"><Label>Finish Time *</Label><Input type="time" value={shiftForm.finishTime} onChange={(event) => setShiftForm((current) => ({ ...current, finishTime: event.target.value }))} className={inputClass} /></div>
                <div className="space-y-1.5"><Label>Lunch Time (HH:MM)</Label><Input type="text" inputMode="numeric" placeholder="00:30" pattern="[0-9]{2}:[0-9]{2}" value={shiftForm.lunchTime} onChange={(event) => setShiftForm((current) => ({ ...current, lunchTime: event.target.value }))} className={inputClass} /></div>
                <div className="space-y-1.5"><Label>Extra Hours</Label><Input type="number" min={0} step="0.25" value={shiftForm.extraHours} onChange={(event) => setShiftForm((current) => ({ ...current, extraHours: event.target.value }))} className={inputClass} /></div>
                <div className="space-y-1.5"><Label>Attendance</Label><select value={shiftForm.attendance} onChange={(event) => setShiftForm((current) => ({ ...current, attendance: event.target.value as ShiftAttendance }))} className={cn(inputClass, "w-full")}><option value="unmarked">Unmarked</option><option value="attended">Attended</option><option value="absent">Absent</option></select></div>
                <div className="space-y-1.5 xl:col-span-2"><Label>Notes</Label><Input value={shiftForm.notes} onChange={(event) => setShiftForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional shift note…" className={inputClass} /></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-4">
                <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-muted/50 px-3 py-2">Hours: <strong>{decimalHours(preview.hours)}</strong></span><span className="rounded-lg bg-primary/10 px-3 py-2 text-primary">Chargeable: <strong>{decimalHours(preview.chargeableHours)}</strong></span></div>
                <Button onClick={submitShift} disabled={shiftSaving} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 font-semibold text-white">{shiftSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingShiftId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{editingShiftId ? "Save Shift" : "Add Shift"}</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 bg-muted/20 px-5 py-4">
                <div><h2 className="text-sm font-semibold">{selectedEmployee ? `${selectedEmployee.name}'s shifts` : "Select an employee"}</h2><p className="text-[11px] text-muted-foreground">A separate monthly shift editor for the selected employee</p></div>
                <div className="flex items-center gap-2"><button onClick={() => setSelectedMonth((month) => moveMonth(month, -1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button><Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="w-40 rounded-xl bg-muted/30" /><button onClick={() => setSelectedMonth((month) => moveMonth(month, 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] border-collapse">
                  <thead><tr className="border-b border-border/30 bg-muted/10">{["Day", "Date", "Start Time", "Finish Time", "Hours", "Lunch Time", "Extra Hours", "Chargeable Hours", "Notes", "Attendance", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{heading}</th>)}</tr></thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {employeeMonthShifts.length === 0 ? <tr><td colSpan={11}><div className="py-16 text-center text-sm text-muted-foreground">No shifts saved for this employee in {new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.</div></td></tr> : employeeMonthShifts.map((shift) => (
                        <motion.tr key={shift.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-border/20 last:border-b-0 hover:bg-accent/10">
                          <td className="px-4 py-3 text-sm font-medium">{dayLabel(shift.date)}</td><td className="px-4 py-3 text-sm text-muted-foreground">{dateLabel(shift.date)}</td><td className="px-4 py-3 font-mono text-sm">{shift.startTime}</td><td className="px-4 py-3 font-mono text-sm">{shift.finishTime}</td><td className="px-4 py-3 text-sm font-semibold tabular-nums">{decimalHours(shift.hours)}</td><td className="px-4 py-3 font-mono text-sm">{durationTime(shift.lunchMinutes)}</td><td className="px-4 py-3 text-sm tabular-nums">{decimalHours(shift.extraHours)}</td><td className="px-4 py-3 text-sm font-semibold text-primary tabular-nums">{decimalHours(shift.chargeableHours)}</td><td className="max-w-[220px] px-4 py-3 text-sm text-muted-foreground"><span className="line-clamp-2">{shift.notes || "—"}</span></td>
                          <td className="px-4 py-3"><select aria-label={`Attendance for ${shift.date}`} value={shift.attendance} onChange={(event) => changeAttendance(shift, event.target.value as ShiftAttendance)} className="h-8 rounded-lg border border-border/40 bg-muted/30 px-2 text-xs"><option value="unmarked">Unmarked</option><option value="attended">Attended</option><option value="absent">Absent</option></select></td>
                          <td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => editShift(shift)} title="Edit shift" className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDeleteTarget({ type: "shift", id: shift.id, label: `${shift.employeeName}'s shift on ${dateLabel(shift.date)}` })} title="Delete shift" className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                  {employeeMonthShifts.length > 0 && <tfoot><tr className="border-t border-border/40 bg-muted/20 font-semibold"><td colSpan={4} className="px-4 py-3 text-right text-xs uppercase tracking-wide text-muted-foreground">Monthly totals</td><td className="px-4 py-3 tabular-nums">{decimalHours(employeeMonthShifts.reduce((sum, shift) => sum + shift.hours, 0))}</td><td className="px-4 py-3 font-mono">{durationTime(employeeMonthShifts.reduce((sum, shift) => sum + shift.lunchMinutes, 0))}</td><td className="px-4 py-3 tabular-nums">{decimalHours(employeeMonthShifts.reduce((sum, shift) => sum + shift.extraHours, 0))}</td><td className="px-4 py-3 text-primary tabular-nums">{decimalHours(employeeMonthShifts.reduce((sum, shift) => sum + shift.chargeableHours, 0))}</td><td colSpan={3} /></tr></tfoot>}
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="mt-5">
            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse"><thead><tr className="border-b border-border/30 bg-muted/20">{["Employee", "Address", "City", "Contact Number", "Email", "Actions"].map((heading) => <th key={heading} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{heading}</th>)}</tr></thead><tbody>{employees.map((employee) => <tr key={employee.id} className="border-b border-border/20 last:border-b-0 hover:bg-accent/10"><td className="px-5 py-3"><p className="text-sm font-semibold">{employee.name}</p><p className="text-[10px] text-muted-foreground">{employee.id}</p></td><td className="px-5 py-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{employee.address || "—"}</span></td><td className="px-5 py-3 text-sm">{employee.city || "—"}</td><td className="px-5 py-3 text-xs"><span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{employee.contactNumber || "—"}</span></td><td className="px-5 py-3 text-xs"><span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{employee.email || "—"}</span></td><td className="px-5 py-3"><div className="flex gap-1"><button onClick={() => openEmployee(employee)} title="Edit employee" className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => setDeleteTarget({ type: "employee", id: employee.id, label: employee.name })} title="Delete employee" className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table></div></div>
          </TabsContent>

          <TabsContent value="daily-duties" className="mt-5 space-y-5">
            <div className="rounded-2xl border border-border/40 bg-card/70 p-5 glass">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-semibold"><CalendarDays className="h-5 w-5 text-primary" />Daily Shifts and Duties</h2>
                  <p className="mt-1 text-xs text-muted-foreground">See every employee working on one specific date.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Duty date</Label>
                  <Input type="date" value={dailyDutiesDate} onChange={(event) => setDailyDutiesDate(event.target.value)} className="w-48 rounded-xl bg-muted/30" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/30 pt-4 text-xs">
                <span className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 font-semibold text-primary">Shifts: {dailyDuties.length}</span>
                <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">Attended: {dailyDuties.filter((shift) => shift.attendance === "attended").length}</span>
                <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 font-semibold text-red-500">Absent: {dailyDuties.filter((shift) => shift.attendance === "absent").length}</span>
                <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 font-semibold text-amber-600 dark:text-amber-400">Chargeable Hours: {decimalHours(dailyDuties.reduce((sum, shift) => sum + shift.chargeableHours, 0))}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden">
              {dailyDuties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                  <CalendarDays className="mb-3 h-11 w-11 opacity-25" />
                  <p className="text-sm font-medium">No shifts or duties on {dateLabel(dailyDutiesDate)}</p>
                  <p className="mt-1 text-xs">Choose another date or add a shift in the Shift Editor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead><tr className="border-b border-border/30 bg-muted/20">{["Employee", "Shift", "Hours", "Lunch", "Extra Hours", "Chargeable Hours", "Duty / Notes", "Attendance"].map((heading) => <th key={heading} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{heading}</th>)}</tr></thead>
                    <tbody>
                      {dailyDuties.map((shift) => (
                        <tr key={shift.id} className="border-b border-border/20 last:border-b-0 hover:bg-accent/10">
                          <td className="px-5 py-4"><p className="text-sm font-semibold">{shift.employeeName}</p><p className="text-[10px] text-muted-foreground">{shift.employeeId}</p></td>
                          <td className="px-5 py-4 font-mono text-sm">{shift.startTime}–{shift.finishTime}</td>
                          <td className="px-5 py-4 text-sm font-semibold tabular-nums">{decimalHours(shift.hours)}</td>
                          <td className="px-5 py-4 font-mono text-sm">{durationTime(shift.lunchMinutes)}</td>
                          <td className="px-5 py-4 text-sm tabular-nums">{decimalHours(shift.extraHours)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-primary tabular-nums">{decimalHours(shift.chargeableHours)}</td>
                          <td className="max-w-[300px] px-5 py-4 text-sm text-muted-foreground">{shift.notes || "—"}</td>
                          <td className="px-5 py-4"><span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize", shift.attendance === "attended" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : shift.attendance === "absent" ? "border-red-500/25 bg-red-500/10 text-red-500" : "border-border/40 bg-muted/30 text-muted-foreground")}>{shift.attendance}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="report" className="mt-5 space-y-5">
            <div className="rounded-2xl border border-border/40 bg-card/70 p-5 glass"><div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="space-y-1.5"><Label>From</Label><Input type="date" value={reportFrom} onChange={(event) => setReportFrom(event.target.value)} className={inputClass} /></div><div className="space-y-1.5"><Label>To</Label><Input type="date" value={reportTo} onChange={(event) => setReportTo(event.target.value)} className={inputClass} /></div><div className="space-y-1.5"><Label>Employee</Label><select value={reportEmployeeId} onChange={(event) => setReportEmployeeId(event.target.value)} className={cn(inputClass, "w-full")}><option value="all">All employees</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></div></div></div>
            <div className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse"><thead><tr className="border-b border-border/30 bg-muted/20">{["Employee", "Shifts", "Hours", "Lunch", "Extra Hours", "Chargeable Hours", "Attended", "Absent"].map((heading) => <th key={heading} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{heading}</th>)}</tr></thead><tbody>{reportRows.map((row) => <tr key={row.employee.id} className="border-b border-border/20 last:border-b-0"><td className="px-5 py-3"><p className="text-sm font-semibold">{row.employee.name}</p><p className="text-[10px] text-muted-foreground">{row.employee.id}</p></td><td className="px-5 py-3 font-semibold tabular-nums">{row.shifts}</td><td className="px-5 py-3 tabular-nums">{decimalHours(row.hours)}</td><td className="px-5 py-3 font-mono">{durationTime(row.lunchMinutes)}</td><td className="px-5 py-3 tabular-nums">{decimalHours(row.extraHours)}</td><td className="px-5 py-3 font-semibold text-primary tabular-nums">{decimalHours(row.chargeableHours)}</td><td className="px-5 py-3"><span className="text-emerald-600 dark:text-emerald-400">{row.attended}</span></td><td className="px-5 py-3"><span className="text-red-500">{row.absent}</span></td></tr>)}</tbody></table></div>{reportShifts.length === 0 && <div className="border-t border-border/20 py-12 text-center text-sm text-muted-foreground">No saved shifts in this date range.</div>}</div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={employeeDialog} onOpenChange={setEmployeeDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl"><DialogHeader><DialogTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>{employeeError && <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{employeeError}</p>}<div className="space-y-3">{[
          { key: "name", label: "Full Name *", type: "text" }, { key: "address", label: "Address", type: "text" }, { key: "city", label: "City", type: "text" }, { key: "contactNumber", label: "Contact Number", type: "tel" }, { key: "email", label: "Email", type: "email" },
        ].map((field) => <div key={field.key} className="space-y-1.5"><Label>{field.label}</Label><Input type={field.type} value={employeeForm[field.key as keyof EmployeeInput]} onChange={(event) => setEmployeeForm((current) => ({ ...current, [field.key]: event.target.value }))} className="rounded-xl bg-muted/30" /></div>)}</div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setEmployeeDialog(false)}>Cancel</Button><Button onClick={submitEmployee} disabled={employeeSaving} className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 font-semibold text-white">{employeeSaving && <Loader2 className="h-4 w-4 animate-spin" />}{editingEmployee ? "Save Changes" : "Add Employee"}</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteError(""); } }}>
        <DialogContent className="sm:max-w-md rounded-2xl"><DialogHeader><DialogTitle>Delete {deleteTarget?.type === "shift" ? "Shift" : "Employee"}?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This will permanently delete <strong className="text-foreground">{deleteTarget?.label}</strong>.</p>{deleteError && <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</p>}<DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" className="rounded-xl" onClick={confirmDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
