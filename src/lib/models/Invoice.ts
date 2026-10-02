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
    contactName: { type: String, default: "" },
    companyName: { type: String, default: "" },
    email: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    invoiceAddress: { type: String, default: "" },
    deliveryAddress: { type: String, default: "" },
    brandCardImage: { type: String, default: "" },
    barcodeImage: { type: String, default: "" },
  },
  { _id: false },
);

const InvoiceCommentSchema = new Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, required: true },
    createdBy: { type: String, default: "" },
  },
  { _id: false },
);

const InvoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    sourceProformaId: { type: String, unique: true, sparse: true },
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
    /** Credit from the client's account applied after VAT, never changing taxable line prices. */
    creditApplied: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },
    creditNoteNumbers: { type: [String], default: [] },
    /** New main invoices are finalized after credit allocation; legacy invoices remain final. */
    creditFinalized: { type: Boolean, default: true },
    creditStartedAt: { type: Date, default: null },
    creditToken: { type: String, default: "" },
    creditReversalPending: { type: Boolean, default: false },
    /** Partial invoices reference credit already applied to the main order invoice. */
    priorCreditApplied: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "GBP" },
    status: { type: String, enum: ["issued", "remittance", "paid", "partial_payment_outstanding", "void"], default: "issued" },
    comments: { type: [InvoiceCommentSchema], default: [] },
    /** Partial (installment) invoice against the order's total. */
    isPartial: { type: Boolean, default: false },
    /** The amount this partial invoice charges now. */
    paymentAmount: { type: Number, default: 0, min: 0 },
    /** Sum of partial payments invoiced before this one. */
    previouslyPaid: { type: Number, default: 0, min: 0 },
    /** Order balance still to invoice after this payment. */
    balanceDue: { type: Number, default: 0, min: 0 },
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
  creditApplied?: number;
  amountDue?: number;
  creditNoteNumbers?: string[];
  creditFinalized?: boolean;
  creditReversalPending?: boolean;
  priorCreditApplied?: number;
  currency?: string;
  status?: string;
  comments?: Array<{ text?: string; createdAt?: Date | string; createdBy?: string }> | null;
  isPartial?: boolean;
  paymentAmount?: number;
  previouslyPaid?: number;
  balanceDue?: number;
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
    creditApplied: doc.creditApplied ?? 0,
    amountDue: doc.amountDue ?? (doc.isPartial ? doc.paymentAmount ?? 0 : doc.total ?? 0),
    creditNoteNumbers: doc.creditNoteNumbers ?? [],
    creditFinalized: doc.creditFinalized ?? true,
    creditReversalPending: doc.creditReversalPending ?? false,
    priorCreditApplied: doc.priorCreditApplied ?? 0,
    currency: doc.currency ?? "GBP",
    status: doc.status ?? "issued",
    comments: (doc.comments ?? []).map((comment) => ({
      text: comment.text ?? "",
      createdAt: comment.createdAt ?? null,
      createdBy: comment.createdBy ?? "",
    })),
    isPartial: doc.isPartial ?? false,
    paymentAmount: doc.paymentAmount ?? 0,
    previouslyPaid: doc.previouslyPaid ?? 0,
    balanceDue: doc.balanceDue ?? 0,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
