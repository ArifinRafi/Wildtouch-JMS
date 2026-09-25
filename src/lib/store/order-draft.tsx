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
  OrderAgentSnapshot,
} from "@/lib/store/orders-store";
import type { OrderSource } from "@/lib/order-source";

/** The order being assembled across the multi-page "new order" flow. */
export interface OrderDraft {
  isBackOrder: boolean;
  backOrderDate: string;
  planogram: { id: string; name: string } | null;
  lineItems: OrderLineItem[];
  componentRequirements: OrderComponentRequirement[];
  /** Slot grid values for slot-type planograms (4-sided stands): [side][row][slot]. */
  slots?: number[][][];
  /** Segment grid values for segment-type planograms (keyrings/magnets): [segment][row][column]. */
  segQty?: number[][][];
  /** Grid values for custom planograms: [side][row][column]. */
  rowQty?: number[][][];
  stockChecked: boolean;
  client: OrderClientSnapshot | null;
  agent: OrderAgentSnapshot | null;
  orderSource: OrderSource | "";
  poNumber: string;
  referenceNumber: string;
  notes: string;
  /** VAT rate (percentage) entered by the user at order creation. */
  vatRate?: number;
}

export const emptyDraft = (): OrderDraft => ({
  isBackOrder: false,
  backOrderDate: "",
  planogram: null,
  lineItems: [],
  componentRequirements: [],
  slots: undefined,
  stockChecked: false,
  client: null,
  agent: null,
  orderSource: "",
  poNumber: "",
  referenceNumber: "",
  notes: "",
  vatRate: 20,
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
