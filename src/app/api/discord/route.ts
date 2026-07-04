import { NextResponse } from "next/server";
import { sendReportToDiscord, isDiscordConfigured } from "@/lib/discord";
import { generatePdfReport } from "@/lib/pdf-generator";
import type { ApplicantSettings, CompanyReport } from "@/types";

export async function POST(request: Request) {
  try {
    if (!isDiscordConfigured()) {
      return NextResponse.json(
        { error: "Discord is not configured on the server" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const report = body.report as CompanyReport;
    const applicant = body.applicant as ApplicantSettings;

    if (!report?.companyName) {
      return NextResponse.json({ error: "Report data is required" }, { status: 400 });
    }

    const pdfBuffer = await generatePdfReport(report);
    await sendReportToDiscord(report, pdfBuffer, applicant ?? {
      applicantName: "",
      applicantEmail: "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discord notification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
