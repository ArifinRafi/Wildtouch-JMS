const PRODUCT_LINE_LABELS: Record<string, string> = {
  "bag charm": "Bag Charm",
  "bag charms": "Bag Charm",
  "boxed necklace": "Boxed Necklace",
  "boxed necklaces": "Boxed Necklace",
  "cord necklace": "Cord Necklace",
  "cord necklaces": "Cord Necklace",
  "cord bracelet": "Cord Bracelet",
  "cord bracelets": "Cord Bracelet",
  bracelet: "Bracelet",
  bracelets: "Bracelet",
  necklace: "Necklace",
  necklaces: "Necklace",
  earring: "Earring",
  earrings: "Earring",
  ring: "Ring",
  rings: "Ring",
  "large keyring": "Large Keyring",
  "large keyrings": "Large Keyring",
  keyring: "Keyring",
  keyrings: "Keyring",
  "boxed large keyring": "Boxed Large Keyring",
  "boxed large keyrings": "Boxed Large Keyring",
  "small keyring": "Small Keyring",
  "small keyrings": "Small Keyring",
  magnet: "Magnet",
  magnets: "Magnet",
  "pin badge": "Pin Badge",
  "pin badges": "Pin Badge",
  "christmas decoration": "Christmas Decoration",
  "christmas decorations": "Christmas Decoration",
  "logo magnet": "LOGO Magnet",
  "logo magnets": "LOGO Magnet",
  "logo keyring": "LOGO Keyring",
  "logo keyrings": "LOGO Keyring",
  "logo pin badge": "LOGO Pin Badge",
  "logo pin badges": "LOGO Pin Badge",
};

export function formatProductLine(productLine?: string | null): string {
  const value = String(productLine ?? "").trim();
  return PRODUCT_LINE_LABELS[value.toLowerCase()] ?? value;
}

/** Resolve a line for legacy products that pre-date the explicit group field. */
export function inferProductLine(
  productLine?: string | null,
  planogramId?: string | null,
  segment?: string | null,
): string {
  const explicit = String(productLine ?? "").trim();
  if (explicit) return explicit;

  const source = String(planogramId ?? "").trim().toLowerCase();
  if (source === "all-designs-large-keyrings") return "Large Keyrings";
  if (source === "all-designs-magnets") return "Magnets";

  return String(segment ?? "").trim();
}

/**
 * Return only the design/name portion of a legacy title. Older records sometimes
 * stored values such as "Cord Necklace Gold Bird" in the name field itself.
 */
export function productNameOnly(productLine?: string | null, name?: string | null): string {
  const rawName = String(name ?? "").trim();
  const rawLine = String(productLine ?? "").trim();
  const displayLine = formatProductLine(rawLine);

  for (const prefix of [...new Set([rawLine, displayLine])].filter(Boolean)) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = rawName.match(new RegExp(`^${escaped}(?:\\s*:\\s*|\\s+-\\s+|\\s+)`, "i"));
    if (match) return rawName.slice(match[0].length).trim();
  }

  return rawName;
}

/** Display title used throughout Products and Inventory: "Product Line: Name". */
export function formatProductTitle(productLine?: string | null, name?: string | null): string {
  const line = formatProductLine(productLine);
  const cleanName = productNameOnly(productLine, name);
  if (line && cleanName) return `${line}: ${cleanName}`;
  return line || cleanName;
}
