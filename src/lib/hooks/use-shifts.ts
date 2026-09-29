"use client";

import { useCallback, useEffect, useState } from "react";

export type ShiftAttendance = "unmarked" | "attended" | "absent";

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  finishTime: string;
  hours: number;
  lunchMinutes: number;
  extraHours: number;
  chargeableHours: number;
  notes: string;
  attendance: ShiftAttendance;
}

export type ShiftInput = Omit<Shift, "id" | "employeeName" | "hours" | "chargeableHours">;

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  return new Error(typeof body.error === "string" ? body.error : fallback);
}

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/shifts")
      .then(async (response) => {
        if (!response.ok) throw await readError(response, "Could not load shifts");
        return response.json() as Promise<Shift[]>;
      })
      .then((data) => { if (active) setShifts(data); })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const createShift = useCallback(async (input: ShiftInput) => {
    const response = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw await readError(response, "Could not add shift");
    const created: Shift = await response.json();
    setShifts((current) => [...current, created].sort((a, b) => a.date.localeCompare(b.date)));
    return created;
  }, []);

  const updateShift = useCallback(async (id: string, patch: Partial<ShiftInput>) => {
    const response = await fetch(`/api/shifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) throw await readError(response, "Could not update shift");
    const updated: Shift = await response.json();
    setShifts((current) => current.map((shift) => shift.id === id ? updated : shift).sort((a, b) => a.date.localeCompare(b.date)));
    return updated;
  }, []);

  const deleteShift = useCallback(async (id: string) => {
    const response = await fetch(`/api/shifts/${id}`, { method: "DELETE" });
    if (!response.ok) throw await readError(response, "Could not delete shift");
    setShifts((current) => current.filter((shift) => shift.id !== id));
  }, []);

  return { shifts, loading, createShift, updateShift, deleteShift };
}
