import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { courseId, userId } = await req.json();

    if (!courseId || !userId) {
      return NextResponse.json({ ok: false, error: "Missing data" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { courseId, userId, status: "SUCCESS" },
    });

    return NextResponse.json({ hasAccess: !!payment });
  } catch (err) {
    console.error("Error checking access:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
