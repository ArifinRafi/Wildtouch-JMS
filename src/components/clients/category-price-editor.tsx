"use client";

import { useMemo, useState } from "react";
import { PoundSterling, Search, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Per-client category price list. Groups are created on the Products page
 * (or via "Add Group"); here you search an existing group, type this client's
 * price, and press Add. Added rows show the group + price and can be removed.
 */
export function CategoryPriceEditor({
  categories,
  value,
  onChange,
  inputCls,
}: {
  /** All existing product groups (from /api/product-groups). */
  categories: string[];
  /** Current prices: group name → price string (form state). */
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  inputCls?: string;
}) {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState("");
  const [open, setOpen] = useState(false);

  const added = Object.keys(value);

  // Groups matching the search that haven't already been added.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => !added.some((a) => a.toLowerCase() === c.toLowerCase()))
      .filter((c) => !q || c.toLowerCase().includes(q))
      .slice(0, 8);
  }, [categories, added, query]);

  // The group to add: an existing group whose name exactly matches the search box.
  const resolvedGroup = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return "";
    const exact = categories.find((c) => c.toLowerCase() === q);
    if (!exact) return "";
    if (added.some((a) => a.toLowerCase() === q)) return "";
    return exact;
  }, [query, categories, added]);

  const canAdd = !!resolvedGroup && price.trim() !== "" && Number(price) >= 0;

  const add = () => {
    if (!canAdd) return;
    onChange({ ...value, [resolvedGroup]: price.trim() });
    setQuery("");
    setPrice("");
    setOpen(false);
  };

  const removeCategory = (cat: string) => {
    const next = { ...value };
    delete next[cat];
    onChange(next);
  };
  const setRowPrice = (cat: string, p: string) => onChange({ ...value, [cat]: p });

  return (
    <div className="space-y-3">
      {/* Add row: search group · price · Add */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
        {/* Group search */}
        <div className="relative flex-1 min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="Search a product group…"
            className={cn("pl-9", inputCls)}
          />
          {open && (
            <div className="absolute z-30 mt-1 w-full rounded-xl border border-border/40 bg-popover shadow-xl max-h-52 overflow-y-auto">
              {matches.length === 0 ? (
                <p className="px-3 py-2.5 text-xs text-muted-foreground">
                  {categories.length === 0
                    ? "No groups exist yet — create them on the Products page (Add Group)."
                    : query.trim()
                      ? "No matching groups (or already added)."
                      : "All groups already added."}
                </p>
              ) : (
                matches.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setQuery(c); setOpen(false); }}
                    className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent/40 border-b border-border/10 last:border-b-0"
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {/* Price */}
        <div className="relative w-full sm:w-40 shrink-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            <PoundSterling className="h-3.5 w-3.5" />
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            className={cn("pl-8", inputCls)}
          />
        </div>
        {/* Add */}
        <Button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-semibold disabled:opacity-50 shrink-0"
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Added groups + their prices */}
      {added.length === 0 ? (
        <p className="text-xs text-muted-foreground rounded-xl border border-dashed border-border/40 px-4 py-3">
          No category prices yet — search a product group above, set a price, and press Add.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {added.map((cat) => (
            <div key={cat} className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/10 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium" title={cat}>{cat}</span>
              <div className="relative w-28 shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  <PoundSterling className="h-3.5 w-3.5" />
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={value[cat] ?? ""}
                  onChange={(e) => setRowPrice(cat, e.target.value)}
                  className={cn("pl-7 h-8", inputCls)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeCategory(cat)}
                title={`Remove ${cat}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
