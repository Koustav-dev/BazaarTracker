import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { OTP } from "@/lib/db/models/OTP";
import { sendOTPEmail } from "@/lib/services/emailService";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name?.trim() || !email?.trim() || !password)
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    await connectDB();

    // Check if already registered
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(password, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Store OTP + user details temporarily
    await OTP.create({
      email: email.toLowerCase(),
      code,
      name: name.trim(),
      password: hashed,
      expiresAt,
    });

    // Send OTP email
    await sendOTPEmail(email, name.trim(), code);

    return NextResponse.json({ message: "OTP sent" }, { status: 200 });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
