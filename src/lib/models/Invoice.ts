import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const InvoiceLineSchema = new Schema(
  {
    code: { type: String, default: "" },
    description: { type: String, default: "" },
    qty: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const InvoiceClientSchema = new Schema(
  {
    clientId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    invoiceAddress: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
  },
  { _id: false },
);

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    orderNumber: { type: String, default: "" },
    client: { type: InvoiceClientSchema, default: () => ({}) },
    lineItems: { type: [InvoiceLineSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    /** VAT rate as a percentage, e.g. 20. */
    vatRate: { type: Number, default: 0, min: 0 },
    /** Computed VAT amount = subtotal * vatRate / 100. */
    vat: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "GBP" },
    status: { type: String, enum: ["issued", "paid", "void"], default: "issued" },
  },
  { timestamps: true },
);

export type InvoiceDoc = InferSchemaType<typeof InvoiceSchema>;

export const Invoice: Model<InvoiceDoc> =
  (mongoose.models.Invoice as Model<InvoiceDoc>) ??
  mongoose.model<InvoiceDoc>("Invoice", InvoiceSchema);

/** Generate the next sequential invoice number, e.g. INV-0001. */
export async function nextInvoiceNumber(): Promise<string> {
  const count = await Invoice.countDocuments();
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export function serializeInvoice(doc: {
  _id: unknown;
  invoiceNumber: string;
  orderId?: unknown;
  orderNumber?: string;
  client?: Record<string, unknown> | null;
  lineItems?: unknown[] | null;
  subtotal?: number;
  shipping?: number;
  vatRate?: number;
  vat?: number;
  total?: number;
  currency?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    invoiceNumber: doc.invoiceNumber,
    orderId: doc.orderId ? String(doc.orderId) : null,
    orderNumber: doc.orderNumber ?? "",
    client: doc.client ?? {},
    lineItems: doc.lineItems ?? [],
    subtotal: doc.subtotal ?? 0,
    shipping: doc.shipping ?? 0,
    vatRate: doc.vatRate ?? 0,
    vat: doc.vat ?? 0,
    total: doc.total ?? 0,
    currency: doc.currency ?? "GBP",
    status: doc.status ?? "issued",
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
