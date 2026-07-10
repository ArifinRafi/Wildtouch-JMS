import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const ORDER_STATUSES = [
  "received",
  "in_production",
  "quality_check",
  "packing",
  "ready_for_dispatch",
  "dispatched",
  "delivered",
  "archived",
] as const;

/** One product line on the order. */
const LineItemSchema = new Schema(
  {
    code: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    qtyOrdered: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

/**
 * Resolved component demand for the whole order (the BOM × quantities),
 * captured as a snapshot so deduction + audit are stable over time.
 */
const ComponentRequirementSchema = new Schema(
  {
    code: { type: String, default: "" },
    label: { type: String, default: "" },
    qtyRequired: { type: Number, default: 0, min: 0 },
    deducted: { type: Boolean, default: false },
  },
  { _id: false },
);

/** Snapshot of client details at order time (so historical orders stay accurate). */
const ClientSnapshotSchema = new Schema(
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

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: ORDER_STATUSES, default: "received" },
    planogram: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    client: { type: ClientSnapshotSchema, default: () => ({}) },
    lineItems: { type: [LineItemSchema], default: [] },
    componentRequirements: { type: [ComponentRequirementSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    vatRate: { type: Number, default: 0, min: 0 },
    vat: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    /** Sum of partial-invoice payments issued so far (installments against the total). */
    amountInvoiced: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" },
    inventoryDeducted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ??
  mongoose.model<OrderDoc>("Order", OrderSchema);

/** Generate the next sequential order number, e.g. ORD-0001. */
export async function nextOrderNumber(): Promise<string> {
  const count = await Order.countDocuments();
  return `ORD-${String(count + 1).padStart(4, "0")}`;
}

/** Shape an order doc into the API/UI shape. */
export function serializeOrder(doc: {
  _id: unknown;
  orderNumber: string;
  status?: string;
  planogram?: { id?: string; name?: string } | null;
  client?: Record<string, unknown> | null;
  lineItems?: unknown[] | null;
  componentRequirements?: unknown[] | null;
  subtotal?: number;
  shipping?: number;
  vatRate?: number;
  vat?: number;
  total?: number;
  amountInvoiced?: number;
  notes?: string;
  inventoryDeducted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    status: doc.status ?? "received",
    planogram: { id: doc.planogram?.id ?? "", name: doc.planogram?.name ?? "" },
    client: doc.client ?? {},
    lineItems: doc.lineItems ?? [],
    componentRequirements: doc.componentRequirements ?? [],
    subtotal: doc.subtotal ?? 0,
    shipping: doc.shipping ?? 0,
    vatRate: doc.vatRate ?? 0,
    vat: doc.vat ?? 0,
    total: doc.total ?? 0,
    amountInvoiced: doc.amountInvoiced ?? 0,
    notes: doc.notes ?? "",
    inventoryDeducted: doc.inventoryDeducted ?? false,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
