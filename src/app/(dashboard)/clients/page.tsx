"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  SendHorizontal,
  MoreHorizontal,
  ArrowUpDown,
  Eye,
  Trash2,
  PoundSterling,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import type { Client, ClientPricing } from "@/lib/store/app-store";
import {
  type AccountStatus,
  PRODUCT_PRICE_FIELDS,
} from "@/lib/mock-data/clients";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseDaysAgo(str: string): number {
  const m = str.match(/(\d+)\s+days?\s+ago/i);
  return m ? parseInt(m[1], 10) : 0;
}
const INACTIVE_THRESHOLD = 60;

// ─── Config ──────────────────────────────────────────────────────────────────
const statusConfig: Record<AccountStatus, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  proforma: {
    label: "Proforma",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  on_hold: {
    label: "On Hold",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  bad_credit: {
    label: "Bad Credit",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

const filterOptions: { label: string; value: string }[] = [
  { label: "All Clients", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Proforma", value: "proforma" },
  { label: "On Hold", value: "on_hold" },
  { label: "Bad Credit", value: "bad_credit" },
  { label: "Good History", value: "good" },
  { label: "Bad History", value: "bad" },
];

// ─── Form types ──────────────────────────────────────────────────────────────
interface ClientForm {
  name: string;
  mainBuyerNames: string;
  otherContactAndPosition: string;
  contactNumber: string;
  mobOther: string;
  email: string;
  emailOther: string;
  shopManagerName: string;
  giftShopContactNo: string;
  webAddress: string;
  history: string;
  accountStatus: string;
  address: string;
  city: string;
  invoiceAddressFull: string;
  deliveryAddress: string;
  deliveryInstructions: string;
  invoiceProcedure: string;
  requirePO: boolean;
  emailInvoiceTo: string;
  topSellingAnimals: string;
  slowSellerDesigns: string;
  substituteDesigns: boolean;
  standsInfo: string;
  upsellInfo: string;
  cardsUsed: string;
  boxesUsed: string;
  specialInformation: string;
  pricing: Record<string, string>;
}

function emptyForm(): ClientForm {
  return {
    name: "",
    mainBuyerNames: "",
    otherContactAndPosition: "",
    contactNumber: "",
    mobOther: "",
    email: "",
    emailOther: "",
    shopManagerName: "",
    giftShopContactNo: "",
    webAddress: "",
    history: "good",
    accountStatus: "active",
    address: "",
    city: "",
    invoiceAddressFull: "",
    deliveryAddress: "",
    deliveryInstructions: "",
    invoiceProcedure: "",
    requirePO: false,
    emailInvoiceTo: "",
    topSellingAnimals: "",
    slowSellerDesigns: "",
    substituteDesigns: false,
    standsInfo: "",
    upsellInfo: "",
    cardsUsed: "",
    boxesUsed: "",
    specialInformation: "",
    pricing: {},
  };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const store = useAppStore();
  const clientList = store.clients;

  // ── Filter / search / sort ──
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof Client>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Add dialog state ──
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyForm());
  const [formError, setFormError] = useState("");
  const [formTab, setFormTab] = useState("contact");

  // ── Filtered + sorted list ──
  const filtered = useMemo(() => {
    let list = [...clientList];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contactNumber.includes(q),
      );
    }

    if (filter !== "all") {
      if (filter === "good" || filter === "bad") {
        list = list.filter((c) => c.history === filter);
      } else if (filter === "inactive") {
        list = list.filter((c) => parseDaysAgo(c.lastOrder) > INACTIVE_THRESHOLD);
      } else {
        list = list.filter((c) => c.accountStatus === filter);
      }
    }

    list.sort((a, b) => {
      const av = String(a[sortField]).toLowerCase();
      const bv = String(b[sortField]).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [clientList, search, filter, sortDir, sortField]);

  const toggleSort = (field: keyof Client) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ── Chip counts ──
  const goodCount = clientList.filter((c) => c.history === "good").length;
  const badCount = clientList.filter((c) => c.history === "bad").length;
  const activeCount = clientList.filter((c) => c.accountStatus === "active").length;
  const inactiveCount = clientList.filter(
    (c) => parseDaysAgo(c.lastOrder) > INACTIVE_THRESHOLD,
  ).length;

  // ── Dialog openers ──
  const openAdd = useCallback(() => {
    setForm(emptyForm());
    setFormError("");
    setFormTab("contact");
    setAddOpen(true);
  }, []);

  // ── Save (Add) ──
  const handleSave = useCallback(() => {
    if (!form.name.trim() || !form.contactNumber.trim() || !form.email.trim()) {
      setFormError("Name, Mobile, and Email are required.");
      return;
    }
    setFormError("");

    const pricingObj: ClientPricing = {};
    for (const f of PRODUCT_PRICE_FIELDS) {
      const raw = form.pricing[f.key];
      if (raw && raw.trim()) {
        const n = parseFloat(raw);
        if (!isNaN(n)) (pricingObj as Record<string, number>)[f.key] = n;
      }
    }
    const hasPricing = Object.keys(pricingObj).length > 0;

    const data: Omit<Client, "id"> = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      history: (form.history as "good" | "bad") || "good",
      accountStatus: (form.accountStatus as AccountStatus) || "active",
      lastOrder: "0 days ago",
      totalOrders: 0,
      ...(form.mainBuyerNames.trim() && { mainBuyerNames: form.mainBuyerNames.trim() }),
      ...(form.otherContactAndPosition.trim() && {
        otherContactAndPosition: form.otherContactAndPosition.trim(),
      }),
      ...(form.mobOther.trim() && { mobOther: form.mobOther.trim() }),
      ...(form.emailOther.trim() && { emailOther: form.emailOther.trim() }),
      ...(form.shopManagerName.trim() && { shopManagerName: form.shopManagerName.trim() }),
      ...(form.giftShopContactNo.trim() && { giftShopContactNo: form.giftShopContactNo.trim() }),
      ...(form.webAddress.trim() && { webAddress: form.webAddress.trim() }),
      ...(form.invoiceAddressFull.trim() && {
        invoiceAddressFull: form.invoiceAddressFull.trim(),
      }),
      ...(form.deliveryAddress.trim() && { deliveryAddress: form.deliveryAddress.trim() }),
      ...(form.deliveryInstructions.trim() && {
        deliveryInstructions: form.deliveryInstructions.trim(),
      }),
      ...(form.invoiceProcedure.trim() && { invoiceProcedure: form.invoiceProcedure.trim() }),
      requirePO: form.requirePO,
      ...(form.emailInvoiceTo.trim() && { emailInvoiceTo: form.emailInvoiceTo.trim() }),
      ...(form.topSellingAnimals.trim() && { topSellingAnimals: form.topSellingAnimals.trim() }),
      ...(form.slowSellerDesigns.trim() && { slowSellerDesigns: form.slowSellerDesigns.trim() }),
      substituteDesigns: form.substituteDesigns,
      ...(form.standsInfo.trim() && { standsInfo: form.standsInfo.trim() }),
      ...(form.upsellInfo.trim() && { upsellInfo: form.upsellInfo.trim() }),
      ...(form.cardsUsed.trim() && { cardsUsed: form.cardsUsed.trim() }),
      ...(form.boxesUsed.trim() && { boxesUsed: form.boxesUsed.trim() }),
      ...(hasPricing && { pricing: pricingObj }),
      ...(form.specialInformation.trim() && {
        specialInformation: form.specialInformation.trim(),
      }),
    };

    store.addClient(data);
    setAddOpen(false);
  }, [form, store]);

  // ── Remove ──
  const handleRemove = useCallback(
    (client: Client) => {
      if (window.confirm(`Remove "${client.name}"? This action cannot be undone.`)) {
        store.deleteClient(client.id);
      }
    },
    [store],
  );

  // ── Form field updater ──
  const setField = useCallback(
    (key: keyof ClientForm, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );
  const setPricingField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, pricing: { ...prev.pricing, [key]: value } }));
  }, []);

  // ── Render helpers ──
  const inputCls = "rounded-xl bg-muted/30 border-border/40";

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientList.length} registered clients
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={openAdd}
            className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </motion.div>
      </motion.div>

      {/* ── Summary / Filter Chips ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {(() => {
          const isActive = filter === "all";
          return (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter("all")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/30"
                  : "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20",
              )}
            >
              <Users className="h-4 w-4" />
              Total: {clientList.length}
            </motion.button>
          );
        })()}

        {(() => {
          const isActive = filter === "good";
          return (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.16 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(isActive ? "all" : "good")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30"
                  : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              Good History: {goodCount}
            </motion.button>
          );
        })()}

        {(() => {
          const isActive = filter === "bad";
          return (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(isActive ? "all" : "bad")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/30"
                  : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20",
              )}
            >
              <XCircle className="h-4 w-4" />
              Bad History: {badCount}
            </motion.button>
          );
        })()}

        {(() => {
          const isActive = filter === "active";
          return (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(isActive ? "all" : "active")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30"
                  : "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
              )}
            >
              <Building2 className="h-4 w-4" />
              Active: {activeCount}
            </motion.button>
          );
        })()}

        {(() => {
          const isActive = filter === "inactive";
          return (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.34 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(isActive ? "all" : "inactive")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30"
                  : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20",
              )}
            >
              <Clock className="h-4 w-4" />
              Inactive: {inactiveCount}
            </motion.button>
          );
        })()}
      </motion.div>

      {/* ── Search & Filter Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search by name, city, email, phone..."
            className={cn("pl-9", inputCls)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 glass px-4 py-2 text-sm font-medium hover:bg-accent/40 transition-colors focus-visible:outline-none min-w-[160px] justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>{filterOptions.find((f) => f.value === filter)?.label ?? "Filter"}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1"
          >
            {filterOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "rounded-xl cursor-pointer text-sm",
                  filter === opt.value && "bg-primary/10 text-primary font-semibold",
                )}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                {[
                  { label: "Client Name", field: "name" as keyof Client, w: "w-[260px]" },
                  { label: "Mobile", field: "contactNumber" as keyof Client, w: "w-[160px]" },
                  { label: "Email", field: "email" as keyof Client, w: "w-[220px]" },
                  { label: "Invoice Address", field: "address" as keyof Client, w: "w-[240px]" },
                ].map((col) => (
                  <th key={col.field} className={cn(col.w, "px-5 py-3 text-left")}>
                    <button
                      onClick={() => toggleSort(col.field)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown
                        className={cn(
                          "h-3 w-3 transition-colors",
                          sortField === col.field ? "text-primary" : "opacity-40",
                        )}
                      />
                    </button>
                  </th>
                ))}
                <th className="w-[120px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={5}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                      >
                        <Users className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No clients match your search</p>
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((client, i) => {
                    const isInactive = parseDaysAgo(client.lastOrder) > INACTIVE_THRESHOLD;
                    const st = statusConfig[client.accountStatus];
                    const invoiceAddr = client.invoiceAddressFull
                      ? client.invoiceAddressFull
                      : [client.address, client.city].filter(Boolean).join(", ");

                    return (
                      <motion.tr
                        key={client.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.22, delay: i * 0.035 }}
                        className={cn(
                          "group border-b border-border/20 hover:bg-accent/25 transition-colors last:border-b-0",
                          isInactive && "bg-amber-500/[0.03]",
                        )}
                      >
                        {/* Client Name */}
                        <td className="px-5 py-3.5 align-middle">
                          <p className="text-sm font-semibold leading-tight">{client.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{client.id}</span>
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] px-1.5 py-0 h-4 border", st.className)}
                            >
                              {st.label}
                            </Badge>
                          </div>
                        </td>

                        {/* Mobile */}
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            <p className="text-xs tabular-nums">{client.contactNumber}</p>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-3.5 align-middle max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            <p className="text-xs truncate">{client.email}</p>
                          </div>
                        </td>

                        {/* Invoice Address */}
                        <td className="px-5 py-3.5 align-middle max-w-[240px]">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {invoiceAddr}
                            </p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3.5 align-middle">
                          <div className="flex items-center gap-1">
                            {/* Chase Up */}
                            <motion.a
                              whileHover={{ scale: 1.12 }}
                              whileTap={{ scale: 0.9 }}
                              href={`mailto:${client.email}?subject=${encodeURIComponent(`Checking In — ${client.name}`)}&body=${encodeURIComponent(`Hi there,\n\nWe noticed we haven't heard from you in a while and wanted to check in.\n\nIs everything okay with your account? We'd love to hear from you and see if there's anything we can help with.\n\nPlease feel free to reply to this email or give us a call.\n\nBest regards,\nWildtouch Team`)}`}
                              title="Chase Up"
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                isInactive
                                  ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/30"
                                  : "opacity-0 group-hover:opacity-100 hover:bg-accent/60 text-muted-foreground hover:text-foreground",
                              )}
                            >
                              <SendHorizontal className="h-3.5 w-3.5" />
                            </motion.a>

                            {/* View Details — Link to detail page */}
                            <Link
                              href={`/clients/${client.id}`}
                              className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-8 w-8 rounded-lg hover:bg-accent/60 transition-all text-muted-foreground hover:text-foreground"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>

                            {/* More menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-8 w-8 rounded-lg hover:bg-accent/60 transition-all focus-visible:outline-none focus-visible:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-44 glass-strong bg-popover/95 border-border/40 rounded-xl p-1"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleRemove(client)}
                                  className="rounded-lg cursor-pointer gap-2 text-sm text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/20 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-semibold text-foreground">{clientList.length}</span> clients
            </p>
          </div>
        )}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════════════════
          Dialog: Add Client
         ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 rounded-2xl">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-bold">Add Client</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
              <TabsList className="w-full grid grid-cols-5 mb-4">
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>

              {/* Tab 1: Contact */}
              <TabsContent value="contact" className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Main Buyer Names</Label>
                  <Input
                    className={inputCls}
                    value={form.mainBuyerNames}
                    onChange={(e) => setField("mainBuyerNames", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Other Contact & Position</Label>
                  <Input
                    className={inputCls}
                    value={form.otherContactAndPosition}
                    onChange={(e) => setField("otherContactAndPosition", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Mobile *</Label>
                    <Input
                      className={inputCls}
                      value={form.contactNumber}
                      onChange={(e) => setField("contactNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Other Mobile</Label>
                    <Input
                      className={inputCls}
                      value={form.mobOther}
                      onChange={(e) => setField("mobOther", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input
                      className={inputCls}
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Other Email</Label>
                    <Input
                      className={inputCls}
                      value={form.emailOther}
                      onChange={(e) => setField("emailOther", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Shop Manager Name</Label>
                    <Input
                      className={inputCls}
                      value={form.shopManagerName}
                      onChange={(e) => setField("shopManagerName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gift Shop Contact No</Label>
                    <Input
                      className={inputCls}
                      value={form.giftShopContactNo}
                      onChange={(e) => setField("giftShopContactNo", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Web Address</Label>
                  <Input
                    className={inputCls}
                    value={form.webAddress}
                    onChange={(e) => setField("webAddress", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>History</Label>
                    <Select
                      value={form.history}
                      onValueChange={(v) => v && setField("history", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="bad">Bad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Account Status</Label>
                    <Select
                      value={form.accountStatus}
                      onValueChange={(v) => v && setField("accountStatus", v)}
                    >
                      <SelectTrigger className={inputCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="proforma">Proforma</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="bad_credit">Bad Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Address */}
              <TabsContent value="address" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Invoice Address Line 1</Label>
                    <Input
                      className={inputCls}
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input
                      className={inputCls}
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Full Invoice Address</Label>
                  <Textarea
                    className={inputCls}
                    rows={3}
                    value={form.invoiceAddressFull}
                    onChange={(e) => setField("invoiceAddressFull", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Address</Label>
                  <Textarea
                    className={inputCls}
                    rows={3}
                    value={form.deliveryAddress}
                    onChange={(e) => setField("deliveryAddress", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Instructions</Label>
                  <Textarea
                    className={inputCls}
                    rows={3}
                    value={form.deliveryInstructions}
                    onChange={(e) => setField("deliveryInstructions", e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* Tab 3: Invoicing */}
              <TabsContent value="invoicing" className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Invoice Procedure</Label>
                  <Input
                    className={inputCls}
                    value={form.invoiceProcedure}
                    onChange={(e) => setField("invoiceProcedure", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="requirePO"
                    type="checkbox"
                    checked={form.requirePO}
                    onChange={(e) => setField("requirePO", e.target.checked)}
                    className="h-4 w-4 rounded border-border/40"
                  />
                  <Label htmlFor="requirePO">Require PO</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Email Invoice To</Label>
                  <Input
                    className={inputCls}
                    value={form.emailInvoiceTo}
                    onChange={(e) => setField("emailInvoiceTo", e.target.value)}
                  />
                </div>
              </TabsContent>

              {/* Tab 4: Products */}
              <TabsContent value="products" className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Top Selling Animals</Label>
                  <Textarea
                    className={inputCls}
                    rows={3}
                    value={form.topSellingAnimals}
                    onChange={(e) => setField("topSellingAnimals", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slow Seller Designs</Label>
                  <Textarea
                    className={inputCls}
                    rows={3}
                    value={form.slowSellerDesigns}
                    onChange={(e) => setField("slowSellerDesigns", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="substituteDesigns"
                    type="checkbox"
                    checked={form.substituteDesigns}
                    onChange={(e) => setField("substituteDesigns", e.target.checked)}
                    className="h-4 w-4 rounded border-border/40"
                  />
                  <Label htmlFor="substituteDesigns">Substitute Designs</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Stands Info</Label>
                  <Textarea
                    className={inputCls}
                    rows={2}
                    value={form.standsInfo}
                    onChange={(e) => setField("standsInfo", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Upsell Info</Label>
                  <Input
                    className={inputCls}
                    value={form.upsellInfo}
                    onChange={(e) => setField("upsellInfo", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cards Used</Label>
                    <Input
                      className={inputCls}
                      value={form.cardsUsed}
                      onChange={(e) => setField("cardsUsed", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Boxes Used</Label>
                    <Input
                      className={inputCls}
                      value={form.boxesUsed}
                      onChange={(e) => setField("boxesUsed", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 5: Pricing */}
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {PRODUCT_PRICE_FIELDS.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label>{f.label}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          <PoundSterling className="h-3.5 w-3.5" />
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={cn("pl-8", inputCls)}
                          value={form.pricing[f.key] ?? ""}
                          onChange={(e) => setPricingField(f.key, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Special Information — always visible below tabs */}
            <div className="space-y-1.5 mt-4 pb-4">
              <Label>Special Information</Label>
              <Textarea
                className={inputCls}
                rows={3}
                value={form.specialInformation}
                onChange={(e) => setField("specialInformation", e.target.value)}
              />
            </div>
          </ScrollArea>

          {formError && (
            <p className="text-sm text-destructive px-6 pb-1">{formError}</p>
          )}

          <DialogFooter className="px-6 py-4 border-t border-border/20">
            <Button variant="ghost" className="rounded-xl" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 text-white font-semibold"
            >
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
