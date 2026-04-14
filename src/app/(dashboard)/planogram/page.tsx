"use client";

import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";

const planogramTypes = [
  { name: "Type 1", color: "from-violet-500 to-purple-600" },
  { name: "Type 2", color: "from-blue-500 to-cyan-500" },
  { name: "Type 3", color: "from-emerald-500 to-teal-500" },
  { name: "Type 4", color: "from-amber-500 to-orange-500" },
  { name: "Type 5", color: "from-rose-500 to-pink-500" },
  { name: "Type 6", color: "from-indigo-500 to-blue-500" },
  { name: "Type 7", color: "from-fuchsia-500 to-purple-500" },
  { name: "Type 8", color: "from-lime-500 to-emerald-500" },
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
          8 planogram types — select one to view or manage
        </p>
      </motion.div>

      {/* Planogram type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {planogramTypes.map((type, i) => (
          <motion.div
            key={type.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 * i }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden cursor-pointer transition-shadow hover:shadow-lg hover:shadow-primary/10"
          >
            {/* Gradient top strip */}
            <div className={`h-24 bg-gradient-to-br ${type.color} flex items-center justify-center`}>
              <LayoutGrid className="h-10 w-10 text-white/80" />
            </div>

            {/* Label */}
            <div className="p-4">
              <p className="text-sm font-semibold">{type.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Coming soon</p>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
