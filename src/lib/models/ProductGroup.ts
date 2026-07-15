import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** A product group/family option (managed list behind the Products group field). */
const ProductGroupSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true },
);

/** Seeded once (when the collection is empty) so a fresh database has the standard groups. */
export const DEFAULT_PRODUCT_GROUPS = [
  "Carded Jewellery",
  "Earrings",
  "Pin Badges",
  "Boxed Necklaces",
  "Boxed Bracelets - Diamante",
  "Boxed Bracelets - Tibetan",
  "Boxed Earrings",
  "Boxed Pin Badges",
  "Large Keyrings",
  "Boxed Large Keyrings",
  "Magnets",
  "Rings",
  "Christmas Decorations",
  "LOGO Magnets",
  "LOGO Keyrings",
  "LOGO Pin Badges",
];

export type ProductGroupDoc = InferSchemaType<typeof ProductGroupSchema>;

export const ProductGroup: Model<ProductGroupDoc> =
  (mongoose.models.ProductGroup as Model<ProductGroupDoc>) ??
  mongoose.model<ProductGroupDoc>("ProductGroup", ProductGroupSchema);

export function serializeProductGroup(doc: { _id: unknown; name?: string }) {
  return { id: String(doc._id), name: doc.name ?? "" };
}
