"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Boxes, Package, ArrowRight, Layers, PackagePlus } from "lucide-react";
import { INVENTORY_CATEGORIES } from "@/lib/data/inventory-categories";
import { useInventory } from "@/lib/store/inventory-store";

export default function InventoryPage() {
  const { items } = useInventory();
  const readyCount = INVENTORY_CATEGORIES.filter((c) => c.ready).length;
  const totalProducts = items.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
          Inventory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {INVENTORY_CATEGORIES.length} product categories — {readyCount} ready, select one to view stock & codes
        </p>
      </motion.div>

      {/* All Components + Add Component banners */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.04 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* All Components — master view */}
        <Link
          href="/inventory/all-components"
          className="group relative block lg:col-span-2 rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/10"
        >
          <div className="flex items-center gap-4 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-500 shadow-lg shadow-primary/20">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">All Components</h2>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wide">
                  Master
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Search, modify & delete across every category —{" "}
                <span className="font-semibold text-foreground">{totalProducts.toLocaleString()} components</span> in one view
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>

        {/* Add Component */}
        <Link
          href="/inventory/add-component"
          className="group relative block rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.07] overflow-hidden transition-colors"
        >
          <div className="flex items-center gap-4 p-5 h-full">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <PackagePlus className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold">Add Component</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                Create a new component & save it into the inventory
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Link>
      </motion.div>

      {/* Category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {INVENTORY_CATEGORIES.map((cat, i) => {
          const Card = cat.ready ? Link : "div";
          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
              whileHover={cat.ready ? { y: -4, transition: { duration: 0.2 } } : undefined}
              className={`group relative rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden transition-shadow ${
                cat.ready ? "cursor-pointer hover:shadow-lg hover:shadow-primary/10" : "opacity-60"
              }`}
            >
              <Card href={cat.href as string} className="block">
                {/* Gradient top strip */}
                <div className={`h-24 bg-gradient-to-br ${cat.color} flex items-center justify-center relative`}>
                  {cat.ready ? (
                    <Boxes className="h-10 w-10 text-white/80" />
                  ) : (
                    <Package className="h-10 w-10 text-white/80" />
                  )}
                  {cat.ready && (
                    <div className="absolute top-2 right-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                      Ready
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{cat.name}</p>
                    {cat.ready && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    )}
                  </div>
                  {cat.ready ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {cat.count?.toLocaleString()} products
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Coming soon</p>
                  )}
                </div>
              </Card>

              {/* Hover overlay */}
              {cat.ready && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
