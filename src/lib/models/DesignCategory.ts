import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** A design category/type option (managed list behind the Design Tracker dropdown). */
const DesignCategorySchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export type DesignCategoryDoc = InferSchemaType<typeof DesignCategorySchema>;

export const DesignCategory: Model<DesignCategoryDoc> =
  (mongoose.models.DesignCategory as Model<DesignCategoryDoc>) ??
  mongoose.model<DesignCategoryDoc>("DesignCategory", DesignCategorySchema);

export const DEFAULT_DESIGN_CATEGORIES = ["Glitter", "Pin Badge", "Keyring", "Magnet", "Brooch"];

export function serializeDesignCategory(doc: { _id: unknown; name?: string }) {
  return { id: String(doc._id), name: doc.name ?? "" };
}
