import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ORDER_SOURCE_OPTIONS, normalizeOrderSource } from "@/lib/order-source";

const LineItemSchema = new Schema(
  {
    code: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    qtyOrdered: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const ClientSnapshotSchema = new Schema(
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
    vatRate: { type: Number, default: 0 },
  },
  { _id: false },
);

const AgentSnapshotSchema = new Schema(
  {
    agentId: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    city: { type: String, default: "" },
  },
  { _id: false },
);

const BackOrderSchema = new Schema(
  {
    backOrderNumber: { type: String, required: true, unique: true },
    deliveryDate: { type: String, required: true },
    status: { type: String, enum: ["scheduled", "delivering", "delivered"], default: "scheduled" },
    planogram: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    client: { type: ClientSnapshotSchema, default: () => ({}) },
    agent: { type: AgentSnapshotSchema, default: () => ({}) },
    orderSource: {
      type: String,
      enum: ["", ...ORDER_SOURCE_OPTIONS.map((option) => option.value)],
      default: "",
    },
    lineItems: { type: [LineItemSchema], default: [] },
    poNumber: { type: String, default: "" },
    referenceNumber: { type: String, default: "" },
    notes: { type: String, default: "" },
    deliveredOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    deliveredOrderNumber: { type: String, default: "" },
    deliveredInvoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type BackOrderDoc = InferSchemaType<typeof BackOrderSchema>;

export const BackOrder: Model<BackOrderDoc> =
  (mongoose.models.BackOrder as Model<BackOrderDoc>) ??
  mongoose.model<BackOrderDoc>("BackOrder", BackOrderSchema);

export async function nextBackOrderNumber(): Promise<string> {
  const docs = await BackOrder.find({}, { backOrderNumber: 1 }).lean();
  let max = 0;
  for (const doc of docs) {
    const value = Number(String(doc.backOrderNumber).replace(/^BO-/, ""));
    if (Number.isFinite(value)) max = Math.max(max, value);
  }
  return `BO-${String(max + 1).padStart(4, "0")}`;
}

export function serializeBackOrder(doc: {
  _id: unknown;
  backOrderNumber: string;
  deliveryDate: string;
  status?: string;
  planogram?: Record<string, unknown> | null;
  client?: Record<string, unknown> | null;
  agent?: Record<string, unknown> | null;
  orderSource?: string;
  lineItems?: unknown[] | null;
  poNumber?: string;
  referenceNumber?: string;
  notes?: string;
  deliveredOrderId?: unknown;
  deliveredOrderNumber?: string;
  deliveredInvoiceId?: unknown;
  deliveredAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    backOrderNumber: doc.backOrderNumber,
    deliveryDate: doc.deliveryDate,
    status: doc.status ?? "scheduled",
    planogram: doc.planogram ?? {},
    client: doc.client ?? {},
    agent: doc.agent ?? {},
    orderSource: normalizeOrderSource(doc.orderSource),
    lineItems: doc.lineItems ?? [],
    poNumber: doc.poNumber ?? "",
    referenceNumber: doc.referenceNumber ?? "",
    notes: doc.notes ?? "",
    deliveredOrderId: doc.deliveredOrderId ? String(doc.deliveredOrderId) : null,
    deliveredOrderNumber: doc.deliveredOrderNumber ?? "",
    deliveredInvoiceId: doc.deliveredInvoiceId ? String(doc.deliveredInvoiceId) : null,
    deliveredAt: doc.deliveredAt ?? null,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
