import { NextResponse } from "next/server";
import { generatePdfReport } from "@/lib/pdf-generator";
import type { CompanyReport } from "@/types";

// Ensure this runs on Node.js runtime, not edge (PDFKit needs Node.js)
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const report: CompanyReport = await request.json();

    if (!report?.companyName) {
      return NextResponse.json({ error: "Invalid report data: missing companyName" }, { status: 400 });
    }

    // Validate required fields exist (may be empty strings, but must exist)
    const criticalFields = [
      "website",
      "companyName",
      "swot",
      "competitors",
      "pagesCrawled",
      "sources",
      "generatedAt",
    ];

    const missingFields = criticalFields.filter((field) => report[field as keyof CompanyReport] === undefined);
    if (missingFields.length > 0) {
      console.error("Missing fields in report:", { missingFields, reportKeys: Object.keys(report) });
      return NextResponse.json(
        { error: `Missing report fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
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
    console.error("PDF generation error:", error);
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
