import mongoose, { Schema, type Model } from "mongoose";

export type UserRole = "admin" | "manager";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager"], default: "manager" },
    /** Hashed 6-digit reset token + expiry for the master-email password flow. */
    resetTokenHash: { type: String, default: null },
    resetTokenExp: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = {
  _id: unknown;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  resetTokenHash?: string | null;
  resetTokenExp?: Date | null;
  createdAt?: Date;
};

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ??
  mongoose.model<UserDoc>("User", UserSchema);

export function serializeUser(doc: UserDoc) {
  return {
    id: String(doc._id),
    username: doc.username,
    email: doc.email,
    role: doc.role,
    createdAt: doc.createdAt ?? null,
  };
}
