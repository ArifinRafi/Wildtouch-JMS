"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { InventoryDetail } from "@/components/inventory/inventory-detail";
import { useInventory } from "@/lib/store/inventory-store";

/** Store-driven category view: filters the shared inventory by slug so that
 * add/edit/delete made anywhere are reflected here. */
export function CategoryInventory({ slug, name }: { slug: string; name: string }) {
  const { items, loading } = useInventory();

  const categoryItems = useMemo(
    () => items.filter((it) => it.slug === slug),
    [items, slug],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading {name}…</span>
      </div>
    );
  }

  return <InventoryDetail name={name} items={categoryItems} />;
}
