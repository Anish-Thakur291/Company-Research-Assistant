import { NextResponse } from "next/server";
import { crawlWebsite, summarizeCrawledContent } from "@/lib/crawler";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { website } = await request.json();
    if (!website || typeof website !== "string") {
      return NextResponse.json({ error: "Website is required" }, { status: 400 });
    }

    const pages = await crawlWebsite(website);
    const content = summarizeCrawledContent(pages);

    return NextResponse.json({ pages, content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Crawl failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
