// app/api/inngest/verify-payment/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendEmail } from "@/lib/mail"; // adjust import if needed

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // 🔐 Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // 📝 Update payment record safely
    await prisma.payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "SUCCESS",
      },
    });

    // ✅ Retrieve updated payment
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
    });

    // ✅ Send notification email if possible
    if (payment?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: String(payment.userId) },
      });

      if (user?.email) {
        const courseText = payment.courseTitle || `Course #${payment.courseId}`;
        const subject = `Payment received — ${courseText}`;
        const html = `
          <p>Hi ${user.name ?? "Student"},</p>
          <p>Thanks for your purchase — we received your payment for <strong>${courseText}</strong>.</p>
          <p>Order ID: <code>${razorpay_order_id}</code></p>
          <p>You can now access your course at: 
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/courses/${payment.courseId}/content">
              View course
            </a>
          </p>
          <br/>
          <p>— Tech Titans Academy</p>
        `;

        try {
          await sendEmail({ to: user.email, subject, text: subject, html });
          console.log("📧 Notification email sent to", user.email);
        } catch (e) {
          console.error("❌ Failed to send notification email:", e);
        }
      } else {
        console.warn("⚠️ No user found or user has no email for payment.userId:", payment.userId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Error verifying payment:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
