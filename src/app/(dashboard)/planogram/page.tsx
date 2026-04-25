"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LayoutGrid, Box, ArrowRight } from "lucide-react";

const planogramTypes = [
  { name: "4 Sided Floor Stand",           href: "/planogram/4-sided-floor-stand",               sides: 4, total: 768, color: "from-violet-500 to-purple-600", ready: true },
  { name: "4 Sided Stand Neck Brac Key Bag", href: "/planogram/4-sided-stand-neck-brac-key-bag", sides: 4, total: 768, color: "from-rose-500 to-pink-600",     ready: true },
  { name: "Type 3", href: "#", sides: 0, total: 0, color: "from-emerald-500 to-teal-500",   ready: false },
  { name: "Type 4", href: "#", sides: 0, total: 0, color: "from-amber-500 to-orange-500",   ready: false },
  { name: "Type 5", href: "#", sides: 0, total: 0, color: "from-blue-500 to-cyan-500",      ready: false },
  { name: "Type 6", href: "#", sides: 0, total: 0, color: "from-indigo-500 to-blue-500",    ready: false },
  { name: "Type 7", href: "#", sides: 0, total: 0, color: "from-fuchsia-500 to-purple-500", ready: false },
  { name: "Type 8", href: "#", sides: 0, total: 0, color: "from-lime-500 to-emerald-500",   ready: false },
];

export default function PlanogramPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
          Planograms
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          8 planogram types — 2 ready, select one to view or manage
        </p>
      </motion.div>

      {/* Planogram type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {planogramTypes.map((type, i) => {
          const Card = type.ready ? Link : "div";
          return (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 * i }}
              whileHover={type.ready ? { y: -4, transition: { duration: 0.2 } } : undefined}
              className={`group relative rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden transition-shadow ${
                type.ready ? "cursor-pointer hover:shadow-lg hover:shadow-primary/10" : "opacity-60"
              }`}
            >
              <Card href={type.href as string} className="block">
                {/* Gradient top strip */}
                <div className={`h-24 bg-gradient-to-br ${type.color} flex items-center justify-center relative`}>
                  {type.ready ? (
                    <Box className="h-10 w-10 text-white/80" />
                  ) : (
                    <LayoutGrid className="h-10 w-10 text-white/80" />
                  )}
                  {type.ready && (
                    <div className="absolute top-2 right-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      Ready
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{type.name}</p>
                    {type.ready && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  {type.ready ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {type.sides} sides &middot; {type.total} units
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Coming soon</p>
                  )}
                </div>
              </Card>

              {/* Hover overlay */}
              {type.ready && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
