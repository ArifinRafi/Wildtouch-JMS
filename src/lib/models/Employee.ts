import mongoose, { Schema, type Model } from "mongoose";

const EmployeeSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    contactNumber: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export type EmployeeDoc = Record<string, unknown> & { _id: string };

export const Employee: Model<EmployeeDoc> =
  (mongoose.models.Employee as Model<EmployeeDoc>) ??
  mongoose.model<EmployeeDoc>("Employee", EmployeeSchema);

export async function nextEmployeeId(): Promise<string> {
  const docs = await Employee.find({}, { _id: 1 }).lean();
  let max = 0;
  for (const doc of docs) {
    const sequence = Number.parseInt(String(doc._id).split("-")[1] ?? "0", 10);
    if (Number.isFinite(sequence)) max = Math.max(max, sequence);
  }
  return `EMP-${String(max + 1).padStart(3, "0")}`;
}

export function serializeEmployee(doc: Record<string, unknown>) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc as Record<string, unknown> & { _id: unknown };
  void __v; void createdAt; void updatedAt;
  return { id: String(_id), ...rest };
}
