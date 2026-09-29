import mongoose, { Schema, type Model } from "mongoose";
import { normalizeWhiteboardStatus } from "@/lib/whiteboard-status";

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
    status: { type: String, default: "Orders to be made in the office" },
    dueDate: { type: String, default: "" },
    dateOut: { type: String, default: null },
    deliveryDate: { type: String, default: null },
    completed: { type: String, default: "" },
    notes: { type: String, default: "" },
    // Present only on entries generated from the main order workflow. Keeping
    // the source id lets confirmation retries reuse the same board task.
    sourceOrderId: { type: String, unique: true, sparse: true },
    orderNumber: { type: String, default: "" },
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
  for (const k of WB_STRING_FIELDS) {
    if (body[k] !== undefined) out[k] = k === "status" ? normalizeWhiteboardStatus(body[k]) : String(body[k] ?? "");
  }
  if (body.qty !== undefined) out.qty = body.qty === null || body.qty === "" ? null : Number(body.qty);
  if (body.dateOut !== undefined) out.dateOut = body.dateOut || null;
  if (body.deliveryDate !== undefined) out.deliveryDate = body.deliveryDate || null;
  return out;
}

export function serializeWhiteboard(doc: Record<string, unknown>) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc as Record<string, unknown> & { _id: unknown };
  void __v; void createdAt; void updatedAt;
  return { id: String(_id), ...rest, status: normalizeWhiteboardStatus(rest.status) };
}

interface ConfirmedOrderWhiteboardInput {
  orderId: string;
  orderNumber: string;
  customerName: string;
  planogramName?: string;
  agentName?: string;
  notes?: string;
  lineItems: Array<{
    code?: string;
    description?: string;
    qtyOrdered?: number;
  }>;
}

/** Create (or return) the Digital Whiteboard task for a confirmed order. */
export async function ensureOrderOnWhiteboard(input: ConfirmedOrderWhiteboardInput) {
  const existing = await WhiteboardOrderModel.findOne({ sourceOrderId: input.orderId }).lean();
  if (existing) return existing;

  const productNames = Array.from(new Set(
    input.lineItems
      .map((line) => String(line.description || line.code || "").trim())
      .filter(Boolean),
  ));
  const product = productNames.join(", ") || input.planogramName || "Order";
  const qty = input.lineItems.reduce(
    (total, line) => total + Math.max(0, Number(line.qtyOrdered) || 0),
    0,
  );
  const taskNotes = [
    `Order ${input.orderNumber}`,
    input.planogramName ? `Planogram: ${input.planogramName}` : "",
    input.agentName ? `Agent: ${input.agentName}` : "",
    input.notes?.trim() || "",
  ].filter(Boolean).join(" · ");

  const _id = await nextWhiteboardId();
  try {
    return await WhiteboardOrderModel.create({
      _id,
      date: new Date().toISOString().slice(0, 10),
      priority: "2 - Moderate",
      customerName: input.customerName,
      orderType: "Order",
      proforma: "",
      product,
      qty,
      location: "OFC",
      status: "Orders to be made in the office",
      dueDate: "",
      dateOut: null,
      deliveryDate: null,
      completed: "",
      notes: taskNotes,
      sourceOrderId: input.orderId,
      orderNumber: input.orderNumber,
    });
  } catch (error) {
    // A duplicate source id means two confirmation attempts raced. In that
    // case the first task is authoritative and no second board row is needed.
    const raced = await WhiteboardOrderModel.findOne({ sourceOrderId: input.orderId }).lean();
    if (raced) return raced;
    throw error;
  }
}
