import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { randomUUID } from "node:crypto";
import { normalizeOrderSource, ORDER_SOURCE_OPTIONS } from "@/lib/order-source";

const LineSchema = new Schema({
  code: { type: String, default: "" },
  description: { type: String, required: true },
  category: { type: String, default: "" },
  qtyOrdered: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const ProformaInvoiceSchema = new Schema({
  proformaNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "approving"], default: "pending" },
  approvalStartedAt: { type: Date, default: null },
  approvalToken: { type: String, default: "" },
  planogram: { id: { type: String, default: "" }, name: { type: String, default: "" } },
  client: { type: Schema.Types.Mixed, required: true },
  agent: { type: Schema.Types.Mixed, default: () => ({}) },
  orderSource: { type: String, enum: ["", ...ORDER_SOURCE_OPTIONS.map((option) => option.value)], default: "" },
  lineItems: { type: [LineSchema], default: [] },
  grid: { type: Schema.Types.Mixed, default: () => ({}) },
  categoryPrices: { type: Map, of: Number, default: () => ({}) },
  subtotal: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  vatRate: { type: Number, default: 0, min: 0 },
  vat: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 },
  currency: { type: String, enum: ["GBP", "EUR"], default: "GBP" },
  poNumber: { type: String, default: "" },
  referenceNumber: { type: String, default: "" },
  notes: { type: String, default: "" },
}, { timestamps: true });

export type ProformaInvoiceDoc = InferSchemaType<typeof ProformaInvoiceSchema>;
export const ProformaInvoice: Model<ProformaInvoiceDoc> =
  (mongoose.models.ProformaInvoice as Model<ProformaInvoiceDoc>) ??
  mongoose.model<ProformaInvoiceDoc>("ProformaInvoice", ProformaInvoiceSchema);

const ProformaSequenceSchema = new Schema({ _id: String, value: { type: Number, default: 0 } });
const ProformaSequence = mongoose.models.ProformaSequence ?? mongoose.model("ProformaSequence", ProformaSequenceSchema);

export async function nextProformaNumber(): Promise<string> {
  const sequence = await ProformaSequence.findOneAndUpdate(
    { _id: "proforma" }, { $inc: { value: 1 } }, { upsert: true, returnDocument: "after" },
  ).lean<{ value: number }>();
  return `PRO-${String(sequence?.value ?? 1).padStart(4, "0")}`;
}

/** Claim a quote for approval. A stale lease can be reclaimed after a crash. */
export async function claimProformaApproval(id: string) {
  const token = randomUUID();
  const staleBefore = new Date(Date.now() - 2 * 60 * 1000);
  const quote = await ProformaInvoice.findOneAndUpdate(
    { _id: id, $or: [
      { status: "pending" },
      { status: "approving", approvalStartedAt: { $lt: staleBefore } },
      { status: "approving", approvalStartedAt: null },
    ] },
    { $set: { status: "approving", approvalStartedAt: new Date(), approvalToken: token } },
    { returnDocument: "after" },
  ).lean();
  return quote ? { quote, token } : null;
}

export async function releaseProformaApproval(id: string, token: string) {
  await ProformaInvoice.updateOne(
    { _id: id, status: "approving", approvalToken: token },
    { $set: { status: "pending", approvalStartedAt: null, approvalToken: "" } },
  );
}

export function serializeProformaInvoice(doc: Record<string, unknown>) {
  const categoryPrices = doc.categoryPrices instanceof Map
    ? Object.fromEntries(doc.categoryPrices)
    : doc.categoryPrices ?? {};
  return {
    id: String(doc._id),
    proformaNumber: String(doc.proformaNumber ?? ""),
    status: String(doc.status ?? "pending"),
    planogram: doc.planogram ?? {},
    client: doc.client ?? {},
    agent: doc.agent ?? {},
    orderSource: normalizeOrderSource(doc.orderSource),
    lineItems: doc.lineItems ?? [],
    grid: doc.grid ?? {},
    categoryPrices,
    subtotal: Number(doc.subtotal ?? 0),
    shipping: Number(doc.shipping ?? 0),
    vatRate: Number(doc.vatRate ?? 0),
    vat: Number(doc.vat ?? 0),
    total: Number(doc.total ?? 0),
    currency: String(doc.currency ?? "GBP"),
    poNumber: String(doc.poNumber ?? ""),
    referenceNumber: String(doc.referenceNumber ?? ""),
    notes: String(doc.notes ?? ""),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
