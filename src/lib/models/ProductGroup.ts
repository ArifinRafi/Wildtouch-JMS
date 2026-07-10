import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** A product group/family option (managed list behind the Products group field). */
const ProductGroupSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export type ProductGroupDoc = InferSchemaType<typeof ProductGroupSchema>;

export const ProductGroup: Model<ProductGroupDoc> =
  (mongoose.models.ProductGroup as Model<ProductGroupDoc>) ??
  mongoose.model<ProductGroupDoc>("ProductGroup", ProductGroupSchema);

export function serializeProductGroup(doc: { _id: unknown; name?: string }) {
  return { id: String(doc._id), name: doc.name ?? "" };
}
