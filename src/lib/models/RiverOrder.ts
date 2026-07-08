import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * An order placed with the vendor "River", who makes new components.
 * Fields mirror the River Tracker "Outstanding Orders" sheet. Receiving
 * (partial allowed) tops up the linked inventory component's stock.
 */
/** A dated progress note. */
const RiverNoteSchema = new Schema(
  { date: { type: String, default: "" }, note: { type: String, default: "" } },
  { _id: false },
);

const RiverOrderSchema = new Schema(
  {
    orderNumber: { type: String, default: "" },
    date: { type: String, default: "" },
    product: { type: String, default: "" },
    description: { type: String, default: "" },
    quantity: { type: Number, default: 0, min: 0 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    priority: { type: String, default: "" },
    /** Shipment method to River (free text, e.g. Air / Sea). */
    shipmentMethod: { type: String, default: "" },
    progressNotes: { type: String, default: "" },
    /** Dated progress log (date + note entries). */
    notesLog: { type: [RiverNoteSchema], default: [] },
    dateRequested: { type: String, default: "" },
    datePaid: { type: String, default: "" },
    valueRmb: { type: Number, default: 0, min: 0 },
    valueGbp: { type: Number, default: 0, min: 0 },
    /** Linked main-inventory component that receiving tops up (optional). */
    componentId: { type: String, default: "" },
    componentCode: { type: String, default: "" },
    componentLabel: { type: String, default: "" },
  },
  { timestamps: true },
);

export type RiverOrderDoc = InferSchemaType<typeof RiverOrderSchema>;

export const RiverOrder: Model<RiverOrderDoc> =
  (mongoose.models.RiverOrder as Model<RiverOrderDoc>) ??
  mongoose.model<RiverOrderDoc>("RiverOrder", RiverOrderSchema);

export function riverStatus(quantity: number, received: number): "open" | "partial" | "complete" {
  if (quantity > 0 && received >= quantity) return "complete";
  if (received > 0) return "partial";
  return "open";
}

export function serializeRiverOrder(doc: {
  _id: unknown;
  orderNumber?: string;
  date?: string;
  product?: string;
  description?: string;
  quantity?: number;
  quantityReceived?: number;
  priority?: string;
  shipmentMethod?: string;
  progressNotes?: string;
  notesLog?: { date?: string; note?: string }[] | null;
  dateRequested?: string;
  datePaid?: string;
  valueRmb?: number;
  valueGbp?: number;
  componentId?: string;
  componentCode?: string;
  componentLabel?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const quantity = doc.quantity ?? 0;
  const quantityReceived = doc.quantityReceived ?? 0;
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber ?? "",
    date: doc.date ?? "",
    product: doc.product ?? "",
    description: doc.description ?? "",
    quantity,
    quantityReceived,
    outstanding: Math.max(0, quantity - quantityReceived),
    status: riverStatus(quantity, quantityReceived),
    priority: doc.priority ?? "",
    shipmentMethod: doc.shipmentMethod ?? "",
    progressNotes: doc.progressNotes ?? "",
    notesLog: (doc.notesLog ?? []).map((n) => ({ date: n?.date ?? "", note: n?.note ?? "" })),
    dateRequested: doc.dateRequested ?? "",
    datePaid: doc.datePaid ?? "",
    valueRmb: doc.valueRmb ?? 0,
    valueGbp: doc.valueGbp ?? 0,
    componentId: doc.componentId ?? "",
    componentCode: doc.componentCode ?? "",
    componentLabel: doc.componentLabel ?? "",
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
