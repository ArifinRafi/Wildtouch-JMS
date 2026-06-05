import type { CatalogItem } from "@/lib/data/inventory/catalog";

/** Lowercase, strip punctuation, collapse whitespace — for fuzzy comparison. */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Match a planogram product name to an inventory item by description
 * (the chosen "match by description" strategy). Tries, in order:
 *   1. exact normalized equality
 *   2. inventory description *contains* the product name
 * Returns the matched CatalogItem or null.
 */
export function matchInventoryByDescription(
  name: string,
  items: CatalogItem[],
): CatalogItem | null {
  const n = normalizeName(name);
  if (!n) return null;

  const exact = items.find((it) => normalizeName(it.description) === n);
  if (exact) return exact;

  const contains = items.find((it) => {
    const d = normalizeName(it.description);
    return d.includes(n) && n.length >= 3;
  });
  return contains ?? null;
}
