import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin, isResponse } from "@/lib/authz";
import { sendEmail } from "@/lib/email";

/**
 * Step 1 of the admin password change: generate a 6-digit token, store its
 * hash (15-minute expiry) and email it to the master admin email.
 */
export async function POST() {
  const gate = await requireAdmin();
  if (isResponse(gate)) return gate;

  const masterEmail = process.env.MASTER_ADMIN_EMAIL;
  if (!masterEmail) {
    return NextResponse.json(
      { error: "MASTER_ADMIN_EMAIL is not configured on the server" },
      { status: 500 },
    );
  }

  await connectDB();
  const token = String(crypto.randomInt(100000, 1000000)); // 6 digits
  const resetTokenHash = await bcrypt.hash(token, 10);
  const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000);

  await User.findByIdAndUpdate(gate.id, { resetTokenHash, resetTokenExp });

  try {
    const result = await sendEmail({
      to: masterEmail,
      subject: "Wildtouch JMS — password change verification code",
      text: `Your verification code is: ${token}\n\nIt expires in 15 minutes. If you didn't request a password change, ignore this email.`,
    });
    return NextResponse.json({
      sent: result.delivered,
      fallback: result.fallback ?? false,
      maskedEmail: masterEmail.replace(/^(.{2}).*(@.*)$/, "$1•••$2"),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed to send email" },
      { status: 502 },
    );
  }
}
