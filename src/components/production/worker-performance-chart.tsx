"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Award, TrendingUp } from "lucide-react";
import type { ProductionLog, ProductionStaff } from "@/lib/store/app-store";

interface Props {
  logs: ProductionLog[];
  staff: ProductionStaff[];
  monthPrefix: string; // e.g. "2026-04"
  monthLabel: string;  // e.g. "April 2026"
}

interface ChartRow {
  name: string;
  fullName: string;
  completed: number;
  pending: number;
  logCount: number;
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const row: ChartRow = payload[0]?.payload;
  const completed = payload.find((p: any) => p.dataKey === "completed")?.value ?? 0;
  const pending   = payload.find((p: any) => p.dataKey === "pending")?.value   ?? 0;
  return (
    <div className="rounded-xl border border-border/40 bg-card px-3 py-2.5 text-xs shadow-xl space-y-1.5 min-w-[150px]">
      <p className="font-bold text-foreground">{row?.fullName}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1 text-emerald-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Completed
        </span>
        <span className="font-semibold tabular-nums">{completed.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1 text-amber-500">
          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Pending
        </span>
        <span className="font-semibold tabular-nums">{pending.toLocaleString()}</span>
      </div>
      <div className="border-t border-border/20 pt-1.5 flex items-center justify-between gap-4">
        <span className="text-muted-foreground/60">Total</span>
        <span className="font-bold tabular-nums">{(completed + pending).toLocaleString()}</span>
      </div>
    </div>
  );
}

export function WorkerPerformanceChart({ logs, staff, monthPrefix, monthLabel }: Props) {
  const chartData = useMemo<ChartRow[]>(() => {
    return staff
      .map((s) => {
        const monthLogs = logs.filter(
          (l) => l.staffId === s.id && l.dateOut?.startsWith(monthPrefix)
        );
        const completed = monthLogs
          .filter((l) => l.complete)
          .reduce((sum, l) => sum + (l.qtyIn ?? l.qtyOut ?? 0), 0);
        const pending = monthLogs
          .filter((l) => !l.complete)
          .reduce((sum, l) => sum + (l.qtyOut ?? 0), 0);
        return {
          name:     s.name.split(" ")[0],
          fullName: s.name,
          completed,
          pending,
          logCount: monthLogs.length,
          total:    completed + pending,
        };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.completed - a.completed);
  }, [logs, staff, monthPrefix]);

  const topPerformer   = chartData[0];
  const totalCompleted = chartData.reduce((s, d) => s + d.completed, 0);
  const totalPending   = chartData.reduce((s, d) => s + d.pending, 0);

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.12 }}
      className="rounded-2xl border border-border/40 bg-card/70 glass p-5 space-y-5"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Worker Performance
          </p>
          <h3 className="text-base font-bold tracking-tight mt-0.5">
            {monthLabel} — Production by Staff
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {topPerformer && (
            <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
              <Award className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Top: {topPerformer.name} &mdash; {topPerformer.completed.toLocaleString()} units
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              {totalCompleted.toLocaleString()} done &middot; {totalPending.toLocaleString()} pending
            </span>
          </div>
        </div>
      </div>

      {/* ── Column chart ───────────────────────────────────────────────────── */}
      <div style={{ height: 230 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            barCategoryGap="35%"
            barGap={3}
            margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(150,150,150,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(109,40,217,0.07)", radius: 8 } as object}
            />
            <Bar
              dataKey="completed"
              name="Completed"
              stackId="stack"
              fill="#10b981"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="pending"
              name="Pending"
              stackId="stack"
              fill="#f59e0b"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 inline-block" />
          Completed qty
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 inline-block" />
          Pending qty
        </span>
      </div>

      {/* ── Per-worker breakdown cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {chartData.map((d, i) => {
          const rate = d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0;
          const initials = d.fullName.split(" ").map((n) => n[0]).join("").toUpperCase();
          return (
            <motion.div
              key={d.fullName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className="rounded-xl border border-border/30 bg-muted/20 p-3 space-y-2.5"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${
                    i === 0 ? "bg-emerald-500" : "bg-primary/80"
                  }`}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight truncate">{d.fullName}</p>
                  <p className="text-[10px] text-muted-foreground/60 leading-tight">
                    {d.logCount} log{d.logCount !== 1 ? "s" : ""} this month
                  </p>
                </div>
              </div>

              {/* Numbers */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ {d.completed.toLocaleString()}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  ⏳ {d.pending.toLocaleString()}
                </span>
              </div>

              {/* Completion bar */}
              <div>
                <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rate}%` }}
                    transition={{ duration: 0.7, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                    className="h-full rounded-full bg-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-right mt-0.5">
                  {rate}% complete
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
