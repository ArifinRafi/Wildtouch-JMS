"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { CatalogItem } from "@/lib/data/inventory/catalog";
import type { InventoryComponent } from "@/lib/data/inventory/types";

export interface NewComponentInput {
  description: string;
  code: string;
  qtyAvailable: number;
  components: InventoryComponent[];
}

interface InventoryStoreValue {
  items: CatalogItem[];
  loading: boolean;
  addItem: (data: NewComponentInput) => Promise<void>;
  updateItem: (id: string, patch: Partial<Omit<CatalogItem, "id">>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryStoreValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("Failed to load inventory");
        const data: CatalogItem[] = await res.json();
        if (active) setItems(data);
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

  const addItem = useCallback(async (data: NewComponentInput) => {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add component");
    const created: CatalogItem = await res.json();
    setItems((prev) => [created, ...prev]);
  }, []);

  const updateItem = useCallback(
    async (id: string, patch: Partial<Omit<CatalogItem, "id">>) => {
      const prev = items;
      // Optimistic update.
      setItems((cur) => cur.map((it) => (it.id === id ? { ...it, ...patch } : it)));
      try {
        const res = await fetch(`/api/inventory/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("Failed to update component");
        const updated: CatalogItem = await res.json();
        setItems((cur) => cur.map((it) => (it.id === id ? updated : it)));
      } catch (err) {
        console.error(err);
        setItems(prev); // rollback
      }
    },
    [items],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const prev = items;
      // Optimistic remove.
      setItems((cur) => cur.filter((it) => it.id !== id));
      try {
        const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete component");
      } catch (err) {
        console.error(err);
        setItems(prev); // rollback
      }
    },
    [items],
  );

  return (
    <InventoryContext.Provider
      value={{ items, loading, addItem, updateItem, deleteItem }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryStoreValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within an InventoryProvider");
  return ctx;
}
