import { NextResponse } from "next/server";
import { generatePdfReport } from "@/lib/pdf-generator";
import type { CompanyReport } from "@/types";

export async function POST(request: Request) {
  try {
    const report: CompanyReport = await request.json();

    if (!report?.companyName) {
      return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
    }

    const pdfBuffer = await generatePdfReport(report);
    const safeName = report.companyName.replace(/[^a-z0-9]/gi, "_");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_report.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
