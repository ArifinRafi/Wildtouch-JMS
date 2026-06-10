"use client";

import { useEffect, useState, useCallback } from "react";

export interface CustomPlanogramRow {
  description: string;
  /** Per-column quantities. */
  cells: number[];
}
export interface CustomPlanogramSide {
  label: string;
  columns: number;
  rows: CustomPlanogramRow[];
}
export interface CustomPlanogram {
  id: string;
  name: string;
  slug: string;
  source: string;
  totalUnits: number;
  sides: CustomPlanogramSide[];
  createdAt: string | null;
  updatedAt: string | null;
}

/** Fetch the list of user-created planograms from the DB. */
export function useCustomPlanograms() {
  const [planograms, setPlanograms] = useState<CustomPlanogram[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/planograms");
    if (!res.ok) throw new Error("Failed to load planograms");
    setPlanograms(await res.json());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/planograms");
        if (!res.ok) throw new Error("Failed to load planograms");
        const data: CustomPlanogram[] = await res.json();
        if (active) setPlanograms(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { planograms, loading, refresh };
}
