import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CostItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const WastageLogSchema = new Schema(
  {
    date: { type: String, required: true },
    staffId: { type: String, required: true },
    staffName: { type: String, required: true },
    clientId: { type: String, required: true },
    clientName: { type: String, required: true },
    orderNumber: { type: String, required: true },
    productGroupId: { type: String, required: true },
    productGroupName: { type: String, required: true },
    wasteQuantity: { type: Number, required: true, min: 1 },
    note: { type: String, default: "", maxlength: 5000 },
    costItems: { type: [CostItemSchema], default: [] },
    currency: { type: String, enum: ["GBP", "EUR"], default: "GBP" },
    totalCost: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

WastageLogSchema.index({ date: -1, staffId: 1 });
WastageLogSchema.index({ orderNumber: 1 });

export type WastageLogDoc = InferSchemaType<typeof WastageLogSchema>;

export const WastageLog: Model<WastageLogDoc> =
  (mongoose.models.WastageLog as Model<WastageLogDoc>) ??
  mongoose.model<WastageLogDoc>("WastageLog", WastageLogSchema);

export function serializeWastageLog(doc: WastageLogDoc & { _id: unknown; createdAt?: Date; updatedAt?: Date }) {
  return {
    id: String(doc._id),
    date: doc.date,
    staffId: doc.staffId,
    staffName: doc.staffName,
    clientId: doc.clientId,
    clientName: doc.clientName,
    orderNumber: doc.orderNumber,
    productGroupId: doc.productGroupId,
    productGroupName: doc.productGroupName,
    wasteQuantity: doc.wasteQuantity,
    note: doc.note,
    costItems: doc.costItems,
    currency: doc.currency,
    totalCost: doc.totalCost,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
