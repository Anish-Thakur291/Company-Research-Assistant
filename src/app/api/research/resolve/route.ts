import { NextResponse } from "next/server";
import { findOfficialWebsite } from "@/lib/serper";
import { isUrl, normalizeUrl } from "@/lib/utils";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const trimmed = query.trim();
    let companyName = trimmed;
    let website = "";

    if (isUrl(trimmed)) {
      website = normalizeUrl(trimmed);
      companyName = new URL(website).hostname.replace(/^www\./, "").split(".")[0];
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    } else {
      const found = await findOfficialWebsite(trimmed);
      website = normalizeUrl(found.website);
      companyName = trimmed;
    }

    return NextResponse.json({ companyName, website });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve company";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
