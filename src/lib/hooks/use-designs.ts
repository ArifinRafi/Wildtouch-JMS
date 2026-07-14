"use client";

import { useEffect, useState, useCallback } from "react";

export interface Design {
  id: string;
  name: string;
  image: string;
  clientName: string;
  categoryName: string;
  categoryType: string;
  notes: string;
  addedToCodeSheet: string;
  addedToNewDesignBrochure: string;
  addedToThemedBrochure: string;
  stage: string;
  completed: boolean;
  riverAcknowledged: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type NewDesign = Partial<Omit<Design, "id" | "createdAt" | "updatedAt">>;

export function useDesigns() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/designs");
        if (!res.ok) throw new Error("Failed to load designs");
        const data: Design[] = await res.json();
        if (active) setDesigns(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const addDesign = useCallback(async (data: NewDesign) => {
    const res = await fetch("/api/designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add design");
    const created: Design = await res.json();
    setDesigns((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateDesign = useCallback(async (id: string, patch: NewDesign) => {
    // Optimistic update.
    setDesigns((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    const res = await fetch(`/api/designs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update design");
    const updated: Design = await res.json();
    setDesigns((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, []);

  const deleteDesign = useCallback(async (id: string) => {
    const prev = designs;
    setDesigns((cur) => cur.filter((d) => d.id !== id));
    const res = await fetch(`/api/designs/${id}`, { method: "DELETE" });
    if (!res.ok) { setDesigns(prev); throw new Error("Failed to delete design"); }
  }, [designs]);

  return { designs, loading, addDesign, updateDesign, deleteDesign };
}
