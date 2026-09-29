"use client";

import { useCallback, useEffect, useState } from "react";

export interface Employee {
  id: string;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  email: string;
}

export type EmployeeInput = Omit<Employee, "id">;

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  return new Error(typeof body.error === "string" ? body.error : fallback);
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/employees")
      .then(async (response) => {
        if (!response.ok) throw await readError(response, "Could not load employees");
        return response.json() as Promise<Employee[]>;
      })
      .then((data) => { if (active) setEmployees(data); })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const createEmployee = useCallback(async (input: EmployeeInput) => {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw await readError(response, "Could not add employee");
    const created: Employee = await response.json();
    setEmployees((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  const updateEmployee = useCallback(async (id: string, input: Partial<EmployeeInput>) => {
    const response = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw await readError(response, "Could not update employee");
    const updated: Employee = await response.json();
    setEmployees((current) => current.map((employee) => employee.id === id ? updated : employee).sort((a, b) => a.name.localeCompare(b.name)));
    return updated;
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    const response = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (!response.ok) throw await readError(response, "Could not delete employee");
    setEmployees((current) => current.filter((employee) => employee.id !== id));
  }, []);

  return { employees, loading, createEmployee, updateEmployee, deleteEmployee };
}
