"use client";

import { useEffect, useState, useCallback } from "react";

export interface RiverOrder {
  id: string;
  orderNumber: string;
  date: string;
  product: string;
  description: string;
  quantity: number;
  quantityReceived: number;
  outstanding: number;
  status: "open" | "partial" | "complete";
  priority: string;
  shipmentMethod: string;
  progressNotes: string;
  notesLog: { date: string; note: string }[];
  dateRequested: string;
  datePaid: string;
  valueRmb: number;
  valueGbp: number;
  componentId: string;
  componentCode: string;
  componentLabel: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type NewRiverOrder = Partial<Omit<RiverOrder, "id" | "outstanding" | "status" | "createdAt" | "updatedAt">>;

export function useRiver() {
  const [orders, setOrders] = useState<RiverOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/river");
    if (!res.ok) throw new Error("Failed to load River orders");
    setOrders(await res.json());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/river");
        if (!res.ok) throw new Error("Failed to load River orders");
        const data: RiverOrder[] = await res.json();
        if (active) setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const addOrder = useCallback(async (data: NewRiverOrder) => {
    const res = await fetch("/api/river", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add River order");
    const created: RiverOrder = await res.json();
    setOrders((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateOrder = useCallback(async (id: string, patch: NewRiverOrder) => {
    const res = await fetch(`/api/river/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Failed to update River order");
    const updated: RiverOrder = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    return updated;
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    const prev = orders;
    setOrders((cur) => cur.filter((o) => o.id !== id));
    const res = await fetch(`/api/river/${id}`, { method: "DELETE" });
    if (!res.ok) { setOrders(prev); throw new Error("Failed to delete River order"); }
  }, [orders]);

  /** Record a (partial) receipt; tops up the linked component's stock server-side. */
  const receive = useCallback(async (id: string, qty: number) => {
    const res = await fetch(`/api/river/${id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty }),
    });
    if (!res.ok) throw new Error("Failed to receive");
    const { order }: { order: RiverOrder } = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === id ? order : o)));
    return order;
  }, []);

  return { orders, loading, refresh, addOrder, updateOrder, deleteOrder, receive };
}
