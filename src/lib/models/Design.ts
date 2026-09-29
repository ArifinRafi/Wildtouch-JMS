import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import {
  DESIGN_DEFAULT_STAGE,
  DESIGN_FINAL_STAGE,
  normalizeDesignStage,
} from "@/lib/design-stage";

export { DESIGN_DEFAULT_STAGE, DESIGN_FINAL_STAGE, DESIGN_RIVER_STAGE, DESIGN_STAGES } from "@/lib/design-stage";

/** One recorded stage transition (kept as an audit trail; reverts carry a note). */
const StageHistorySchema = new Schema(
  {
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    note: { type: String, default: "" },
    /** True when this was a move back to an earlier stage. */
    revert: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

/**
 * A new component design being tracked (Design Tracker "Live New Designs").
 * Format/checklist columns hold a dropdown value. Reaching Template makes the
 * design orderable in River; reaching Sample completes the tracker item.
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
    /** Date from which this in-progress design appears in Notifications (YYYY-MM-DD). */
    alertDate: { type: String, default: "" },
    /** Pipeline stage; Sample keeps `completed` in sync (see the API). */
    stage: { type: String, default: DESIGN_DEFAULT_STAGE },
    /** Audit trail of stage changes (from → to, date, and note for reverts). */
    stageHistory: { type: [StageHistorySchema], default: [] },
    /** True when the design is at Sample — kept in sync with `stage`. */
    completed: { type: Boolean, default: false },
    /** Set once the Template-stage design has been ordered or dismissed in River. */
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
  const stage = normalizeDesignStage(g("stage"), Boolean(doc.completed));
  const completed = stage === DESIGN_FINAL_STAGE;
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
    alertDate: g("alertDate"),
    stage,
    stageHistory: Array.isArray(doc.stageHistory)
      ? (doc.stageHistory as Record<string, unknown>[]).map((h) => ({
          from: h?.from ? normalizeDesignStage(h.from) : "",
          to: h?.to ? normalizeDesignStage(h.to) : "",
          note: String(h?.note ?? ""),
          revert: Boolean(h?.revert),
          at: h?.at ? new Date(h.at as string).toISOString() : null,
        }))
      : [],
    completed,
    riverAcknowledged: Boolean(doc.riverAcknowledged),
    createdAt: (doc.createdAt as Date) ?? null,
    updatedAt: (doc.updatedAt as Date) ?? null,
  };
}
