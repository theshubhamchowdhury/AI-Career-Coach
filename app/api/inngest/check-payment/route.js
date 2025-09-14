// app/api/inngest/check-payment/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const userId = searchParams.get("userId");

    if (!courseId || !userId) {
      return NextResponse.json(
        { ok: false, error: "Missing courseId or userId" },
        { status: 400 }
      );
    }

    console.log("🔍 Debug check-payment:", {
      searchedCourseId: courseId,
      searchedUserId: userId,
    });

    // Look for payment record ignoring status first for debug
    const paymentRecord = await db.payment.findFirst({
      where: {
        courseId: Number(courseId),
        userId: String(userId),
      },
    });

    console.log("💡 Full payment record found:", paymentRecord);

    if (!paymentRecord) {
      console.log("❌ No payment record exists for this user/course");
      return NextResponse.json({ ok: false, purchased: false });
    }

    // Now check status case-insensitively
    if (paymentRecord.status.toLowerCase() !== "success") {
      console.log(`⚠️ Payment exists but status is '${paymentRecord.status}'`);
      return NextResponse.json({ ok: false, purchased: false });
    }

    console.log("✅ Found successful payment:", paymentRecord.id);

    return NextResponse.json({
      ok: true,
      purchased: true,
      paymentId: paymentRecord.id,
      razorpayOrderId: paymentRecord.razorpayOrderId,
    });
  } catch (err) {
    console.error("❌ Error in check-payment:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
