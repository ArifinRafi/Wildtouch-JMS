import { randomUUID } from "node:crypto";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CreditApplicationSchema = new Schema(
  {
    invoiceId: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    orderNumber: { type: String, required: true },
    amountCents: { type: Number, required: true, min: 1 },
    appliedAt: { type: Date, required: true },
  },
  { _id: false },
);

const CreditNoteSchema = new Schema(
  {
    creditNoteNumber: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    currency: { type: String, enum: ["GBP", "EUR"], required: true },
    amountCents: { type: Number, required: true, min: 1 },
    remainingCents: { type: Number, required: true, min: 0 },
    reason: { type: String, enum: ["return", "not_delivered", "other"], required: true },
    note: { type: String, default: "", maxlength: 2000 },
    date: { type: String, required: true },
    status: { type: String, enum: ["active", "void"], default: "active" },
    applications: { type: [CreditApplicationSchema], default: [] },
    createdBy: { type: String, default: "" },
  },
  { timestamps: true },
);

CreditNoteSchema.index({ clientId: 1, currency: 1, status: 1, remainingCents: 1, createdAt: 1 });

export type CreditNoteDoc = InferSchemaType<typeof CreditNoteSchema>;

export const CreditNote: Model<CreditNoteDoc> =
  (mongoose.models.CreditNote as Model<CreditNoteDoc>) ??
  mongoose.model<CreditNoteDoc>("CreditNote", CreditNoteSchema);

export function nextCreditNoteNumber(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replaceAll("-", "");
  return `CN-${day}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function serializeCreditNote(doc: CreditNoteDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date }) {
  return {
    id: String(doc._id),
    creditNoteNumber: doc.creditNoteNumber,
    clientId: doc.clientId,
    clientName: doc.clientName,
    currency: doc.currency,
    amount: doc.amountCents / 100,
    remaining: doc.remainingCents / 100,
    reason: doc.reason,
    note: doc.note,
    date: doc.date,
    status: doc.status,
    applications: doc.applications.map((application) => ({
      invoiceId: application.invoiceId,
      invoiceNumber: application.invoiceNumber,
      orderNumber: application.orderNumber,
      amount: application.amountCents / 100,
      appliedAt: application.appliedAt,
    })),
    createdBy: doc.createdBy,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
