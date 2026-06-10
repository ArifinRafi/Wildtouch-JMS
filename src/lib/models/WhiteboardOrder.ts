import mongoose, { Schema, type Model } from "mongoose";

/** Digital Whiteboard order — string _id keeps the "WB-0001" codes. */
const WhiteboardSchema = new Schema(
  {
    _id: { type: String },
    date: { type: String, default: "" },
    priority: { type: String, default: "2 - Moderate" },
    customerName: { type: String, default: "" },
    orderType: { type: String, default: "Order" },
    proforma: { type: String, default: "" },
    product: { type: String, default: "" },
    qty: { type: Number, default: null },
    location: { type: String, default: "" },
    status: { type: String, default: "OIP - Order In Process" },
    dueDate: { type: String, default: "" },
    dateOut: { type: String, default: null },
    deliveryDate: { type: String, default: null },
    completed: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true, strict: false },
);

export type WhiteboardDoc = Record<string, unknown> & { _id: string };

export const WhiteboardOrderModel: Model<WhiteboardDoc> =
  (mongoose.models.WhiteboardOrder as Model<WhiteboardDoc>) ??
  mongoose.model<WhiteboardDoc>("WhiteboardOrder", WhiteboardSchema);

/** Next sequential whiteboard id, e.g. WB-0011. */
export async function nextWhiteboardId(): Promise<string> {
  const docs = await WhiteboardOrderModel.find({}, { _id: 1 }).lean();
  let max = 0;
  for (const d of docs) {
    const n = parseInt(String(d._id).split("-")[1] ?? "0", 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `WB-${String(max + 1).padStart(4, "0")}`;
}

const WB_STRING_FIELDS = [
  "date", "priority", "customerName", "orderType", "proforma", "product",
  "location", "status", "dueDate", "completed", "notes",
] as const;

/** Normalize whiteboard order input (create/update). */
export function cleanWhiteboardBody(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of WB_STRING_FIELDS) if (body[k] !== undefined) out[k] = String(body[k] ?? "");
  if (body.qty !== undefined) out.qty = body.qty === null || body.qty === "" ? null : Number(body.qty);
  if (body.dateOut !== undefined) out.dateOut = body.dateOut || null;
  if (body.deliveryDate !== undefined) out.deliveryDate = body.deliveryDate || null;
  return out;
}

export function serializeWhiteboard(doc: Record<string, unknown>) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc as Record<string, unknown> & { _id: unknown };
  void __v; void createdAt; void updatedAt;
  return { id: String(_id), ...rest };
}
