"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  LayoutGrid,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ResultType = "client" | "product" | "order" | "invoice" | "planogram";

interface SearchResult {
  type: ResultType;
  label: string;
  sublabel: string;
  href: string;
}

const TYPE_META: Record<ResultType, { icon: typeof Users; label: string; color: string }> = {
  client: { icon: Users, label: "Client", color: "text-blue-600 dark:text-blue-400" },
  product: { icon: Package, label: "Product", color: "text-violet-600 dark:text-violet-400" },
  order: { icon: ShoppingCart, label: "Order", color: "text-amber-600 dark:text-amber-400" },
  invoice: { icon: Receipt, label: "Invoice", color: "text-emerald-600 dark:text-emerald-400" },
  planogram: { icon: LayoutGrid, label: "Planogram", color: "text-primary" },
};

interface RawClient { id: string; name?: string; city?: string; email?: string }
interface RawProduct { id: string; name?: string; code?: string; group?: string }
interface RawOrder { id: string; orderNumber?: string; client?: { name?: string } }
interface RawInvoice { id: string; invoiceNumber?: string; orderNumber?: string; client?: { name?: string } }
interface RawPlanogram { id: string; name?: string }

interface Dataset {
  clients: RawClient[];
  products: RawProduct[];
  orders: RawOrder[];
  invoices: RawInvoice[];
  planograms: RawPlanogram[];
}

const EMPTY: Dataset = { clients: [], products: [], orders: [], invoices: [], planograms: [] };
const PER_TYPE = 5;

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Dataset>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const fetchedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazily load the searchable datasets the first time the box is focused.
  const ensureData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const [clients, products, orders, invoices, planograms] = await Promise.all([
        fetch("/api/clients").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/products").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/orders").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/invoices").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        fetch("/api/planograms").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      setData({
        clients: Array.isArray(clients) ? clients : [],
        products: Array.isArray(products) ? products : [],
        orders: Array.isArray(orders) ? orders : [],
        invoices: Array.isArray(invoices) ? invoices : [],
        planograms: Array.isArray(planograms) ? planograms : [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const has = (...vals: (string | undefined)[]) => vals.some((v) => (v ?? "").toLowerCase().includes(q));

    const clients: SearchResult[] = data.clients
      .filter((c) => has(c.name, c.id, c.city, c.email))
      .slice(0, PER_TYPE)
      .map((c) => ({ type: "client", label: c.name || c.id, sublabel: [c.id, c.city].filter(Boolean).join(" · "), href: `/clients/${c.id}` }));

    const products: SearchResult[] = data.products
      .filter((p) => has(p.name, p.code, p.group))
      .slice(0, PER_TYPE)
      .map((p) => ({ type: "product", label: p.name || "Product", sublabel: [p.code, p.group].filter(Boolean).join(" · "), href: `/products?q=${encodeURIComponent(p.name || p.code || "")}` }));

    const orders: SearchResult[] = data.orders
      .filter((o) => has(o.orderNumber, o.client?.name))
      .slice(0, PER_TYPE)
      .map((o) => ({ type: "order", label: o.orderNumber || "Order", sublabel: o.client?.name || "", href: `/orders/${o.id}` }));

    const invoices: SearchResult[] = data.invoices
      .filter((iv) => has(iv.invoiceNumber, iv.orderNumber, iv.client?.name))
      .slice(0, PER_TYPE)
      .map((iv) => ({ type: "invoice", label: iv.invoiceNumber || "Invoice", sublabel: [iv.client?.name, iv.orderNumber].filter(Boolean).join(" · "), href: `/invoices/${iv.id}` }));

    const planograms: SearchResult[] = data.planograms
      .filter((pg) => has(pg.name))
      .slice(0, PER_TYPE)
      .map((pg) => ({ type: "planogram", label: pg.name || "Planogram", sublabel: "Custom planogram", href: `/planogram/custom/${pg.id}` }));

    return [...clients, ...products, ...orders, ...invoices, ...planograms];
  }, [query, data]);

  // Keep the active row in range whenever results change.
  useEffect(() => { setActive(0); }, [query]);

  const go = useCallback((r: SearchResult | undefined) => {
    if (!r) return;
    setOpen(false);
    setQuery("");
    router.push(r.href);
  }, [router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); return; }
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[active]); }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative hidden flex-1 sm:block max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { ensureData(); setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder="Search clients, products, orders..."
        className="h-9 w-full rounded-xl border border-border/30 bg-muted/40 pl-9 pr-3 text-sm outline-none transition-colors focus:bg-card/60 focus:ring-2 focus:ring-primary/30"
      />

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border/40 bg-popover/95 glass-strong shadow-xl overflow-hidden z-50"
          >
            {loading && results.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No matches for &ldquo;<span className="font-medium text-foreground">{query.trim()}</span>&rdquo;
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto py-1.5">
                {results.map((r, i) => {
                  const meta = TYPE_META[r.type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={`${r.type}-${r.href}-${i}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(r)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                        i === active ? "bg-accent/60" : "hover:bg-accent/30",
                      )}
                    >
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60", meta.color)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{r.label}</span>
                        {r.sublabel && <span className="block truncate text-[11px] text-muted-foreground">{r.sublabel}</span>}
                      </span>
                      <span className="shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {meta.label}
                      </span>
                      {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
