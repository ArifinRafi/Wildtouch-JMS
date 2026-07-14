import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Design pipeline stages. The final stage means the design is finished and flows to River. */
export const DESIGN_STAGES = [
  "New Design Request",
  "Research",
  "Feedback",
  "New Design Template",
] as const;
/** Reaching this stage marks the design finished → available in River. */
export const DESIGN_FINAL_STAGE = "New Design Template";

/**
 * A new component design being tracked (Design Tracker "Live New Designs").
 * Format/checklist columns hold a dropdown value; moving a design to the final
 * stage ("New Design Template") makes it an orderable component in River.
 */
const DesignSchema = new Schema(
  {
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    /** Client this design is made for (from the client list or a free-typed external name). */
    clientName: { type: String, default: "" },
    // Category: a name + a type (Glitter / Pin Badge / Keyring / Magnet / Brooch …)
    categoryName: { type: String, default: "" },
    categoryType: { type: String, default: "" },
    notes: { type: String, default: "" },
    // Free-text tracking columns
    addedToCodeSheet: { type: String, default: "" },
    addedToNewDesignBrochure: { type: String, default: "" },
    addedToThemedBrochure: { type: String, default: "" },
    /** Pipeline stage; the final stage keeps `completed` in sync (see the API). */
    stage: { type: String, default: "New Design Request" },
    /** True when the design is at the final stage — kept in sync with `stage`. Drives River. */
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
  "name", "image", "clientName", "categoryName", "categoryType",
  "notes", "addedToCodeSheet", "addedToNewDesignBrochure", "addedToThemedBrochure",
] as const;

export function serializeDesign(doc: Record<string, unknown> & { _id: unknown }) {
  const g = (k: string) => (doc[k] == null ? "" : String(doc[k]));
  const completed = Boolean(doc.completed);
  // Old rows have no `stage` — derive it from `completed` so they display sensibly.
  const stage = g("stage") || (completed ? DESIGN_FINAL_STAGE : "New Design Request");
  return {
    id: String(doc._id),
    name: g("name"),
    image: g("image"),
    clientName: g("clientName"),
    categoryName: g("categoryName"),
    categoryType: g("categoryType"),
    notes: g("notes"),
    addedToCodeSheet: g("addedToCodeSheet"),
    addedToNewDesignBrochure: g("addedToNewDesignBrochure"),
    addedToThemedBrochure: g("addedToThemedBrochure"),
    stage,
    completed,
    riverAcknowledged: Boolean(doc.riverAcknowledged),
    createdAt: (doc.createdAt as Date) ?? null,
    updatedAt: (doc.updatedAt as Date) ?? null,
  };
}
