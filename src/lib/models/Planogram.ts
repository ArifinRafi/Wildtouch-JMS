import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PlanogramRowSchema = new Schema(
  {
    description: { type: String, default: "" },
    defaultQty: { type: Number, default: 1, min: 0 },
  },
  { _id: false },
);

const PlanogramSideSchema = new Schema(
  {
    label: { type: String, default: "" },
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

/** Sum every row's defaultQty across all sides. */
export function computeTotalUnits(
  sides: { rows?: { defaultQty?: number }[] }[],
): number {
  let total = 0;
  for (const side of sides) {
    for (const row of side.rows ?? []) total += Number(row.defaultQty) || 0;
  }
  return total;
}

export function serializePlanogram(doc: {
  _id: unknown;
  name: string;
  slug?: string;
  sides?: { label?: string; rows?: { description?: string; defaultQty?: number }[] }[] | null;
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
    sides: (doc.sides ?? []).map((s) => ({
      label: s.label ?? "",
      rows: (s.rows ?? []).map((r) => ({
        description: r.description ?? "",
        defaultQty: r.defaultQty ?? 0,
      })),
    })),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
