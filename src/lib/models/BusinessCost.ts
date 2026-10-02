import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SupplierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    contactName: { type: String, default: "", trim: true, maxlength: 200 },
    address: { type: String, default: "", trim: true, maxlength: 1000 },
    email: { type: String, default: "", trim: true, maxlength: 320 },
    telephone: { type: String, default: "", trim: true, maxlength: 100 },
  },
  { _id: false },
);

const BusinessCostSchema = new Schema(
  {
    date: { type: String, required: true },
    productService: { type: String, required: true, trim: true, maxlength: 300 },
    supplier: { type: SupplierSchema, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["GBP", "EUR"], default: "GBP" },
    note: { type: String, default: "", maxlength: 5000 },
    paid: { type: Boolean, default: false },
    paymentDate: { type: String, default: "" },
  },
  { timestamps: true },
);

BusinessCostSchema.index({ date: -1, paid: 1 });

export type BusinessCostDoc = InferSchemaType<typeof BusinessCostSchema>;

export const BusinessCost: Model<BusinessCostDoc> =
  (mongoose.models.BusinessCost as Model<BusinessCostDoc>) ??
  mongoose.model<BusinessCostDoc>("BusinessCost", BusinessCostSchema);

export function serializeBusinessCost(doc: BusinessCostDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date }) {
  return {
    id: String(doc._id),
    date: doc.date,
    productService: doc.productService,
    supplier: doc.supplier,
    quantity: doc.quantity,
    unitPrice: doc.unitPrice,
    totalPrice: doc.totalPrice,
    currency: doc.currency,
    note: doc.note,
    paid: doc.paid,
    paymentDate: doc.paymentDate,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
