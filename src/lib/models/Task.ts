import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const TASK_STATUS = ["pending", "complete"] as const;
export const TASK_PRIORITY = ["low", "medium", "high"] as const;

/** A dated task assigned to an employee. */
const TaskSchema = new Schema(
  {
    date: { type: String, default: "" },
    employeeName: { type: String, default: "" },
    taskName: { type: String, default: "" },
    status: { type: String, enum: TASK_STATUS, default: "pending" },
    priority: { type: String, enum: TASK_PRIORITY, default: "medium" },
  },
  { timestamps: true },
);

export type TaskDoc = InferSchemaType<typeof TaskSchema>;

export const Task: Model<TaskDoc> =
  (mongoose.models.Task as Model<TaskDoc>) ??
  mongoose.model<TaskDoc>("Task", TaskSchema);

export function serializeTask(doc: {
  _id: unknown;
  date?: string;
  employeeName?: string;
  taskName?: string;
  status?: string;
  priority?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    date: doc.date ?? "",
    employeeName: doc.employeeName ?? "",
    taskName: doc.taskName ?? "",
    status: (doc.status as (typeof TASK_STATUS)[number]) ?? "pending",
    priority: (doc.priority as (typeof TASK_PRIORITY)[number]) ?? "medium",
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}
