import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** A single grid cell: one product, its photo, and how many of it. */
const PlanogramCellSchema = new Schema(
  {
    product: { type: String, default: "" },
    image: { type: String, default: "" },
    qty: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const PlanogramRowSchema = new Schema(
  {
    /** Free-text row label/note. */
    description: { type: String, default: "" },
    /** Per-column cells (each its own product + qty + image). */
    cells: { type: [PlanogramCellSchema], default: [] },
    /** Legacy row-level image (pre per-cell products); read-only fallback. */
    image: { type: String, default: "" },
    /** Legacy single-quantity (pre-columns); read-only fallback. */
    defaultQty: { type: Number },
  },
  { _id: false },
);

const PlanogramSideSchema = new Schema(
  {
    label: { type: String, default: "" },
    columns: { type: Number, default: 1, min: 1 },
    rows: { type: [PlanogramRowSchema], default: [] },
  },
  { _id: false },
);

const PlanogramSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, default: "", index: true },
    sides: { type: [PlanogramSideSchema], default: [] },
    totalUnits: { type: Number, default: 0, min: 0 },
    source: { type: String, default: "custom" },
  },
  { timestamps: true },
);

export type PlanogramDoc = InferSchemaType<typeof PlanogramSchema>;

export const Planogram: Model<PlanogramDoc> =
  (mongoose.models.Planogram as Model<PlanogramDoc>) ??
  mongoose.model<PlanogramDoc>("Planogram", PlanogramSchema);

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export interface CleanCell { product: string; image: string; qty: number }
interface RawCell { product?: string | null; image?: string | null; qty?: number | null }
interface RawRow {
  description?: string | null;
  cells?: (number | RawCell | null)[] | null;
  image?: string | null;
  defaultQty?: number | null;
}
interface RawSide { label?: string | null; columns?: number | null; rows?: RawRow[] | null }

/** Normalize one cell (object | legacy number) into { product, image, qty }. */
function normalizeCell(c: number | RawCell | null | undefined, fallback: { product: string; image: string }): CleanCell {
  if (c != null && typeof c === "object") {
    return {
      product: String(c.product ?? "").trim(),
      image: String(c.image ?? ""),
      qty: Math.max(0, Number(c.qty) || 0),
    };
  }
  // Legacy: cell was a bare quantity; product/image came from the row.
  return { product: fallback.product, image: fallback.image, qty: Math.max(0, Number(c) || 0) };
}

/** Normalize a raw row into { description, cells } with per-cell products. */
function normalizeRow(r: RawRow): { description: string; cells: CleanCell[] } {
  const fallback = { product: String(r.description ?? "").trim(), image: String(r.image ?? "") };
  let raw: (number | RawCell | null)[] = Array.isArray(r.cells) ? r.cells : [];
  if (!raw.length && r.defaultQty != null) raw = [r.defaultQty];
  return { description: String(r.description ?? ""), cells: raw.map((c) => normalizeCell(c, fallback)) };
}

const emptyCell = (): CleanCell => ({ product: "", image: "", qty: 0 });

/** Normalize raw side input (from the API) into clean, column-padded sides. */
export function cleanSides(raw: unknown): { label: string; columns: number; rows: { description: string; cells: CleanCell[] }[] }[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawSide[]).map((s, i) => {
    const columns = Math.max(1, Number(s.columns) || 1);
    const rows = (Array.isArray(s.rows) ? s.rows : [])
      .map((r) => {
        const { description, cells: c } = normalizeRow(r);
        const cells = [...c];
        while (cells.length < columns) cells.push(emptyCell());
        return { description: description.trim(), cells: cells.slice(0, columns) };
      })
      .filter((r) => r.description || r.cells.some((c) => c.product || c.qty > 0));
    return { label: String(s.label ?? `Side ${i + 1}`).trim() || `Side ${i + 1}`, columns, rows };
  });
}

/** Sum every cell quantity across all sides. */
export function computeTotalUnits(sides: RawSide[]): number {
  let total = 0;
  for (const side of sides) {
    for (const row of side.rows ?? []) {
      for (const cell of normalizeRow(row).cells) total += cell.qty;
    }
  }
  return total;
}

export function serializePlanogram(doc: {
  _id: unknown;
  name: string;
  slug?: string;
  sides?: RawSide[] | null;
  totalUnits?: number;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug ?? "",
    source: doc.source ?? "custom",
    totalUnits: doc.totalUnits ?? 0,
    sides: (doc.sides ?? []).map((s) => {
      const rows = (s.rows ?? []).map(normalizeRow);
      const columns = s.columns ?? Math.max(1, ...rows.map((r) => r.cells.length), 1);
      for (const r of rows) {
        while (r.cells.length < columns) r.cells.push(emptyCell());
        if (r.cells.length > columns) r.cells = r.cells.slice(0, columns);
      }
      return { label: s.label ?? "", columns, rows };
    }),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
