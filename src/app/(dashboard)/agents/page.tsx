"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ArrowUpDown,
  Pencil,
  Trash2,
  Star,
  Briefcase,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  address: string;
  city: string;
  contactNumber: string;
  email: string;
  referredPoints: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const agents: Agent[] = [
  {
    id: "AGT-001",
    name: "James Thornton",
    address: "14 Victoria Street",
    city: "London",
    contactNumber: "+44 207 456 7890",
    email: "james.thornton@agency.co.uk",
    referredPoints: 8,
  },
  {
    id: "AGT-002",
    name: "Sophie Williams",
    address: "7 Park Lane",
    city: "Manchester",
    contactNumber: "+44 161 234 5678",
    email: "sophie.w@salesrep.co.uk",
    referredPoints: 12,
  },
  {
    id: "AGT-003",
    name: "Richard Blake",
    address: "22 Castle Road",
    city: "Edinburgh",
    contactNumber: "+44 131 667 8899",
    email: "r.blake@wholesale.co.uk",
    referredPoints: 3,
  },
  {
    id: "AGT-004",
    name: "Emma Clarke",
    address: "5 Broad Street",
    city: "Birmingham",
    contactNumber: "+44 121 789 0011",
    email: "emma.clarke@agents.co.uk",
    referredPoints: 15,
  },
  {
    id: "AGT-005",
    name: "Daniel Morris",
    address: "33 Ocean Drive",
    city: "Brighton",
    contactNumber: "+44 1273 445 678",
    email: "dmorris@jewelsales.co.uk",
    referredPoints: 6,
  },
  {
    id: "AGT-006",
    name: "Fiona Reid",
    address: "9 Market Square",
    city: "Leeds",
    contactNumber: "+44 113 332 1122",
    email: "fiona.reid@retailreps.co.uk",
    referredPoints: 9,
  },
  {
    id: "AGT-007",
    name: "Thomas Grant",
    address: "18 Harbour View",
    city: "Bristol",
    contactNumber: "+44 117 556 7788",
    email: "tgrant@agentnetwork.co.uk",
    referredPoints: 2,
  },
  {
    id: "AGT-008",
    name: "Alice Patterson",
    address: "41 Queen Street",
    city: "Glasgow",
    contactNumber: "+44 141 998 7766",
    email: "alice.p@salesforce.co.uk",
    referredPoints: 21,
  },
];

// ─── Referred Points Badge ────────────────────────────────────────────────────
function ReferredPointsBadge({ points }: { points: number }) {
  const tier =
    points >= 15
      ? { label: "Gold", cls: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" }
      : points >= 8
      ? { label: "Silver", cls: "bg-slate-400/10 border-slate-400/25 text-slate-500 dark:text-slate-300", dot: "bg-slate-400" }
      : { label: "Bronze", cls: "bg-orange-700/10 border-orange-700/25 text-orange-700 dark:text-orange-400", dot: "bg-orange-600" };

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${tier.cls}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${tier.dot}`} />
        <span className="text-[11px] font-bold tabular-nums">{points}</span>
      </div>
      <span className={`text-[10px] font-semibold ${tier.cls.split(" ").filter(c => c.startsWith("text-")).join(" ")}`}>
        {tier.label}
      </span>
    </div>
  );
}

// ─── Filter Options ───────────────────────────────────────────────────────────
const filterOptions = [
  { label: "All Agents", value: "all" },
  { label: "Gold (15+)", value: "gold" },
  { label: "Silver (8–14)", value: "silver" },
  { label: "Bronze (0–7)", value: "bronze" },
];

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof Agent>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let list = [...agents];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.contactNumber.includes(q)
      );
    }

    if (filter === "gold") list = list.filter((a) => a.referredPoints >= 15);
    else if (filter === "silver") list = list.filter((a) => a.referredPoints >= 8 && a.referredPoints < 15);
    else if (filter === "bronze") list = list.filter((a) => a.referredPoints < 8);

    list.sort((a, b) => {
      const av = String(a[sortField]).toLowerCase();
      const bv = String(b[sortField]).toLowerCase();
      if (sortField === "referredPoints") {
        return sortDir === "asc"
          ? a.referredPoints - b.referredPoints
          : b.referredPoints - a.referredPoints;
      }
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [search, filter, sortDir, sortField]);

  const toggleSort = (field: keyof Agent) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const totalPoints = agents.reduce((s, a) => s + a.referredPoints, 0);

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
            Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agents.length} registered agents
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button className="gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 shadow-lg shadow-primary/20 text-white font-semibold">
            <Plus className="h-4 w-4" />
            Add Agent
          </Button>
        </motion.div>
      </motion.div>

      {/* ── Summary Chips ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { icon: Users,     label: "Total Agents",    value: agents.length,                                                   color: "text-primary bg-primary/10 border-primary/20" },
          { icon: Star,      label: "Gold",            value: agents.filter((a) => a.referredPoints >= 15).length,             color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { icon: Star,      label: "Silver",          value: agents.filter((a) => a.referredPoints >= 8 && a.referredPoints < 15).length, color: "text-slate-500 dark:text-slate-300 bg-slate-400/10 border-slate-400/20" },
          { icon: Briefcase, label: "Total Referrals", value: totalPoints,                                                     color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
        ].map((chip, i) => (
          <motion.div
            key={chip.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}
          >
            <chip.icon className="h-4 w-4" />
            {chip.label}: {chip.value}
          </motion.div>
        ))}
      </motion.div>

      {/* ── Search & Filter ── */}
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
            className="pl-9 rounded-xl bg-card/70 glass border-border/40"
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
          <DropdownMenuContent align="end" className="w-48 glass-strong bg-popover/95 border-border/40 rounded-2xl p-1">
            {filterOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`rounded-xl cursor-pointer text-sm ${filter === opt.value ? "bg-primary/10 text-primary font-semibold" : ""}`}
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
          <table className="w-full min-w-[860px] border-collapse">
            {/* ── Head ── */}
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                {[
                  { label: "Agent Name",     field: "name"           as keyof Agent, w: "w-[200px]" },
                  { label: "Address",        field: "address"        as keyof Agent, w: "w-[200px]" },
                  { label: "City",           field: "city"           as keyof Agent, w: "w-[120px]" },
                  { label: "Contact Number", field: "contactNumber"  as keyof Agent, w: "w-[150px]" },
                  { label: "Email",          field: "email"          as keyof Agent, w: "w-[210px]" },
                  { label: "Ref. Points",    field: "referredPoints" as keyof Agent, w: "w-[130px]" },
                ].map((col) => (
                  <th key={col.field} className={`${col.w} px-5 py-3 text-left`}>
                    <button
                      onClick={() => toggleSort(col.field)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown
                        className={`h-3 w-3 transition-colors ${sortField === col.field ? "text-primary" : "opacity-40"}`}
                      />
                    </button>
                  </th>
                ))}
                <th className="w-[100px] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            {/* ── Body ── */}
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
                        <p className="text-sm font-medium">No agents match your search</p>
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((agent, i) => (
                    <motion.tr
                      key={agent.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.22, delay: i * 0.035 }}
                      className="group border-b border-border/20 hover:bg-accent/25 transition-colors last:border-b-0"
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5 align-middle">
                        <p className="text-sm font-semibold leading-tight">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{agent.id}</p>
                      </td>

                      {/* Address */}
                      <td className="px-5 py-3.5 align-middle max-w-[200px]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {agent.address}
                          </p>
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-5 py-3.5 align-middle">
                        <p className="text-sm font-medium">{agent.city}</p>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <p className="text-xs tabular-nums">{agent.contactNumber}</p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 align-middle max-w-[210px]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <p className="text-xs truncate">{agent.email}</p>
                        </div>
                      </td>

                      {/* Referred Points */}
                      <td className="px-5 py-3.5 align-middle">
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", delay: i * 0.035 + 0.1 }}
                        >
                          <ReferredPointsBadge points={agent.referredPoints} />
                        </motion.div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Edit agent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Delete agent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/20 bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-semibold text-foreground">{agents.length}</span> agents
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
