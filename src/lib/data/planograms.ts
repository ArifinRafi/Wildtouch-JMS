// Normalizes the heterogeneous planogram datasets into a single "orderable"
// shape: a flat, de-duplicated product list per planogram. Used to seed the
// Products collection and by the order wizard's planogram step.

import { KEYRING_SEGMENTS, type KeyringSegment } from "./large-keyrings";
import { MAGNET_SEGMENTS, type MagnetSegment } from "./magnets";

export interface OrderablePlanogramProduct {
  description: string;
  /** Which planogram segment / side it came from (for grouping/labels). */
  segment: string;
  image: string | null;
  defaultQty: number;
}

export interface OrderablePlanogram {
  id: string;
  name: string;
  productCount: number;
  products: OrderablePlanogramProduct[];
}

/** Flatten segment-based planograms (keyrings / magnets), de-duplicating by name. */
function fromSegments(
  segments: (KeyringSegment | MagnetSegment)[],
  defaultQty: number,
): OrderablePlanogramProduct[] {
  const seen = new Set<string>();
  const out: OrderablePlanogramProduct[] = [];
  for (const seg of segments) {
    for (const row of seg.rows) {
      for (const cell of row) {
        if (!cell || !cell.name) continue;
        const key = cell.name.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          description: cell.name.trim(),
          segment: seg.title,
          image: cell.image ?? null,
          defaultQty,
        });
      }
    }
  }
  return out;
}

/** Raw rows of the two 4-sided stands (descriptions are generic; de-duped + summed). */
const FOUR_SIDED_FLOOR_ROWS: { description: string; segment: string; defaultQty: number }[] = [
  ...Array(2).fill(0).map(() => ({ description: "Heart & Charms", segment: "Keyrings", defaultQty: 6 })),
  ...Array(6).fill(0).map(() => ({ description: "Glitter", segment: "Keyrings", defaultQty: 6 })),
  ...Array(2).fill(0).map(() => ({ description: "Heart & Charms", segment: "Necklaces", defaultQty: 6 })),
  ...Array(6).fill(0).map(() => ({ description: "Glitter", segment: "Necklaces", defaultQty: 6 })),
  ...Array(2).fill(0).map(() => ({ description: "Heart & Charms", segment: "Bracelets", defaultQty: 6 })),
  ...Array(6).fill(0).map(() => ({ description: "Glitter", segment: "Bracelets", defaultQty: 6 })),
  { description: "Beaded Bracelet & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Beaded Bracelet & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Charm Bracelet", segment: "Bracelets", defaultQty: 6 },
  { description: "Charm Bracelet", segment: "Bracelets", defaultQty: 6 },
  { description: "Glass Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Glass Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Boys Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Boys Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
];

const GEMSTONES = ["Rose", "Amethyst", "Howlite Turquoise", "Opal", "Blue Goldstone", "Watermelon", "Amazonite", "Coral"];
const FOUR_SIDED_NECKBRAC_ROWS: { description: string; segment: string; defaultQty: number }[] = [
  ...GEMSTONES.map((g) => ({ description: `Heart & Charms — ${g}`, segment: "Heart & Charms", defaultQty: 6 })),
  ...Array(16).fill(0).map(() => ({ description: "Glitter", segment: "Glitter", defaultQty: 6 })),
  { description: "Beaded Bracelet & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Beaded Bracelet & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Charm Bracelet & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Charm Bracelet & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Glass Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Glass Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Boys Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
  { description: "Boys Bracelets & Charms", segment: "Bracelets", defaultQty: 6 },
];

/** De-duplicate generic rows by description, summing their quantities. */
function dedupeRows(
  rows: { description: string; segment: string; defaultQty: number }[],
): OrderablePlanogramProduct[] {
  const map = new Map<string, OrderablePlanogramProduct>();
  for (const r of rows) {
    const key = r.description.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.defaultQty += r.defaultQty;
    } else {
      map.set(key, { description: r.description, segment: r.segment, image: null, defaultQty: r.defaultQty });
    }
  }
  return [...map.values()];
}

export function getOrderablePlanograms(): OrderablePlanogram[] {
  const keyrings = fromSegments(KEYRING_SEGMENTS, 1);
  const magnets = fromSegments(MAGNET_SEGMENTS, 1);
  const floor = dedupeRows(FOUR_SIDED_FLOOR_ROWS);
  const neckBrac = dedupeRows(FOUR_SIDED_NECKBRAC_ROWS);
  return [
    { id: "all-designs-large-keyrings", name: "All Designs Large Keyrings", products: keyrings, productCount: keyrings.length },
    { id: "all-designs-magnets", name: "All Designs Magnets", products: magnets, productCount: magnets.length },
    { id: "4-sided-floor-stand", name: "4 Sided Floor Stand", products: floor, productCount: floor.length },
    { id: "4-sided-stand-neck-brac-key-bag", name: "4 Sided Stand Neck Brac Key Bag", products: neckBrac, productCount: neckBrac.length },
  ];
}
