"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface OrderLineItem {
  code: string;
  description: string;
  category?: string;
  qtyOrdered: number;
  unitPrice?: number;
  lineTotal?: number;
}

export interface OrderComponentRequirement {
  code: string;
  label?: string;
  qtyRequired: number;
  deducted?: boolean;
}

export interface OrderClientSnapshot {
  clientId?: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  invoiceAddress?: string;
  deliveryAddress?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  planogram: { id: string; name: string };
  client: OrderClientSnapshot;
  lineItems: OrderLineItem[];
  componentRequirements: OrderComponentRequirement[];
  subtotal: number;
  total: number;
  notes: string;
  inventoryDeducted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type NewOrderInput = Omit<
  Order,
  "id" | "orderNumber" | "inventoryDeducted" | "createdAt" | "updatedAt"
>;

interface OrdersStoreValue {
  orders: Order[];
  loading: boolean;
  refresh: () => Promise<void>;
  createOrder: (data: Partial<NewOrderInput>) => Promise<Order>;
  updateOrder: (id: string, patch: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

const OrdersContext = createContext<OrdersStoreValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (!res.ok) throw new Error("Failed to load orders");
    setOrders(await res.json());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Failed to load orders");
        const data: Order[] = await res.json();
        if (active) setOrders(data);
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

  const createOrder = useCallback(async (data: Partial<NewOrderInput>) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create order");
    const created: Order = await res.json();
    setOrders((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateOrder = useCallback(async (id: string, patch: Partial<Order>) => {
    const prev = orders;
    setOrders((cur) => cur.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update order");
      const updated: Order = await res.json();
      setOrders((cur) => cur.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      console.error(err);
      setOrders(prev);
    }
  }, [orders]);

  const deleteOrder = useCallback(async (id: string) => {
    const prev = orders;
    setOrders((cur) => cur.filter((o) => o.id !== id));
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
    } catch (err) {
      console.error(err);
      setOrders(prev);
    }
  }, [orders]);

  return (
    <OrdersContext.Provider
      value={{ orders, loading, refresh, createOrder, updateOrder, deleteOrder }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersStoreValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}
