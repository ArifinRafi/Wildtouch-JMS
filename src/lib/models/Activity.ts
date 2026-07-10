import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * One audit-trail entry: who did what, to which record, when.
 * Written automatically by the API routes via `logActivity()` and shown
 * (admin-only) on the History page grouped by date.
 */
const ActivitySchema = new Schema(
  {
    actorName: { type: String, default: "unknown" },
    actorRole: { type: String, default: "unknown" }, // admin | manager
    action: { type: String, required: true }, // added | updated | deleted | received | completed | confirmed
    entityType: { type: String, required: true }, // component | product | client | order | ...
    entityName: { type: String, default: "" },
    entityId: { type: String, default: "" },
    quantity: { type: Number, default: null },
    details: { type: String, default: "" },
  },
  { timestamps: true },
);

ActivitySchema.index({ createdAt: -1 });

export type ActivityDoc = InferSchemaType<typeof ActivitySchema>;

export const Activity: Model<ActivityDoc> =
  (mongoose.models.Activity as Model<ActivityDoc>) ??
  mongoose.model<ActivityDoc>("Activity", ActivitySchema);

export function serializeActivity(doc: {
  _id: unknown;
  actorName?: string;
  actorRole?: string;
  action?: string;
  entityType?: string;
  entityName?: string;
  entityId?: string;
  quantity?: number | null;
  details?: string;
  createdAt?: Date;
}) {
  return {
    id: String(doc._id),
    actorName: doc.actorName ?? "unknown",
    actorRole: doc.actorRole ?? "unknown",
    action: doc.action ?? "",
    entityType: doc.entityType ?? "",
    entityName: doc.entityName ?? "",
    entityId: doc.entityId ?? "",
    quantity: doc.quantity ?? null,
    details: doc.details ?? "",
    at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  };
}
