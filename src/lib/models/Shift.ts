import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const SHIFT_ATTENDANCE = ["unmarked", "attended", "absent"] as const;

const ShiftSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true, trim: true },
    date: { type: String, required: true, index: true },
    startTime: { type: String, required: true },
    finishTime: { type: String, required: true },
    hours: { type: Number, required: true, min: 0 },
    lunchMinutes: { type: Number, default: 0, min: 0 },
    extraHours: { type: Number, default: 0, min: 0 },
    chargeableHours: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "", trim: true },
    attendance: { type: String, enum: SHIFT_ATTENDANCE, default: "unmarked" },
  },
  { timestamps: true },
);

ShiftSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export type ShiftDoc = InferSchemaType<typeof ShiftSchema>;

export const Shift: Model<ShiftDoc> =
  (mongoose.models.Shift as Model<ShiftDoc>) ??
  mongoose.model<ShiftDoc>("Shift", ShiftSchema);

export function serializeShift(doc: ShiftDoc & { _id: unknown }) {
  return {
    id: String(doc._id),
    employeeId: doc.employeeId,
    employeeName: doc.employeeName,
    date: doc.date,
    startTime: doc.startTime,
    finishTime: doc.finishTime,
    hours: doc.hours,
    lunchMinutes: doc.lunchMinutes,
    extraHours: doc.extraHours,
    chargeableHours: doc.chargeableHours,
    notes: doc.notes,
    attendance: doc.attendance,
  };
}

export function calculateShiftHours(startTime: string, finishTime: string, lunchMinutes: number) {
  const parse = (value: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  };
  const start = parse(startTime);
  const finish = parse(finishTime);
  if (start == null || finish == null || !Number.isFinite(lunchMinutes) || lunchMinutes < 0 || lunchMinutes > 24 * 60) return null;
  const durationMinutes = finish >= start ? finish - start : finish + 24 * 60 - start;
  return {
    hours: Number((durationMinutes / 60).toFixed(2)),
    chargeableHours: Number((Math.max(0, durationMinutes - lunchMinutes) / 60).toFixed(2)),
  };
}
