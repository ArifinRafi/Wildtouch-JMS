// Shared inventory item shape used by every category dataset.

export interface InventoryComponent {
  /** Human-readable component label (e.g. "Pendant", "6mm Jump Ring", a colour name) */
  label: string;
  /** Component product code */
  code: string;
}

export interface InventoryItem {
  /** Product description / design */
  description: string;
  /** Finished whole-product code */
  code: string;
  /** Component breakdown (chain, jump ring, pendant, etc.) */
  components: InventoryComponent[];
  /** Seeded placeholder stock level until live stock is wired up */
  qtyAvailable: number;
}
