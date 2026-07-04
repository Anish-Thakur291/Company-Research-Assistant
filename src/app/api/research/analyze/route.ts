import { NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/openrouter";
import type { Competitor, CrawledPage } from "@/types";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      website,
      crawledContent,
      crawledPages,
      companyInfo,
      competitors,
      model,
    } = body;

    if (!companyName || !website) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const report = await analyzeCompany({
      companyName,
      website,
      crawledContent: crawledContent ?? "",
      crawledPages: (crawledPages ?? []) as CrawledPage[],
      searchSnippets: companyInfo?.snippets ?? [],
      serperPhone: companyInfo?.phone ?? "",
      serperAddress: companyInfo?.address ?? "",
      knowledgeDescription: companyInfo?.knowledgeDescription ?? "",
      serperCompetitors: (competitors ?? []) as Competitor[],
      searchSources: companyInfo?.sources ?? [],
      model: model || "openai/gpt-4o-mini",
    });

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
