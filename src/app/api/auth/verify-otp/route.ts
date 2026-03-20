import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { OTP } from "@/lib/db/models/OTP";
import { sendWelcomeEmail } from "@/lib/services/emailService";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code)
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });

    await connectDB();

    const record = await OTP.findOne({ email: email.toLowerCase() });
    if (!record)
      return NextResponse.json({ error: "OTP not found. Please register again." }, { status: 404 });

    // Check expiry
    if (new Date() > record.expiresAt) {
      await OTP.deleteOne({ _id: record._id });
      return NextResponse.json({ error: "OTP has expired. Please register again." }, { status: 410 });
    }

    // Rate limit attempts
    if (record.attempts >= 5) {
      await OTP.deleteOne({ _id: record._id });
      return NextResponse.json({ error: "Too many attempts. Please register again." }, { status: 429 });
    }

    // Check code
    if (record.code !== code.trim()) {
      await OTP.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      const left = 5 - (record.attempts + 1);
      return NextResponse.json({ error: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.` }, { status: 400 });
    }

    // Check user doesn't already exist (race condition guard)
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      await OTP.deleteOne({ _id: record._id });
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Create user
    const user = await User.create({
      name: record.name,
      email: record.email,
      password: record.password,
      emailVerified: true,
    });

    // Clean up OTP
    await OTP.deleteOne({ _id: record._id });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    return NextResponse.json({ message: "Account created" }, { status: 201 });
  } catch (e) {
    console.error("[verify-otp]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
