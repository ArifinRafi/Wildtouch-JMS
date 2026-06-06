// Shared data + types for the slot-grid planograms (the 4-sided stands).
// Used by the planogram view pages AND the order wizard so they render identically.

export interface SlotRow {
  description: string;
  defaultQty: number;
}

export interface SlotSide {
  side: number;
  label: string;
  productType: string;
  color: string;
  bgTint: string;
  slotLabels?: string[];
  rows: SlotRow[];
  charms?: string;
  boysCharms?: string;
}

export interface SlotPlanogram {
  id: string;
  name: string;
  slotCount: number;
  sides: SlotSide[];
}

export const FLOOR_STAND: SlotPlanogram = {
  id: "4-sided-floor-stand",
  name: "4 Sided Floor Stand",
  slotCount: 4,
  sides: [
    {
      side: 1, label: "Side 1", productType: "Keyrings",
      color: "from-violet-500 to-purple-600", bgTint: "bg-violet-500/5",
      rows: [
        { description: "Heart & Charms", defaultQty: 6 },
        { description: "Heart & Charms", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
      ],
      charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
    },
    {
      side: 2, label: "Side 2", productType: "Necklaces",
      color: "from-blue-500 to-cyan-500", bgTint: "bg-blue-500/5",
      rows: [
        { description: "Heart & Charms", defaultQty: 6 },
        { description: "Heart & Charms", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
      ],
      charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
    },
    {
      side: 3, label: "Side 3", productType: "Bracelets",
      color: "from-emerald-500 to-teal-500", bgTint: "bg-emerald-500/5",
      rows: [
        { description: "Heart & Charms", defaultQty: 6 },
        { description: "Heart & Charms", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
        { description: "Glitter", defaultQty: 6 },
      ],
      charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
    },
    {
      side: 4, label: "Side 4", productType: "Bracelets",
      color: "from-amber-500 to-orange-500", bgTint: "bg-amber-500/5",
      rows: [
        { description: "Beaded Bracelet & Charms", defaultQty: 6 },
        { description: "Beaded Bracelet & Charms", defaultQty: 6 },
        { description: "Charm Bracelet", defaultQty: 6 },
        { description: "Charm Bracelet", defaultQty: 6 },
        { description: "Glass Bracelets & Charms", defaultQty: 6 },
        { description: "Glass Bracelets & Charms", defaultQty: 6 },
        { description: "Boys Bracelets & Charms", defaultQty: 6 },
        { description: "Boys Bracelets & Charms", defaultQty: 6 },
      ],
      charms: "Mermaid, Shark, Turtle, Seahorse, Octopus, Clown Fish",
      boysCharms: "Shark, Turtle, Anchor, Skull, 3D Penguin, Clownfish",
    },
  ],
};

const NB_SLOTS = ["Necklace", "Keyring", "Bracelet", "Bag Charm"];
const GEMSTONES = ["Rose", "Amethyst", "Howlite Turquoise", "Opal", "Blue Goldstone", "Watermelon", "Amazonite", "Coral"];

export const NECKBRAC: SlotPlanogram = {
  id: "4-sided-stand-neck-brac-key-bag",
  name: "4 Sided Stand Neck Brac Key Bag",
  slotCount: 4,
  sides: [
    {
      side: 1, label: "Side 1", productType: "Heart & Charms",
      color: "from-rose-500 to-pink-600", bgTint: "bg-rose-500/5",
      slotLabels: NB_SLOTS,
      rows: GEMSTONES.map((g) => ({ description: `Heart & Charms — ${g}`, defaultQty: 6 })),
    },
    {
      side: 2, label: "Side 2", productType: "Glitter",
      color: "from-fuchsia-500 to-purple-600", bgTint: "bg-fuchsia-500/5",
      slotLabels: NB_SLOTS,
      rows: Array.from({ length: 8 }, () => ({ description: "Glitter", defaultQty: 6 })),
    },
    {
      side: 3, label: "Side 3", productType: "Glitter",
      color: "from-indigo-500 to-blue-600", bgTint: "bg-indigo-500/5",
      slotLabels: NB_SLOTS,
      rows: Array.from({ length: 8 }, () => ({ description: "Glitter", defaultQty: 6 })),
    },
    {
      side: 4, label: "Side 4", productType: "Bracelets",
      color: "from-emerald-500 to-teal-600", bgTint: "bg-emerald-500/5",
      slotLabels: ["Bracelet", "Bracelet", "Bracelet", "Bracelet"],
      rows: [
        { description: "Beaded Bracelet & Charms", defaultQty: 6 },
        { description: "Beaded Bracelet & Charms", defaultQty: 6 },
        { description: "Charm Bracelet & Charms", defaultQty: 6 },
        { description: "Charm Bracelet & Charms", defaultQty: 6 },
        { description: "Glass Bracelets & Charms", defaultQty: 6 },
        { description: "Glass Bracelets & Charms", defaultQty: 6 },
        { description: "Boys Bracelets & Charms", defaultQty: 6 },
        { description: "Boys Bracelets & Charms", defaultQty: 6 },
      ],
    },
  ],
};

export const SLOT_PLANOGRAMS: SlotPlanogram[] = [FLOOR_STAND, NECKBRAC];

export function getSlotPlanogram(id: string): SlotPlanogram | null {
  return SLOT_PLANOGRAMS.find((p) => p.id === id) ?? null;
}

export function isSlotPlanogram(id: string): boolean {
  return SLOT_PLANOGRAMS.some((p) => p.id === id);
}

/** Initial slot values: [sideIdx][rowIdx][slotIdx] = defaultQty. */
export function buildInitialSlots(pg: SlotPlanogram): number[][][] {
  return pg.sides.map((s) => s.rows.map((r) => Array(pg.slotCount).fill(r.defaultQty)));
}
