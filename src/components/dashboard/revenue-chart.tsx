"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const COLORS = [
  "#6d28d9", // purple
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#8b5cf6", // violet
];

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Mock revenue per day (oldest → newest)
const SEED_REVENUE = [3200, 1850, 4750, 2900, 5100, 3600, 4280];

interface DayEntry {
  day: string;
  date: string;
  fullDate: string;
  value: number;
  isToday: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: DayEntry = payload[0].payload;
  return (
    <div className="rounded-xl border border-border/40 bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{d.day} — {d.fullDate}</p>
      <p className="text-primary font-bold mt-0.5">£{d.value.toLocaleString()}</p>
    </div>
  );
}

export function RevenueChart() {
  const data = useMemo<DayEntry[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      return {
        day: DAY_SHORT[d.getDay()],
        date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        fullDate: d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long" }),
        value: SEED_REVENUE[i],
        isToday: i === 6,
      };
    });
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  const todayRevenue = data[6].value;
  const yesterdayRevenue = data[5].value;
  const todayChange = Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="rounded-2xl border border-border/40 bg-card/70 glass p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Revenue
          </p>
          <h3 className="text-lg font-bold tracking-tight mt-0.5">Last 7 Days</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground/60">Total</p>
            <p className="text-base font-bold text-primary">£{total.toLocaleString()}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center">
        {/* Donut chart */}
        <div className="relative shrink-0" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Today</p>
            <p className="text-lg font-bold text-foreground leading-tight">£{todayRevenue.toLocaleString()}</p>
            <span className={`text-[10px] font-semibold mt-0.5 ${todayChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {todayChange >= 0 ? "+" : ""}{todayChange}% vs yesterday
            </span>
          </div>
        </div>

        {/* Day-by-day breakdown */}
        <div className="flex-1 w-full space-y-2.5">
          {data.map((d, i) => {
            const pct = Math.round((d.value / total) * 100);
            return (
              <div key={`row-${i}`} className="flex items-center gap-2.5">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {d.day}{" "}
                      <span className="text-muted-foreground/60 font-normal">{d.date}</span>
                      {d.isToday && (
                        <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wide">
                          today
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-semibold tabular-nums shrink-0">
                      £{d.value.toLocaleString()}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.5 + i * 0.07, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground/50 tabular-nums w-7 text-right shrink-0">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
