// Combined catalog of every inventory dataset.
// Used by the "All Components" master view.

import type { InventoryItem } from "./types";
import { BAG_CHARM_ITEMS } from "./bag-charm";
import { BOXED_NECKLACES_ITEMS } from "./boxed-necklaces";
import { CORD_NECKLACES_ITEMS } from "./cord-necklaces";
import { CORD_BRACELETS_ITEMS } from "./cord-bracelets";
import { EARRINGS_ITEMS } from "./earrings";
import { RINGS_ITEMS } from "./rings";
import { LARGE_KEYRINGS_ITEMS } from "./large-keyrings";
import { SMALL_KEYRINGS_ITEMS } from "./small-keyrings";
import { MAGNETS_ITEMS } from "./magnets";
import { PIN_BADGES_ITEMS } from "./pin-badges";
import { CHRISTMAS_DECORATIONS_ITEMS } from "./christmas-decorations";

export interface InventoryDataset {
  slug: string;
  name: string;
  items: InventoryItem[];
}

export const INVENTORY_DATASETS: InventoryDataset[] = [
  { slug: "bag-charm", name: "Bag Charm", items: BAG_CHARM_ITEMS },
  { slug: "boxed-necklaces", name: "Boxed Necklaces", items: BOXED_NECKLACES_ITEMS },
  { slug: "cord-necklaces", name: "Cord Necklaces", items: CORD_NECKLACES_ITEMS },
  { slug: "cord-bracelets", name: "Cord Bracelets", items: CORD_BRACELETS_ITEMS },
  { slug: "earrings", name: "Earrings", items: EARRINGS_ITEMS },
  { slug: "rings", name: "Rings", items: RINGS_ITEMS },
  { slug: "large-keyrings", name: "Large Keyrings", items: LARGE_KEYRINGS_ITEMS },
  { slug: "small-keyrings", name: "Small Keyrings", items: SMALL_KEYRINGS_ITEMS },
  { slug: "magnets", name: "Magnets", items: MAGNETS_ITEMS },
  { slug: "pin-badges", name: "Pin Badges", items: PIN_BADGES_ITEMS },
  { slug: "christmas-decorations", name: "Christmas Decorations", items: CHRISTMAS_DECORATIONS_ITEMS },
];

/** A single inventory item tagged with the category it belongs to + a stable id. */
export interface CatalogItem extends InventoryItem {
  /** Stable unique id: "<slug>-<index>" */
  id: string;
  category?: string;
  slug?: string;
}

/** Flatten every dataset into one tagged, id'd list. */
export function getAllCatalogItems(): CatalogItem[] {
  const out: CatalogItem[] = [];
  for (const ds of INVENTORY_DATASETS) {
    ds.items.forEach((it, i) => {
      out.push({ ...it, id: `${ds.slug}-${i}`, category: ds.name, slug: ds.slug });
    });
  }
  return out;
}

/** Distinct category names, for the filter dropdown. */
export const CATEGORY_NAMES = INVENTORY_DATASETS.map((d) => d.name);
