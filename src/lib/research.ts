import { crawlWebsite, summarizeCrawledContent } from "./crawler";
import {
  findOfficialWebsite,
  searchCompanyInfo,
  searchCompetitors,
} from "./serper";
import { analyzeCompany } from "./openrouter";
import { isUrl, normalizeUrl } from "./utils";
import type { CompanyReport, ProgressEvent } from "@/types";

export async function runResearch(
  query: string,
  model: string,
  onProgress: (event: ProgressEvent) => void
): Promise<CompanyReport> {
  try {
    onProgress({
      type: "progress",
      step: "validating",
      message: "Validating input...",
    });

    const trimmed = query.trim();
    if (!trimmed) throw new Error("Please enter a company name or website URL");

    let companyName = trimmed;
    let website = "";

    if (isUrl(trimmed)) {
      website = normalizeUrl(trimmed);
      companyName = new URL(website).hostname.replace(/^www\./, "").split(".")[0];
      companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
    } else {
      onProgress({
        type: "progress",
        step: "searching",
        message: `Searching for ${trimmed}'s official website...`,
      });

      const found = await findOfficialWebsite(trimmed);
      website = normalizeUrl(found.website);
      companyName = trimmed;
    }

    onProgress({
      type: "progress",
      step: "crawling",
      message: `Crawling ${website} for key pages...`,
    });

    const crawledPages = await crawlWebsite(website);
    const crawledContent = summarizeCrawledContent(crawledPages);

    onProgress({
      type: "progress",
      step: "collecting",
      message: "Collecting additional public information...",
    });

    const [companyInfo, serperCompetitors] = await Promise.all([
      searchCompanyInfo(companyName, website),
      searchCompetitors(companyName, crawledContent.slice(0, 500)),
    ]);

    onProgress({
      type: "progress",
      step: "analyzing",
      message: "AI is analyzing company data and identifying competitors...",
    });

    const report = await analyzeCompany({
      companyName,
      website,
      crawledContent,
      crawledPages,
      searchSnippets: companyInfo.snippets,
      serperPhone: companyInfo.phone,
      serperAddress: companyInfo.address,
      knowledgeDescription: companyInfo.knowledgeDescription,
      serperCompetitors,
      searchSources: companyInfo.sources,
      model,
    });

    onProgress({
      type: "progress",
      step: "generating",
      message: "Finalizing research report...",
    });

    onProgress({ type: "complete", step: "complete", data: report });
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    onProgress({ type: "error", step: "error", error: message });
    throw error;
  }
}
