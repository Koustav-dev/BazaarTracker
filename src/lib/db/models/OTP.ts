import mongoose, { Document, Schema } from "mongoose";

export interface IOTP extends Document {
  email: string;
  code: string;
  name: string;
  password: string; // hashed — stored temporarily until OTP verified
  expiresAt: Date;
  attempts: number;
}

const OTPSchema = new Schema<IOTP>({
  email:     { type: String, required: true, lowercase: true },
  code:      { type: String, required: true },
  name:      { type: String, required: true },
  password:  { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  attempts:  { type: Number, default: 0 },
});

// Auto-delete after expiry
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.models.OTP || mongoose.model<IOTP>("OTP", OTPSchema);
