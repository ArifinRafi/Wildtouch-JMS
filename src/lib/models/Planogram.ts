import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PlanogramRowSchema = new Schema(
  {
    description: { type: String, default: "" },
    /** Per-column quantities for this row. */
    cells: { type: [Number], default: [] },
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

interface RawRow { description?: string | null; cells?: (number | null)[] | null; defaultQty?: number | null }
interface RawSide { label?: string | null; columns?: number | null; rows?: RawRow[] | null }

/** Normalize raw side input (from the API) into clean, padded sides. */
export function cleanSides(raw: unknown): { label: string; columns: number; rows: { description: string; cells: number[] }[] }[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawSide[]).map((s, i) => {
    const columns = Math.max(1, Number(s.columns) || 1);
    const rows = (Array.isArray(s.rows) ? s.rows : [])
      .map((r) => {
        let cells = Array.isArray(r.cells) ? r.cells.map((n) => Math.max(0, Number(n) || 0)) : [];
        if (!cells.length && r.defaultQty != null) cells = [Math.max(0, Number(r.defaultQty) || 0)];
        while (cells.length < columns) cells.push(0);
        if (cells.length > columns) cells = cells.slice(0, columns);
        return { description: String(r.description ?? "").trim(), cells };
      })
      .filter((r) => r.description || r.cells.some((c) => c > 0));
    return { label: String(s.label ?? `Side ${i + 1}`).trim() || `Side ${i + 1}`, columns, rows };
  });
}

/** Normalize a row to its per-column cells array (with legacy fallback). */
function rowCells(r: RawRow): number[] {
  if (Array.isArray(r.cells) && r.cells.length) return r.cells.map((n) => Math.max(0, Number(n) || 0));
  if (r.defaultQty != null) return [Math.max(0, Number(r.defaultQty) || 0)];
  return [0];
}

/** Sum every cell across all sides. */
export function computeTotalUnits(sides: RawSide[]): number {
  let total = 0;
  for (const side of sides) {
    for (const row of side.rows ?? []) total += rowCells(row).reduce((a, b) => a + b, 0);
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
      const rows = (s.rows ?? []).map((r) => ({ description: r.description ?? "", cells: rowCells(r) }));
      const columns = s.columns ?? Math.max(1, ...rows.map((r) => r.cells.length));
      // pad/truncate cells to columns
      for (const r of rows) {
        while (r.cells.length < columns) r.cells.push(0);
        if (r.cells.length > columns) r.cells = r.cells.slice(0, columns);
      }
      return { label: s.label ?? "", columns, rows };
    }),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
