import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";   // make sure lib/prisma.js exports db
import { syncUser } from "@/lib/syncUser"; // make sure this file exists

// ✅ Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, courseId, courseTitle, userId } = body;

    if (!amount || !courseId || !courseTitle || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📌 Creating Razorpay order with:", { amount, courseId, courseTitle, userId });

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    console.log("✅ Razorpay order created:", order);

    // ✅ Ensure user exists in DB
    const user = await syncUser(userId);
    console.log("✅ Synced user:", user);

    // ✅ Save payment record in DB
    await db.payment.create({
      data: {
        razorpayOrderId: order.id, // Razorpay order id         // ✅ save again in orderId field
        amount,
        courseId,
        courseTitle,
        status: "PENDING",
        userId: user.id,
      },
    });

    console.log("✅ Payment record saved");

    return NextResponse.json(order);
  } catch (err) {
    console.error("❌ Error in create-order:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
