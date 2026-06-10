import mongoose, { Schema, type Model } from "mongoose";

/** Agent model — string _id keeps the "AGT-001" codes as the document id. */
const AgentSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    referredPoints: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

export type AgentDoc = Record<string, unknown> & { _id: string };

export const Agent: Model<AgentDoc> =
  (mongoose.models.Agent as Model<AgentDoc>) ??
  mongoose.model<AgentDoc>("Agent", AgentSchema);

/** Next sequential agent id, e.g. AGT-009. */
export async function nextAgentId(): Promise<string> {
  const docs = await Agent.find({}, { _id: 1 }).lean();
  let max = 0;
  for (const d of docs) {
    const n = parseInt(String(d._id).split("-")[1] ?? "0", 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `AGT-${String(max + 1).padStart(3, "0")}`;
}

export function serializeAgent(doc: Record<string, unknown>) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc as Record<string, unknown> & { _id: unknown };
  void __v; void createdAt; void updatedAt;
  return { id: String(_id), ...rest };
}
