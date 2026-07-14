"use client";

import { useEffect, useState, useCallback } from "react";

export type TaskStatus = "pending" | "complete";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  date: string;
  employeeName: string;
  taskName: string;
  note: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string | null;
  updatedAt: string | null;
}

export type NewTask = Partial<Omit<Task, "id" | "createdAt" | "updatedAt">>;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error("Failed to load tasks");
        const data: Task[] = await res.json();
        if (active) setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const addTask = useCallback(async (data: NewTask) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add task");
    const created: Task = await res.json();
    setTasks((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateTask = useCallback(async (id: string, patch: NewTask) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update task");
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const prev = tasks;
    setTasks((cur) => cur.filter((t) => t.id !== id));
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) { setTasks(prev); throw new Error("Failed to delete task"); }
  }, [tasks]);

  return { tasks, loading, addTask, updateTask, deleteTask };
}
