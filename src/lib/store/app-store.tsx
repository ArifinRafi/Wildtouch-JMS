"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useMemo,
} from "react";
import { clients as seedClients, type Client } from "@/lib/mock-data/clients";
export type { Client } from "@/lib/mock-data/clients";
export type { ClientPricing } from "@/lib/mock-data/clients";

// ─── Shared Types ──────────────────────────────────────────────────────────────
export interface ProductionStaff {
  id: string;
  name: string;
  contactNumber: string;
  email: string;
  address: string;
  city: string;
}

export interface ProductionLog {
  id: string;
  staffId: string;
  clientId: string;
  product: string;
  dateOut: string | null;
  qtyOut: number | null;
  dateIn: string | null;
  qtyIn: number | null;
  notes: string;
  complete: boolean;
}

export interface Product {
  id: string;
  name: string;
  inStock: number;
  notes: string;
  imageUrl?: string;
}

// ─── State ────────────────────────────────────────────────────────────────────
interface AppState {
  staff: ProductionStaff[];
  productionLogs: ProductionLog[];
  products: Product[];
  clients: Client[];
}

// ─── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: "ADD_STAFF";    data: Omit<ProductionStaff, "id"> }
  | { type: "UPDATE_STAFF"; id: string; data: Partial<ProductionStaff> }
  | { type: "ADD_LOG";      data: Omit<ProductionLog, "id"> }
  | { type: "UPDATE_LOG";   id: string; data: Partial<Omit<ProductionLog, "id">> }
  | { type: "DELETE_LOG";   id: string }
  | { type: "ADD_PRODUCT";    data: Omit<Product, "id"> }
  | { type: "UPDATE_PRODUCT"; id: string; data: Partial<Omit<Product, "id">> }
  | { type: "DELETE_PRODUCT"; id: string }
  | { type: "ADD_CLIENT";     data: Omit<Client, "id"> }
  | { type: "UPDATE_CLIENT";  id: string; data: Partial<Omit<Client, "id">> }
  | { type: "DELETE_CLIENT";  id: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** When a log is completed, add its completed qty to product stock. */
function applyCompletedLog(
  products: Product[],
  log: ProductionLog
): Product[] {
  const qty = log.qtyIn ?? log.qtyOut ?? 0;
  if (qty <= 0) return products;

  const name = log.product.trim();
  const nameLower = name.toLowerCase();
  const idx = products.findIndex((p) => p.name.trim().toLowerCase() === nameLower);

  if (idx !== -1) {
    return products.map((p, i) =>
      i === idx ? { ...p, inStock: p.inStock + qty } : p
    );
  }

  // New product — auto-create
  const nextId = `PROD-${String(products.length + 1).padStart(3, "0")}`;
  return [...products, { id: nextId, name, inStock: qty, notes: "" }];
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // ── Staff ────────────────────────────────────────────────────────────────
    case "ADD_STAFF": {
      const id = `PRD-${String(state.staff.length + 1).padStart(3, "0")}`;
      return { ...state, staff: [...state.staff, { id, ...action.data }] };
    }
    case "UPDATE_STAFF": {
      return {
        ...state,
        staff: state.staff.map((s) =>
          s.id === action.id ? { ...s, ...action.data } : s
        ),
      };
    }

    // ── Production Logs ───────────────────────────────────────────────────────
    case "ADD_LOG": {
      const id = `LOG-${String(state.productionLogs.length + 1).padStart(4, "0")}`;
      const newLog: ProductionLog = { id, ...action.data };
      let products = state.products;
      // If added already complete, credit stock immediately
      if (newLog.complete) {
        products = applyCompletedLog(products, newLog);
      }
      return {
        ...state,
        productionLogs: [newLog, ...state.productionLogs],
        products,
      };
    }

    case "UPDATE_LOG": {
      const oldLog = state.productionLogs.find((l) => l.id === action.id);
      if (!oldLog) return state;
      const updatedLog: ProductionLog = { ...oldLog, ...action.data };
      let products = state.products;
      // Transition from incomplete → complete: credit stock
      if (!oldLog.complete && updatedLog.complete) {
        products = applyCompletedLog(products, updatedLog);
      }
      return {
        ...state,
        productionLogs: state.productionLogs.map((l) =>
          l.id === action.id ? updatedLog : l
        ),
        products,
      };
    }

    case "DELETE_LOG": {
      return {
        ...state,
        productionLogs: state.productionLogs.filter((l) => l.id !== action.id),
      };
    }

    // ── Products ─────────────────────────────────────────────────────────────
    case "ADD_PRODUCT": {
      const id = `PROD-${String(state.products.length + 1).padStart(3, "0")}`;
      return {
        ...state,
        products: [...state.products, { id, ...action.data }],
      };
    }
    case "UPDATE_PRODUCT": {
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.id ? { ...p, ...action.data } : p
        ),
      };
    }
    case "DELETE_PRODUCT": {
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.id),
      };
    }

    // ── Clients ──────────────────────────────────────────────────────────────
    case "ADD_CLIENT": {
      const maxNum = state.clients.reduce((m, c) => {
        const n = parseInt(c.id.split("-")[1], 10);
        return n > m ? n : m;
      }, 0);
      const id = `CLT-${String(maxNum + 1).padStart(3, "0")}`;
      return { ...state, clients: [...state.clients, { id, ...action.data }] };
    }
    case "UPDATE_CLIENT": {
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.id ? { ...c, ...action.data } : c
        ),
      };
    }
    case "DELETE_CLIENT": {
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.id),
      };
    }

    default:
      return state;
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const now = new Date();
const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const seedStaff: ProductionStaff[] = [
  { id: "PRD-001", name: "Aman Singh",  contactNumber: "+44 121 555 0101", email: "aman.s@wildtouch.co.uk",  address: "12 Beech Road", city: "Birmingham" },
  { id: "PRD-002", name: "Sarah Cole",  contactNumber: "+44 161 555 0102", email: "sarah.c@wildtouch.co.uk", address: "5 Park Lane",   city: "Manchester" },
  { id: "PRD-003", name: "James Park",  contactNumber: "+44 207 555 0103", email: "james.p@wildtouch.co.uk", address: "33 Mill Road",  city: "London"     },
  { id: "PRD-004", name: "Emma Reid",   contactNumber: "+44 131 555 0104", email: "emma.r@wildtouch.co.uk",  address: "8 Castle View", city: "Edinburgh"  },
];

const seedLogs: ProductionLog[] = [
  { id: "LOG-0001", staffId: "PRD-001", clientId: "CLT-001", product: "Floor",            dateOut: `${ym}-04`, qtyOut: 448, dateIn: `${ym}-06`, qtyIn: 448, notes: "Made at home",           complete: true  },
  { id: "LOG-0002", staffId: "PRD-002", clientId: "CLT-002", product: "Pin Badges",       dateOut: `${ym}-08`, qtyOut: 264, dateIn: null,        qtyIn: null, notes: "Collected from office", complete: false },
  { id: "LOG-0003", staffId: "PRD-003", clientId: "CLT-003", product: "Keyrings",         dateOut: `${ym}-08`, qtyOut: 235, dateIn: null,        qtyIn: null, notes: "",                      complete: false },
  { id: "LOG-0004", staffId: "PRD-001", clientId: "CLT-005", product: "Large Keyring",    dateOut: `${ym}-12`, qtyOut: 200, dateIn: null,        qtyIn: null, notes: "Urgent batch",          complete: false },
  { id: "LOG-0005", staffId: "PRD-004", clientId: "CLT-007", product: "Boxed Bracelets",  dateOut: `${ym}-12`, qtyOut: 90,  dateIn: `${ym}-15`, qtyIn: 90,   notes: "Quality checked",       complete: true  },
  { id: "LOG-0006", staffId: "PRD-002", clientId: "CLT-008", product: "Carded Earrings",  dateOut: `${ym}-15`, qtyOut: 150, dateIn: null,        qtyIn: null, notes: "",                      complete: false },
];

// Derive initial product stock from already-completed seed logs
const seedProducts: Product[] = (() => {
  let products: Product[] = [];
  seedLogs.filter((l) => l.complete).forEach((log) => {
    products = applyCompletedLog(products, log);
  });
  return products;
})();

const initialState: AppState = {
  staff: seedStaff,
  productionLogs: seedLogs,
  products: seedProducts,
  clients: [...seedClients],
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface AppStoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  const { state, dispatch } = ctx;

  return {
    // State
    staff:          state.staff,
    productionLogs: state.productionLogs,
    products:       state.products,
    clients:        state.clients,

    // Staff actions
    addStaff:    (data: Omit<ProductionStaff, "id">) => dispatch({ type: "ADD_STAFF", data }),
    updateStaff: (id: string, data: Partial<ProductionStaff>) => dispatch({ type: "UPDATE_STAFF", id, data }),

    // Log actions
    addLog:    (data: Omit<ProductionLog, "id">)                          => dispatch({ type: "ADD_LOG",    data }),
    updateLog: (id: string, data: Partial<Omit<ProductionLog, "id">>)    => dispatch({ type: "UPDATE_LOG", id, data }),
    deleteLog: (id: string)                                                => dispatch({ type: "DELETE_LOG", id }),

    // Product actions
    addProduct:    (data: Omit<Product, "id">)                          => dispatch({ type: "ADD_PRODUCT",    data }),
    updateProduct: (id: string, data: Partial<Omit<Product, "id">>)    => dispatch({ type: "UPDATE_PRODUCT", id, data }),
    deleteProduct: (id: string)                                          => dispatch({ type: "DELETE_PRODUCT", id }),

    // Client actions
    addClient:    (data: Omit<Client, "id">)                          => dispatch({ type: "ADD_CLIENT",    data }),
    updateClient: (id: string, data: Partial<Omit<Client, "id">>)    => dispatch({ type: "UPDATE_CLIENT", id, data }),
    deleteClient: (id: string)                                          => dispatch({ type: "DELETE_CLIENT", id }),
  };
}
