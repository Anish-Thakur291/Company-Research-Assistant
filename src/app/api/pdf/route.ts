import { NextResponse } from "next/server";
import { generatePdfReport } from "@/lib/pdf-generator";
import type { CompanyReport, Competitor, ReportSource, SwotAnalysis } from "@/types";

// Ensure this runs on Node.js runtime, not edge (PDFKit needs Node.js)
export const runtime = "nodejs";

function normalizeString(value: unknown, fallback = "Not available") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  return fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function normalizeCompetitors(value: unknown): Competitor[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      name: normalizeString(item.name, "Unknown"),
      website: normalizeString(item.website, ""),
    }));
}

function normalizeSources(value: unknown): ReportSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      title: normalizeString(item.title, "Untitled source"),
      url: normalizeString(item.url, ""),
    }));
}

function normalizeSwot(value: unknown): SwotAnalysis {
  if (!value || typeof value !== "object") {
    return { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  }

  const swot = value as Record<string, unknown>;
  return {
    strengths: normalizeStringArray(swot.strengths),
    weaknesses: normalizeStringArray(swot.weaknesses),
    opportunities: normalizeStringArray(swot.opportunities),
    threats: normalizeStringArray(swot.threats),
  };
}

function normalizeReport(report: Partial<CompanyReport> | null | undefined): CompanyReport {
  return {
    companyName: normalizeString(report?.companyName, "Untitled Company"),
    website: normalizeString(report?.website),
    phone: normalizeString(report?.phone),
    address: normalizeString(report?.address),
    industry: normalizeString(report?.industry),
    founded: normalizeString(report?.founded),
    headquarters: normalizeString(report?.headquarters),
    productsServices: normalizeStringArray(report?.productsServices),
    summary: typeof report?.summary === "string" ? report.summary : "",
    painPoints: normalizeStringArray(report?.painPoints),
    swot: normalizeSwot(report?.swot),
    competitors: normalizeCompetitors(report?.competitors),
    pagesCrawled: normalizeStringArray(report?.pagesCrawled),
    sources: normalizeSources(report?.sources),
    generatedAt: normalizeString(report?.generatedAt, new Date().toISOString()),
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const report = normalizeReport(payload as Partial<CompanyReport> | null | undefined);

    const pdfBuffer = await generatePdfReport(report);
    const safeName = report.companyName.replace(/[^a-z0-9]/gi, "_");

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_report.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
