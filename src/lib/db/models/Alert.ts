import mongoose, { Document, Schema } from "mongoose";
export type AlertCondition = "above" | "below";
export type AlertStatus = "active" | "triggered" | "paused";
export interface IAlert extends Document {
  userId: string; symbol: string; name: string; exchange: "NSE"|"BSE";
  condition: AlertCondition; targetPrice: number; currentPrice?: number;
  status: AlertStatus; notifyEmail: boolean; triggeredAt?: Date; createdAt: Date; updatedAt: Date;
}
const AlertSchema = new Schema<IAlert>(
  { userId: { type: String, required: true },
    symbol: { type: String, required: true }, name: { type: String, required: true },
    exchange: { type: String, enum: ["NSE","BSE"], required: true },
    condition: { type: String, enum: ["above","below"], required: true },
    targetPrice: { type: Number, required: true, min: 0 }, currentPrice: Number,
    status: { type: String, enum: ["active","triggered","paused"], default: "active" },
    notifyEmail: { type: Boolean, default: true }, triggeredAt: Date },
  { timestamps: true }
);
AlertSchema.index({ userId: 1, status: 1 });
AlertSchema.index({ symbol: 1 });
export const Alert = mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
