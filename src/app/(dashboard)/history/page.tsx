"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { History as HistoryIcon, ShieldAlert, CalendarDays, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityRow {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityName: string;
  entityId: string;
  quantity: number | null;
  details: string;
  at: string; // ISO timestamp
}

const ACTION_STYLES: Record<string, string> = {
  added: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  updated: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  deleted: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  received: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  completed: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  confirmed: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

/** Local-timezone YYYY-MM-DD key for grouping. */
function dateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateHeading(key: string): string {
  const todayKey = dateKey(new Date().toISOString());
  const d = new Date(`${key}T12:00:00`);
  const label = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  if (key === todayKey) return `Today — ${label}`;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === dateKey(yesterday.toISOString())) return `Yesterday — ${label}`;
  return label;
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
}

export default function HistoryPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/history");
        if (res.status === 403 || res.status === 401) {
          setDenied(true);
          return;
        }
        const data = await res.json();
        if (Array.isArray(data)) setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (dateFilter && dateKey(r.at) !== dateFilter) return false;
      if (!q) return true;
      return [r.actorName, r.action, r.entityType, r.entityName, r.details]
        .some((s) => (s ?? "").toLowerCase().includes(q));
    });
  }, [rows, dateFilter, search]);

  // Group by local date, newest date first (rows arrive newest-first from the API).
  const groups = useMemo(() => {
    const map = new Map<string, ActivityRow[]>();
    for (const r of filtered) {
      const k = dateKey(r.at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (denied) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-semibold">Admin access required</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The activity history is only visible to admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg shadow-primary/25">
              <HistoryIcon className="h-4.5 w-4.5" />
            </span>
            History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily activity log — who added, updated or deleted what, and when.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity…"
              className="h-9 w-52 rounded-xl border border-border/60 bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative flex items-center">
            <CalendarDays className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 rounded-xl border border-border/60 bg-card pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="ml-1.5 flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground hover:text-foreground"
                title="Clear date filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading activity…</p>
      ) : groups.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          {rows.length === 0
            ? "No activity recorded yet. New adds, updates and deletes will appear here."
            : "No activity matches the current filters."}
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map(([key, items]) => (
            <motion.section
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-sm font-semibold">{dateHeading(key)}</h2>
                <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                  {items.length} {items.length === 1 ? "activity" : "activities"}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                {items.map((r, i) => (
                  <div
                    key={r.id}
                    className={cn(
                      "flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm",
                      i > 0 && "border-t border-border/40",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex w-20 justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                        ACTION_STYLES[r.action] ?? "bg-muted text-muted-foreground border-border/60",
                      )}
                    >
                      {r.action}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{r.actorName}</span>
                      <span
                        className={cn(
                          "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          r.actorRole === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {r.actorRole}
                      </span>{" "}
                      <span className="text-muted-foreground">{r.action}</span>
                      {r.quantity != null && r.quantity > 0 && (
                        <span className="font-semibold"> {r.quantity} ×</span>
                      )}{" "}
                      <span className="text-muted-foreground">{r.entityType}</span>{" "}
                      {r.entityName && <span className="font-medium">&ldquo;{r.entityName}&rdquo;</span>}
                      {r.details && (
                        <span className="text-muted-foreground"> — {r.details}</span>
                      )}
                    </span>

                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {timeLabel(r.at)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}
