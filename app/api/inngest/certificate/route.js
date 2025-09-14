import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { name, course } = await req.json();

    // Load certificate template
    const templatePath = path.join(process.cwd(), "public/certificate/template.png");
    const templateImage = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape

    // Embed template
    const pngImage = await pdfDoc.embedPng(templateImage);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });

    // Fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // =========================
    // Dynamic Content Placement
    // =========================

    // Student Name (centered)
    page.drawText(name, {
      x: 250,
      y: 300,
      size: 35,
      font: boldFont,
      color: rgb(1, 1, 1), // white
    });

    // Course Name (centered under name)
    page.drawText(course, {
      x: 300,
      y: 257,
      size: 24,
      font: boldFont,
      color: rgb(0.9, 0.9, 0.9), // light gray
    });
     // Save & return
    const pdfBytes = await pdfDoc.save();
    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${name}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Certificate generation failed:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}
