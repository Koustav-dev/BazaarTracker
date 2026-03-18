import mongoose, { Document, Schema } from "mongoose";
export interface IUser extends Document {
  name: string; email: string; password: string; createdAt: Date; updatedAt: Date;
}
const UserSchema = new Schema<IUser>(
  { name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true } },
  { timestamps: true }
);
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
