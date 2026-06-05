"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LayoutGrid, Box, ArrowRight, Plus, Loader2 } from "lucide-react";
import { useCustomPlanograms } from "@/lib/hooks/use-planograms";

const planogramTypes = [
  { name: "4 Sided Floor Stand",           href: "/planogram/4-sided-floor-stand",               sides: 4, total: 768, color: "from-violet-500 to-purple-600", ready: true },
  { name: "4 Sided Stand Neck Brac Key Bag", href: "/planogram/4-sided-stand-neck-brac-key-bag",   sides: 4,   total: 768, color: "from-rose-500 to-pink-600",     ready: true },
  { name: "All Designs Large Keyrings",      href: "/planogram/all-designs-large-keyrings",        sides: 0,   total: 268, color: "from-emerald-500 to-teal-600",  ready: true },
  { name: "All Designs Magnets",             href: "/planogram/all-designs-magnets",               sides: 0,   total: 250, color: "from-amber-500 to-orange-600",  ready: true },
];

export default function PlanogramPage() {
  const { planograms, loading } = useCustomPlanograms();

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
            Planograms
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Built-in stands and your own custom planograms
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/planogram/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:from-primary/90 hover:to-indigo-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add New Planogram
          </Link>
        </motion.div>
      </motion.div>

      {/* Built-in planograms */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Built-in</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {planogramTypes.map((type, i) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-shadow"
            >
              <Link href={type.href} className="block">
                <div className={`h-24 bg-gradient-to-br ${type.color} flex items-center justify-center relative`}>
                  <Box className="h-10 w-10 text-white/80" />
                  <div className="absolute top-2 right-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                    Ready
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{type.name}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {type.sides > 0 ? `${type.sides} sides · ` : ""}{type.total} units
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom planograms */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Planograms</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Add new card */}
          <Link
            href="/planogram/new"
            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 bg-card/40 hover:border-primary/50 hover:bg-accent/20 transition-colors min-h-[164px] text-center p-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 group-hover:bg-primary/20 transition-colors">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-semibold">Add New Planogram</p>
            <p className="text-[11px] text-muted-foreground">Build your own stand layout</p>
          </Link>

          {loading ? (
            <div className="col-span-full flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> <span className="text-sm">Loading…</span>
            </div>
          ) : (
            planograms.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.04 * i }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-shadow"
              >
                <Link href={`/planogram/custom/${p.id}`} className="block">
                  <div className="h-24 bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center relative">
                    <LayoutGrid className="h-10 w-10 text-white/80" />
                    <div className="absolute top-2 right-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      Custom
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {p.sides.length} side{p.sides.length === 1 ? "" : "s"} · {p.totalUnits} units
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
