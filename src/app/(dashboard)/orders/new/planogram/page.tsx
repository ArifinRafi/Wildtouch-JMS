"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, RefreshCcw, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepNav } from "@/components/orders/step-nav";
import { SlotPlanogramGrid } from "@/components/planogram/slot-planogram-grid";
import { SegmentPlanogramGrid } from "@/components/planogram/segment-planogram-grid";
import { RowPlanogramGrid } from "@/components/planogram/row-planogram-grid";
import { useOrderDraft } from "@/lib/store/order-draft";
import { useInventory } from "@/lib/store/inventory-store";
import { getOrderablePlanograms } from "@/lib/data/planograms";
import { getSlotPlanogram, buildInitialSlots } from "@/lib/data/slot-planograms";
import { getSegmentPlanogram, buildInitialSegQty } from "@/lib/data/segment-planograms";
import { useCustomPlanograms } from "@/lib/hooks/use-planograms";
import { matchInventoryByDescription } from "@/lib/orders/match";

export default function PlanogramStepPage() {
  const { draft, patchDraft } = useOrderDraft();
  const { items } = useInventory();
  const { planograms: custom } = useCustomPlanograms();

  // Selector list: custom + built-in.
  const selectorList = useMemo(() => {
    const customList = custom.map((c) => ({
      id: c.id,
      name: c.name,
      count: c.sides.reduce((a, s) => a + s.rows.reduce((b, r) => b + r.cells.filter((cell) => cell.product.trim()).length, 0), 0),
    }));
    const builtin = getOrderablePlanograms().map((p) => ({ id: p.id, name: p.name, count: p.productCount }));
    return [...customList, ...builtin];
  }, [custom]);

  const id = draft.planogram?.id ?? null;
  const slotPg = useMemo(() => (id ? getSlotPlanogram(id) : null), [id]);
  const segPg = useMemo(() => (id ? getSegmentPlanogram(id) : null), [id]);
  const customPg = useMemo(() => (id ? custom.find((c) => c.id === id) ?? null : null), [id, custom]);

  // Per-mode state
  const [slots, setSlots] = useState<number[][][]>([]);
  const [slotActive, setSlotActive] = useState(0);
  const slotInited = useRef<string | null>(null);

  const [segQty, setSegQty] = useState<number[][][]>([]);
  const [segActive, setSegActive] = useState(0);
  const segInited = useRef<string | null>(null);

  const [rowQty, setRowQty] = useState<number[][][]>([]);
  const [rowActive, setRowActive] = useState(0);
  const rowInited = useRef<string | null>(null);

  useEffect(() => {
    if (!slotPg) { slotInited.current = null; return; }
    if (slotInited.current === slotPg.id) return;
    slotInited.current = slotPg.id;
    setSlots(draft.slots && draft.slots.length ? draft.slots : buildInitialSlots(slotPg));
    setSlotActive(0);
  }, [slotPg, draft.slots]);

  useEffect(() => {
    if (!segPg) { segInited.current = null; return; }
    if (segInited.current === segPg.id) return;
    segInited.current = segPg.id;
    setSegQty(draft.segQty && draft.segQty.length ? draft.segQty : buildInitialSegQty(segPg));
    setSegActive(0);
  }, [segPg, draft.segQty]);

  useEffect(() => {
    if (!customPg) { rowInited.current = null; return; }
    if (rowInited.current === customPg.id) return;
    rowInited.current = customPg.id;
    setRowQty(
      draft.rowQty && draft.rowQty.length
        ? draft.rowQty
        : customPg.sides.map((s) => s.rows.map((r) => r.cells.map((c) => c.qty))),
    );
    setRowActive(0);
  }, [customPg, draft.rowQty]);

  const changePlanogram = () => {
    slotInited.current = null; segInited.current = null; rowInited.current = null;
    setSlots([]); setSegQty([]); setRowQty([]);
    patchDraft({ planogram: null, lineItems: [], slots: undefined, segQty: undefined, rowQty: undefined });
  };

  const lineItemFor = (description: string, qtyOrdered: number) => {
    const m = matchInventoryByDescription(description, items);
    return { description, code: m?.code || "", category: m?.category || "", qtyOrdered };
  };

  // ── Totals + Next per mode ──
  const slotGrand = slots.reduce((s, side) => s + side.reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0), 0);
  const slotNext = (): boolean => {
    if (!slotPg) return false;
    const map = new Map<string, number>();
    slotPg.sides.forEach((side, si) => side.rows.forEach((r, ri) => {
      const q = (slots[si]?.[ri] ?? []).reduce((a, b) => a + b, 0);
      if (q > 0) map.set(r.description, (map.get(r.description) ?? 0) + q);
    }));
    const lineItems = [...map.entries()].map(([d, q]) => lineItemFor(d, q));
    if (!lineItems.length) return false;
    patchDraft({ lineItems, slots, segQty: undefined, rowQty: undefined, stockChecked: false });
    return true;
  };

  const segGrand = segQty.reduce((s, seg) => s + seg.reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0), 0);
  const segNext = (): boolean => {
    if (!segPg) return false;
    const map = new Map<string, number>();
    segPg.segments.forEach((seg, si) => seg.rows.forEach((row, ri) => row.forEach((product, ci) => {
      const q = segQty[si]?.[ri]?.[ci] ?? 0;
      if (product && q > 0) map.set(product.name, (map.get(product.name) ?? 0) + q);
    })));
    const lineItems = [...map.entries()].map(([d, q]) => lineItemFor(d, q));
    if (!lineItems.length) return false;
    patchDraft({ lineItems, segQty, slots: undefined, rowQty: undefined, stockChecked: false });
    return true;
  };

  const rowGrand = rowQty.reduce((s, side) => s + side.reduce((a, row) => a + row.reduce((x, y) => x + y, 0), 0), 0);
  const rowNext = (): boolean => {
    if (!customPg) return false;
    const map = new Map<string, number>();
    customPg.sides.forEach((side, si) => side.rows.forEach((r, ri) => r.cells.forEach((c, ci) => {
      const q = rowQty[si]?.[ri]?.[ci] ?? 0;
      if (c.product.trim() && q > 0) map.set(c.product, (map.get(c.product) ?? 0) + q);
    })));
    const lineItems = [...map.entries()].map(([d, q]) => lineItemFor(d, q));
    if (!lineItems.length) return false;
    patchDraft({ lineItems, rowQty, slots: undefined, segQty: undefined, stockChecked: false });
    return true;
  };

  // ── Selector ──
  if (!draft.planogram) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-2xl border border-border/40 bg-card/70 glass p-6">
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Select a planogram</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">Pick the planogram to build this order from, then set quantities on its real layout.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectorList.map((p) => (
              <button key={p.id} onClick={() => patchDraft({ planogram: { id: p.id, name: p.name } })}
                className="group text-left rounded-2xl border border-border/40 bg-card/60 hover:border-primary/40 hover:bg-accent/30 transition-colors overflow-hidden">
                <div className="h-20 bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center"><Box className="h-9 w-9 text-white/85" /></div>
                <div className="p-4"><p className="text-sm font-semibold">{p.name}</p><p className="text-[11px] text-muted-foreground mt-0.5">{p.count} products</p></div>
              </button>
            ))}
          </div>
        </motion.div>
        <StepNav backHref="/orders" nextDisabled nextLabel="Next" />
      </div>
    );
  }

  const subtitle = slotPg
    ? `${slotPg.sides.length} sides · ${slotGrand} units`
    : segPg
      ? `${segPg.segments.length} segments · ${segGrand} units`
      : customPg
        ? `${customPg.sides.length} ${customPg.sides.length === 1 ? "side" : "sides"} · ${rowGrand} units`
        : "";

  const headerBar = (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/70 glass px-5 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/15"><LayoutGrid className="h-4 w-4 text-primary" /></div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{draft.planogram.name}</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/40" onClick={changePlanogram}>
        <RefreshCcw className="h-3.5 w-3.5" /> Change
      </Button>
    </div>
  );

  if (segPg) {
    return (
      <div className="space-y-6">
        {headerBar}
        <SegmentPlanogramGrid segments={segPg.segments} columns={segPg.columns}
          value={segQty.length ? segQty : buildInitialSegQty(segPg)} onChange={setSegQty}
          activeSeg={segActive} onActiveSegChange={setSegActive} />
        <StepNav backHref="/orders" nextHref="/orders/new/inventory" onNext={segNext} nextDisabled={segGrand === 0} />
      </div>
    );
  }

  if (slotPg) {
    return (
      <div className="space-y-6">
        {headerBar}
        <SlotPlanogramGrid sides={slotPg.sides} slotCount={slotPg.slotCount}
          value={slots.length ? slots : buildInitialSlots(slotPg)} onChange={setSlots}
          activeSide={slotActive} onActiveSideChange={setSlotActive} />
        <StepNav backHref="/orders" nextHref="/orders/new/inventory" onNext={slotNext} nextDisabled={slotGrand === 0} />
      </div>
    );
  }

  if (customPg) {
    return (
      <div className="space-y-6">
        {headerBar}
        <RowPlanogramGrid
          sides={customPg.sides.map((s) => ({ label: s.label, columns: s.columns, rows: s.rows.map((r) => ({ description: r.description, cells: r.cells.map((c) => ({ product: c.product, image: c.image })) })) }))}
          value={rowQty.length ? rowQty : customPg.sides.map((s) => s.rows.map((r) => r.cells.map((c) => c.qty)))}
          onChange={setRowQty}
          activeSide={rowActive}
          onActiveSideChange={setRowActive}
        />
        <StepNav backHref="/orders" nextHref="/orders/new/inventory" onNext={rowNext} nextDisabled={rowGrand === 0} />
      </div>
    );
  }

  // Planogram id not yet resolved (e.g. custom list still loading)
  return (
    <div className="space-y-6">
      {headerBar}
      <p className="text-sm text-muted-foreground py-12 text-center">Loading planogram…</p>
      <StepNav backHref="/orders" nextDisabled />
    </div>
  );
}
