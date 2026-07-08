import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A new component design being tracked (Design Tracker "Live New Designs").
 * Format/checklist columns hold a dropdown value; completing a design makes it
 * an orderable component in the River section.
 */
const DesignSchema = new Schema(
  {
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    // Category: a name + a type (Glitter / Pin Badge / Keyring / Magnet / Brooch …)
    categoryName: { type: String, default: "" },
    categoryType: { type: String, default: "" },
    notes: { type: String, default: "" },
    // Free-text tracking columns
    addedToCodeSheet: { type: String, default: "" },
    addedToNewDesignBrochure: { type: String, default: "" },
    addedToThemedBrochure: { type: String, default: "" },
    completed: { type: Boolean, default: false },
    /** Set once the completed design has been ordered or dismissed in River. */
    riverAcknowledged: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type DesignDoc = InferSchemaType<typeof DesignSchema>;

export const Design: Model<DesignDoc> =
  (mongoose.models.Design as Model<DesignDoc>) ??
  mongoose.model<DesignDoc>("Design", DesignSchema);

export const DESIGN_STRING_FIELDS = [
  "name", "image", "categoryName", "categoryType",
  "notes", "addedToCodeSheet", "addedToNewDesignBrochure", "addedToThemedBrochure",
] as const;

export function serializeDesign(doc: Record<string, unknown> & { _id: unknown }) {
  const g = (k: string) => (doc[k] == null ? "" : String(doc[k]));
  return {
    id: String(doc._id),
    name: g("name"),
    image: g("image"),
    categoryName: g("categoryName"),
    categoryType: g("categoryType"),
    notes: g("notes"),
    addedToCodeSheet: g("addedToCodeSheet"),
    addedToNewDesignBrochure: g("addedToNewDesignBrochure"),
    addedToThemedBrochure: g("addedToThemedBrochure"),
    completed: Boolean(doc.completed),
    riverAcknowledged: Boolean(doc.riverAcknowledged),
    createdAt: (doc.createdAt as Date) ?? null,
    updatedAt: (doc.updatedAt as Date) ?? null,
  };
}
