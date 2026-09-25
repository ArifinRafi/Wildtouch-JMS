import mongoose, { Schema, type Model } from "mongoose";
import { normalizeAccountStatus } from "@/lib/client-status";

const ClientIssueSchema = new Schema(
  {
    date: { type: String, default: "" },
    type: { type: String, enum: ["complaint", "issue"], default: "complaint" },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const ClientNoteSchema = new Schema(
  {
    date: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { _id: false },
);

/**
 * Client model. Uses a String _id so the human-friendly "CLT-001" codes are
 * preserved as the document id (the clients pages display/key on it).
 * `strict: false` lets the many optional profile fields persist without
 * enumerating every one here.
 */
const ClientSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    postcode: { type: String, default: "" },
    region: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    email: { type: String, default: "" },
    companyNumber: { type: String, default: "" },
    agentId: { type: String, default: "" },
    agentName: { type: String, default: "" },
    primaryContactName: { type: String, default: "" },
    primaryContactPosition: { type: String, default: "" },
    furtherContactName: { type: String, default: "" },
    furtherContactPosition: { type: String, default: "" },
    furtherContactNumber: { type: String, default: "" },
    history: { type: String, default: "good" },
    accountStatus: { type: String, default: "new_client" },
    lastOrder: { type: String, default: "" },
    totalOrders: { type: Number, default: 0 },
    substituteDesignNotes: { type: String, default: "" },
    complaintsIssues: { type: [ClientIssueSchema], default: [] },
    clientNotes: { type: [ClientNoteSchema], default: [] },
    pricingCurrency: { type: String, enum: ["GBP", "EUR"], default: "GBP" },
  },
  { strict: false, timestamps: true },
);

export type ClientDoc = Record<string, unknown> & { _id: string };

export const Client: Model<ClientDoc> =
  (mongoose.models.Client as Model<ClientDoc>) ??
  mongoose.model<ClientDoc>("Client", ClientSchema);

/** Next sequential client id, e.g. CLT-013. */
export async function nextClientId(): Promise<string> {
  const docs = await Client.find({}, { _id: 1 }).lean();
  let max = 0;
  for (const d of docs) {
    const n = parseInt(String(d._id).split("-")[1] ?? "0", 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return `CLT-${String(max + 1).padStart(3, "0")}`;
}

/** Shape a client doc into the API/UI shape (id + all stored fields). */
export function serializeClient(doc: Record<string, unknown>): { id: string; [key: string]: unknown } {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc as Record<string, unknown> & {
    _id: unknown;
  };
  void __v;
  void createdAt;
  void updatedAt;
  return {
    id: String(_id),
    ...rest,
    accountStatus: normalizeAccountStatus(rest.accountStatus),
  };
}
