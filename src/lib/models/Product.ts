import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A planogram product — the sellable design (e.g. "Elephant Grey" keyring).
 * Components (the BOM) are attached later and link to stockable inventory items;
 * ordering a product deducts its components from inventory.
 */
const ProductComponentSchema = new Schema(
  {
    code: { type: String, default: "" },
    label: { type: String, default: "" },
    qtyPerUnit: { type: Number, default: 1, min: 0 },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    /** Optional product group/family name (managed via the ProductGroup list). */
    group: { type: String, default: "" },
    planogramId: { type: String, default: "", index: true },
    planogramName: { type: String, default: "" },
    segment: { type: String, default: "" },
    image: { type: String, default: null },
    defaultQty: { type: Number, default: 1, min: 0 },
    code: { type: String, default: "" },
    /** BOM — to be populated later by matching components to this product. */
    components: { type: [ProductComponentSchema], default: [] },
  },
  { timestamps: true },
);

export type ProductDoc = InferSchemaType<typeof ProductSchema>;

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) ??
  mongoose.model<ProductDoc>("Product", ProductSchema);

export function serializeProduct(doc: {
  _id: unknown;
  name: string;
  group?: string;
  planogramId: string;
  planogramName?: string;
  segment?: string;
  image?: string | null;
  defaultQty?: number;
  code?: string;
  components?: unknown[] | null;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    group: doc.group ?? "",
    planogramId: doc.planogramId,
    planogramName: doc.planogramName ?? "",
    segment: doc.segment ?? "",
    image: doc.image ?? null,
    defaultQty: doc.defaultQty ?? 1,
    code: doc.code ?? "",
    components: doc.components ?? [],
  };
}
