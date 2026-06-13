"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Search,
  Loader2,
  ScanLine,
  ExternalLink,
  ImageOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store/app-store";

export default function BrandingCardsPage() {
  const { clients, clientsLoading } = useAppStore();
  const [search, setSearch] = useState("");

  // Only clients that actually have an uploaded brand card.
  const cards = useMemo(
    () => clients.filter((c) => c.brandCardImage),
    [clients],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.motherCompany ?? "").toLowerCase().includes(q),
    );
  }, [cards, search]);

  const withBarcode = useMemo(() => cards.filter((c) => c.barcodeImage).length, [cards]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-primary" />
            Branding Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every uploaded client brand card ·{" "}
            <span className="font-semibold text-primary">{cards.length}</span>{" "}
            {cards.length === 1 ? "card" : "cards"}
          </p>
        </div>
      </motion.div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { icon: CreditCard, label: "Brand Cards", value: cards.length, color: "text-primary bg-primary/10 border-primary/20" },
          { icon: ScanLine, label: "With Barcode", value: withBarcode, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
        ].map((chip) => (
          <div key={chip.label} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${chip.color}`}>
            <chip.icon className="h-4 w-4" /> {chip.label}: {chip.value.toLocaleString()}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Search by client or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl bg-card/70 glass border-border/40"
        />
      </div>

      {/* States */}
      {clientsLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading brand cards…</span>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-border/40 bg-card/70 glass">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/15 mb-4">
            <ImageOff className="h-7 w-7 text-primary" />
          </div>
          <p className="text-base font-semibold">No brand cards yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
            Upload a brand card on a client (Add or Edit client → Brand Card &amp; Barcode) and it will appear here.
          </p>
          <Link href="/clients" className="text-sm font-semibold text-primary">Go to Clients →</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Search className="h-9 w-9 opacity-20 mb-3" />
          <p className="text-sm font-medium">No cards match &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.03 }}
                className="group rounded-2xl border border-border/40 bg-card/70 glass overflow-hidden hover:border-primary/40 transition-colors"
              >
                {/* Brand card image */}
                <div className="relative h-44 w-full bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.brandCardImage}
                    alt={`${c.name} brand card`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Meta */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      {c.motherCompany && (
                        <p className="text-[11px] text-muted-foreground truncate">{c.motherCompany}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{c.id}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    {c.barcodeImage ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <ScanLine className="h-3 w-3" /> Barcode
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">No barcode</span>
                    )}
                    <Link
                      href={`/clients/${c.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                    >
                      View client <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
