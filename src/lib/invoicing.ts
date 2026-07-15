/**
 * Category-based invoice pricing.
 *
 * Products belong to a category (the managed product "group"). Each client
 * stores their own price per category (`client.categoryPrices`). Invoices are
 * generated at CATEGORY level: order line items (products) are priced from
 * their category's client price, then grouped so the invoice shows one line
 * per category. Orders keep product-level lines (packing lists, planogram
 * panels), invoices show category lines.
 */

export interface OrderLineInput {
  code?: string;
  description?: string;
  category?: string;
  qtyOrdered?: number;
}

export interface PricedOrderLine {
  code: string;
  description: string;
  category: string;
  qtyOrdered: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CategoryInvoiceLine {
  code: string;
  description: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Build lookup maps (lowercased code/name → category) from the product catalogue. */
export function buildCategoryLookup(
  products: { name?: string | null; code?: string | null; group?: string | null }[],
): { byCode: Map<string, string>; byName: Map<string, string> } {
  const byCode = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const p of products) {
    const group = String(p.group ?? "").trim();
    if (!group) continue;
    if (p.code) byCode.set(String(p.code).trim().toLowerCase(), group);
    if (p.name) byName.set(String(p.name).trim().toLowerCase(), group);
  }
  return { byCode, byName };
}

/**
 * Enrich raw order lines with their product category and the client's price
 * for that category. Products without a category get no price (0).
 */
export function priceLinesByCategory(
  lines: OrderLineInput[],
  lookup: { byCode: Map<string, string>; byName: Map<string, string> },
  categoryPrices: Record<string, number>,
): PricedOrderLine[] {
  // Case-insensitive price lookup so category naming differences don't drop prices.
  const priceByCategory = new Map<string, number>();
  for (const [k, v] of Object.entries(categoryPrices ?? {})) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) priceByCategory.set(k.trim().toLowerCase(), n);
  }

  return lines.map((l) => {
    const code = String(l.code ?? "").trim();
    const description = String(l.description ?? "").trim();
    const qtyOrdered = Math.max(0, Number(l.qtyOrdered) || 0);
    const category =
      (code && lookup.byCode.get(code.toLowerCase())) ||
      lookup.byName.get(description.toLowerCase()) ||
      String(l.category ?? "").trim();
    const unitPrice = category ? priceByCategory.get(category.toLowerCase()) ?? 0 : 0;
    return { code, description, category, qtyOrdered, unitPrice, lineTotal: round2(qtyOrdered * unitPrice) };
  });
}

/**
 * Collapse priced product lines into one invoice line per category.
 * Lines with no category keep the product name so no quantity is hidden.
 */
export function groupIntoCategoryLines(lines: PricedOrderLine[]): CategoryInvoiceLine[] {
  const byLabel = new Map<string, CategoryInvoiceLine>();
  for (const l of lines) {
    const label = l.category || l.description || "Uncategorised";
    const cur = byLabel.get(label) ?? { code: "", description: label, qty: 0, unitPrice: l.unitPrice, lineTotal: 0 };
    cur.qty += l.qtyOrdered;
    cur.lineTotal = round2(cur.lineTotal + l.lineTotal);
    byLabel.set(label, cur);
  }
  return [...byLabel.values()];
}
