import { NextResponse } from "next/server";
import { searchCompanyInfo, searchCompetitors } from "@/lib/serper";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { companyName, website, contentHint } = await request.json();
    if (!companyName || !website) {
      return NextResponse.json({ error: "companyName and website are required" }, { status: 400 });
    }

    const [companyInfo, competitors] = await Promise.all([
      searchCompanyInfo(companyName, website),
      searchCompetitors(companyName, contentHint ?? ""),
    ]);

    return NextResponse.json({ companyInfo, competitors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
