"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  OrderLineItem,
  OrderComponentRequirement,
  OrderClientSnapshot,
} from "@/lib/store/orders-store";

/** The order being assembled across the multi-page "new order" flow. */
export interface OrderDraft {
  planogram: { id: string; name: string } | null;
  lineItems: OrderLineItem[];
  componentRequirements: OrderComponentRequirement[];
  stockChecked: boolean;
  client: OrderClientSnapshot | null;
  notes: string;
}

export const emptyDraft = (): OrderDraft => ({
  planogram: null,
  lineItems: [],
  componentRequirements: [],
  stockChecked: false,
  client: null,
  notes: "",
});

interface OrderDraftValue {
  draft: OrderDraft;
  setDraft: React.Dispatch<React.SetStateAction<OrderDraft>>;
  patchDraft: (patch: Partial<OrderDraft>) => void;
  reset: () => void;
}

const OrderDraftContext = createContext<OrderDraftValue | null>(null);

export function OrderDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OrderDraft>(emptyDraft);

  const patchDraft = useCallback((patch: Partial<OrderDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const reset = useCallback(() => setDraft(emptyDraft()), []);

  return (
    <OrderDraftContext.Provider value={{ draft, setDraft, patchDraft, reset }}>
      {children}
    </OrderDraftContext.Provider>
  );
}

export function useOrderDraft(): OrderDraftValue {
  const ctx = useContext(OrderDraftContext);
  if (!ctx) throw new Error("useOrderDraft must be used within an OrderDraftProvider");
  return ctx;
}
