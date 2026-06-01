// Inventory categories — one per "Product Inventory" Excel workbook.
// `ready` flips to true once a category's data + detail page are wired up.

export interface InventoryCategory {
  name: string;
  slug: string;
  href: string;
  /** Short description shown on the card */
  blurb: string;
  /** Tailwind gradient used for the card header strip */
  color: string;
  ready: boolean;
  /** Item count (only meaningful when ready) */
  count?: number;
}

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  {
    name: "Bag Charm",
    slug: "bag-charm",
    href: "/inventory/bag-charm",
    blurb: "Bag charms with jump ring & pendant components",
    color: "from-violet-500 to-purple-600",
    ready: true,
    count: 523,
  },
  {
    name: "Boxed Necklaces",
    slug: "boxed-necklaces",
    href: "/inventory/boxed-necklaces",
    blurb: "Boxed chain necklaces, pendants, boxes & cards",
    color: "from-rose-500 to-pink-600",
    ready: true,
    count: 523,
  },
  {
    name: "Cord Necklaces",
    slug: "cord-necklaces",
    href: "/inventory/cord-necklaces",
    blurb: "Cord necklaces by colour with pendants",
    color: "from-blue-500 to-cyan-500",
    ready: true,
    count: 876,
  },
  {
    name: "Cord Bracelets",
    slug: "cord-bracelets",
    href: "/inventory/cord-bracelets",
    blurb: "Cord bracelets by colour with pendants",
    color: "from-emerald-500 to-teal-600",
    ready: true,
    count: 876,
  },
  {
    name: "Earrings",
    slug: "earrings",
    href: "/inventory/earrings",
    blurb: "Carded earrings with fittings & pendants",
    color: "from-amber-500 to-orange-600",
    ready: true,
    count: 522,
  },
  {
    name: "Rings",
    slug: "rings",
    href: "/inventory/rings",
    blurb: "Ring finished product codes",
    color: "from-fuchsia-500 to-purple-500",
    ready: true,
    count: 522,
  },
  {
    name: "Large Keyrings",
    slug: "large-keyrings",
    href: "/inventory/large-keyrings",
    blurb: "Large keyring finished product codes",
    color: "from-indigo-500 to-blue-500",
    ready: true,
    count: 522,
  },
  {
    name: "Small Keyrings",
    slug: "small-keyrings",
    href: "/inventory/small-keyrings",
    blurb: "Small keyrings with pendant components",
    color: "from-sky-500 to-blue-500",
    ready: true,
    count: 522,
  },
  {
    name: "Magnets",
    slug: "magnets",
    href: "/inventory/magnets",
    blurb: "Magnet finished product codes",
    color: "from-lime-500 to-emerald-500",
    ready: true,
    count: 522,
  },
  {
    name: "Pin Badges",
    slug: "pin-badges",
    href: "/inventory/pin-badges",
    blurb: "Pin badge finished product codes",
    color: "from-red-500 to-rose-500",
    ready: true,
    count: 522,
  },
  {
    name: "Christmas Decorations",
    slug: "christmas-decorations",
    href: "/inventory/christmas-decorations",
    blurb: "Seasonal Christmas decoration codes",
    color: "from-green-500 to-emerald-600",
    ready: true,
    count: 522,
  },
];
