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
  ArrowUpDown,
  Eye,
  Trash2,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store/app-store";
import type { Client } from "@/lib/store/app-store";
import {
  ACCOUNT_STATUS_OPTIONS,
  normalizeAccountStatus,
  type AccountStatus,
} from "@/lib/client-status";
import { useRole } from "@/lib/hooks/use-role";
import { useAgents } from "@/lib/hooks/use-agents";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseDaysAgo(str?: string): number {
  const m = (str ?? "").match(/(\d+)\s+days?\s+ago/i);
  return m ? parseInt(m[1], 10) : 0;
}

/** Convert the human-readable last-order value into an age for chronological sorting. */
function parseLastOrderAge(str?: string): number {
  const value = (str ?? "").trim().toLowerCase();
  if (!value || value === "no orders yet" || value === "never") return Number.POSITIVE_INFINITY;
  if (value === "today") return 0;
  if (value === "yesterday") return 1;

  const relative = value.match(/(\d+)\s+(day|week|month|year)s?\s+ago/);
  if (relative) {
    const amount = Number(relative[1]);
    const multiplier = { day: 1, week: 7, month: 30, year: 365 }[
      relative[2] as "day" | "week" | "month" | "year"
    ];
    return amount * multiplier;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}
const INACTIVE_THRESHOLD = 60;

// ─── Config ──────────────────────────────────────────────────────────────────
const statusConfig: Record<AccountStatus, { label: string; className: string }> = {
  new_client: {
    label: "New Client",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  potential_client: {
    label: "Potential Client",
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  previous_client: {
    label: "Previous Client",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  existing_client: {
    label: "Existing Client",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
};

const filterOptions: { label: string; value: string }[] = [
  { label: "All Clients", value: "all" },
  ...ACCOUNT_STATUS_OPTIONS,
  { label: "Inactive", value: "inactive" },
  { label: "Good History", value: "good" },
  { label: "Bad History", value: "bad" },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const store = useAppStore();
  const clientList = store.clients;
  const { isAdmin } = useRole();
  const { agents } = useAgents();
  const agentNameById = useMemo(
    () => new Map(agents.map((agent) => [agent.id, agent.name])),
    [agents],
  );

  // ── Filter / search / sort ──
  const [search, setSearch] = useState("");
  const [postcodeFilter, setPostcodeFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof Client>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Filtered + sorted list ──
  const filtered = useMemo(() => {
    let list = [...clientList];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          (c.postcode ?? "").toLowerCase().includes(q) ||
          (c.region ?? "").toLowerCase().includes(q) ||
          (c.companyNumber ?? "").toLowerCase().includes(q) ||
          (agentNameById.get(c.agentId ?? "") || c.agentName || "").toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contactNumber.includes(q),
      );
    }

    if (postcodeFilter.trim()) {
      const postcode = postcodeFilter.trim().toLowerCase();
      list = list.filter((c) => (c.postcode ?? "").toLowerCase().includes(postcode));
    }

    if (regionFilter.trim()) {
      const region = regionFilter.trim().toLowerCase();
      list = list.filter((c) => (c.region ?? "").toLowerCase().includes(region));
    }

    if (agentSearch.trim()) {
      const agent = agentSearch.trim().toLowerCase();
      list = list.filter((c) =>
        (agentNameById.get(c.agentId ?? "") || c.agentName || "")
          .toLowerCase()
          .includes(agent),
      );
    }

    if (filter !== "all") {
      if (filter === "good" || filter === "bad") {
        list = list.filter((c) => c.history === filter);
      } else if (filter === "inactive") {
        list = list.filter((c) => parseDaysAgo(c.lastOrder) > INACTIVE_THRESHOLD);
      } else {
        list = list.filter((c) => normalizeAccountStatus(c.accountStatus) === filter);
      }
    }

    list.sort((a, b) => {
      if (sortField === "lastOrder") {
        const aAge = parseLastOrderAge(a.lastOrder);
        const bAge = parseLastOrderAge(b.lastOrder);

        // Clients without an order stay at the end in either direction.
        if (!Number.isFinite(aAge)) return Number.isFinite(bAge) ? 1 : a.name.localeCompare(b.name);
        if (!Number.isFinite(bAge)) return -1;

        const ageDifference = aAge - bAge;
        if (ageDifference !== 0) return sortDir === "asc" ? ageDifference : -ageDifference;
        return a.name.localeCompare(b.name);
      }

      if (sortField === "agentName") {
        const av = (agentNameById.get(a.agentId ?? "") || a.agentName || "").toLowerCase();
        const bv = (agentNameById.get(b.agentId ?? "") || b.agentName || "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }

      const av = String(a[sortField]).toLowerCase();
      const bv = String(b[sortField]).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [agentNameById, agentSearch, clientList, search, postcodeFilter, regionFilter, filter, sortDir, sortField]);

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
  const existingCount = clientList.filter(
    (c) => normalizeAccountStatus(c.accountStatus) === "existing_client",
  ).length;
  const inactiveCount = clientList.filter(
    (c) => parseDaysAgo(c.lastOrder) > INACTIVE_THRESHOLD,
  ).length;

  // ── Delete confirmation ──
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const askRemove = useCallback((client: Client) => {
    setClientToDelete(client);
  }, []);
  const confirmRemove = useCallback(() => {
    if (clientToDelete) {
      store.deleteClient(clientToDelete.id);
      setClientToDelete(null);
    }
  }, [clientToDelete, store]);
  const cancelRemove = useCallback(() => setClientToDelete(null), []);

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/api/clients/export">
                <Button variant="outline" className="gap-2 rounded-xl border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15">
                  <Download className="h-4 w-4" />
                  Download All Excel
                </Button>
              </Link>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/clients/new">
              <Button
                className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </Link>
          </motion.div>
        </div>
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
          const isActive = filter === "existing_client";
          return (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(isActive ? "all" : "existing_client")}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                isActive
                  ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/30"
                  : "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
              )}
            >
              <Building2 className="h-4 w-4" />
              Existing Clients: {existingCount}
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
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(240px,1fr)_175px_175px_180px_190px_170px]"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search by client, company, city, email..."
            className="pl-9 rounded-xl bg-muted/30 border-border/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            aria-label="Filter clients by postcode"
            placeholder="Filter by postcode"
            className="pl-9 rounded-xl bg-muted/30 border-border/40"
            value={postcodeFilter}
            onChange={(e) => setPostcodeFilter(e.target.value)}
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            aria-label="Filter clients by region"
            placeholder="Filter by region"
            className="pl-9 rounded-xl bg-muted/30 border-border/40"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          />
        </div>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            aria-label="Search clients by agent"
            placeholder="Search by agent"
            className="pl-9 rounded-xl bg-muted/30 border-border/40"
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Sort clients by latest order"
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/70 glass px-4 py-2 text-sm font-medium hover:bg-accent/40 transition-colors focus-visible:outline-none min-w-[180px] justify-between"
          >
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span>
                {sortField === "lastOrder"
                  ? sortDir === "asc"
                    ? "Newest orders first"
                    : "Oldest orders first"
                  : "Sort by latest order"}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1"
          >
            <DropdownMenuItem
              onClick={() => {
                setSortField("lastOrder");
                setSortDir("asc");
              }}
              className={cn(
                "rounded-xl cursor-pointer text-sm",
                sortField === "lastOrder" && sortDir === "asc" &&
                  "bg-primary/10 text-primary font-semibold",
              )}
            >
              Newest orders first
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSortField("lastOrder");
                setSortDir("desc");
              }}
              className={cn(
                "rounded-xl cursor-pointer text-sm",
                sortField === "lastOrder" && sortDir === "desc" &&
                  "bg-primary/10 text-primary font-semibold",
              )}
            >
              Oldest orders first
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                {[
                  { label: "Client Name", field: "name" as keyof Client, w: "w-[260px]" },
                  { label: "Agent", field: "agentName" as keyof Client, w: "w-[150px]" },
                  { label: "Last Ordered", field: "lastOrder" as keyof Client, w: "w-[140px]" },
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
                <th className="w-[160px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <tr key="empty">
                    <td colSpan={7}>
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
                    const st = statusConfig[normalizeAccountStatus(client.accountStatus)];
                    const assignedAgentName =
                      agentNameById.get(client.agentId ?? "") || client.agentName;
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

                        {/* Assigned Agent */}
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            <p className="text-xs">{assignedAgentName || "Unassigned"}</p>
                          </div>
                        </td>

                        {/* Last Ordered */}
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            <p className={cn("text-xs", isInactive && "font-medium text-amber-600 dark:text-amber-400")}>
                              {client.lastOrder || "No orders yet"}
                            </p>
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
                          <div className="flex items-center gap-1.5">
                            {/* Chase Up — only when inactive */}
                            {isInactive && (
                              <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href={`mailto:${client.email}?subject=${encodeURIComponent(`Checking In — ${client.name}`)}&body=${encodeURIComponent(`Hi there,\n\nWe noticed we haven't heard from you in a while and wanted to check in.\n\nIs everything okay with your account? We'd love to hear from you and see if there's anything we can help with.\n\nPlease feel free to reply to this email or give us a call.\n\nBest regards,\nWildtouch Team`)}`}
                                title="Chase Up"
                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                              >
                                <SendHorizontal className="h-3.5 w-3.5" />
                              </motion.a>
                            )}

                            {/* View Details — always visible, modern button */}
                            <motion.div
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                            >
                              <Link
                                href={`/clients/${client.id}`}
                                className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors text-xs font-semibold"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View</span>
                              </Link>
                            </motion.div>

                            {/* Delete — always visible, modern destructive button */}
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => askRemove(client)}
                              title="Delete"
                              className="flex items-center justify-center h-8 w-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </motion.button>
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
          Dialog: Confirm Delete
         ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!clientToDelete} onOpenChange={(o) => !o && cancelRemove()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Delete Client?</DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </DialogHeader>

          {clientToDelete && (
            <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
              <p className="text-sm font-semibold">{clientToDelete.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">{clientToDelete.id}</span>
                <span className="text-[10px] text-muted-foreground">&middot;</span>
                <span className="text-[10px] text-muted-foreground">{clientToDelete.email}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={cancelRemove}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl gap-1.5 shadow-md shadow-destructive/20"
              onClick={confirmRemove}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
