"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
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
  isProforma: boolean;
  editingProformaId: string;
  categoryPrices: Record<string, number>;
  shipping: number;
  currency: "GBP" | "EUR";
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
  isProforma: false,
  editingProformaId: "",
  categoryPrices: {},
  shipping: 0,
  currency: "GBP",
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const proforma = params.get("proforma") === "1";
    const editId = params.get("edit") ?? "";
    if (proforma && editId) {
      fetch(`/api/proforma-invoices/${encodeURIComponent(editId)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load proforma for editing");
          return response.json();
        })
        .then((quote) => {
          setDraft({
            ...emptyDraft(),
            isProforma: true,
            editingProformaId: editId,
            planogram: quote.planogram,
            lineItems: quote.lineItems,
            client: quote.client,
            agent: quote.agent,
            orderSource: quote.orderSource,
            slots: quote.grid?.slots,
            segQty: quote.grid?.segQty,
            rowQty: quote.grid?.rowQty,
            categoryPrices: quote.categoryPrices ?? {},
            shipping: quote.shipping ?? 0,
            currency: quote.currency ?? "GBP",
            vatRate: quote.vatRate ?? 0,
            poNumber: quote.poNumber ?? "",
            referenceNumber: quote.referenceNumber ?? "",
            notes: quote.notes ?? "",
          });
        })
        .catch(() => setDraft({ ...emptyDraft(), isProforma: true, editingProformaId: editId }));
      return;
    }
    if (proforma) {
      queueMicrotask(() => setDraft({ ...emptyDraft(), isProforma: true }));
    }
  }, []);

  const patchDraft = useCallback((patch: Partial<OrderDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyDraft());
  }, []);

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
