import type { CompanyReport, Competitor, CrawledPage, ReportSource, SwotAnalysis } from "@/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured");
  return key;
}

export interface OpenRouterModel {
  id: string;
  name: string;
}

export async function fetchModels(): Promise<OpenRouterModel[]> {
  const response = await fetch(MODELS_URL, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return [
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash" },
      { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    ];
  }

  const data = await response.json();
  const models: OpenRouterModel[] = (data.data ?? [])
    .filter((m: { id: string }) => Boolean(m.id))
    .map((m: { id: string; name?: string }) => ({
      id: m.id,
      name: m.name ?? m.id,
    }))
    .slice(0, 50);

  return models.length > 0
    ? models
    : [{ id: "openai/gpt-4o-mini", name: "GPT-4o Mini" }];
}

interface AnalysisInput {
  companyName: string;
  website: string;
  crawledContent: string;
  crawledPages: CrawledPage[];
  searchSnippets: string[];
  serperPhone: string;
  serperAddress: string;
  knowledgeDescription: string;
  serperCompetitors: Competitor[];
  searchSources: ReportSource[];
  model: string;
}

const EMPTY_SWOT: SwotAnalysis = {
  strengths: [],
  weaknesses: [],
  opportunities: [],
  threats: [],
};

export async function analyzeCompany(input: AnalysisInput): Promise<CompanyReport> {
  const systemPrompt = `You are a professional company research analyst. Analyze the provided company data and return ONLY valid JSON with this exact structure:
{
  "companyName": "string",
  "website": "string",
  "phone": "string",
  "address": "string",
  "industry": "string",
  "founded": "string (year or 'Not available')",
  "headquarters": "string (city, country)",
  "productsServices": ["item1", "item2"],
  "summary": "2-3 paragraph AI company summary",
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "swot": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "opportunities": ["opportunity 1", "opportunity 2"],
    "threats": ["threat 1", "threat 2"]
  },
  "competitors": [{"name": "Company Name", "website": "https://..."}]
}

Rules:
- Use crawled website content as primary source
- Fill phone/address from provided data when available
- Infer industry, founded year, and headquarters from available data
- Generate 3-5 realistic pain points
- Provide a balanced SWOT with 2-4 items per quadrant
- Identify 3-5 competitors in same country/industry with similar products
- Return ONLY the JSON object, no markdown`;

  const userPrompt = `Company: ${input.companyName}
Website: ${input.website}
Known Phone: ${input.serperPhone || "Not found"}
Known Address: ${input.serperAddress || "Not found"}
Knowledge Graph: ${input.knowledgeDescription || "N/A"}

--- CRAWLED WEBSITE CONTENT ---
${input.crawledContent.slice(0, 18000)}

--- SEARCH RESULTS ---
${input.searchSnippets.slice(0, 15).join("\n")}

--- SERPER COMPETITOR HINTS ---
${input.serperCompetitors.map((c) => `${c.name}: ${c.website}`).join("\n")}`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://company-research-assistant.vercel.app",
      "X-Title": "Company Research Assistant",
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const pagesCrawled = input.crawledPages.map((p) => p.url);
  const sources: ReportSource[] = [
    ...input.crawledPages.map((p) => ({ title: p.title, url: p.url })),
    ...input.searchSources,
  ];

  const seenUrls = new Set<string>();
  const uniqueSources = sources.filter((s) => {
    if (seenUrls.has(s.url)) return false;
    seenUrls.add(s.url);
    return true;
  });

  const swot = parsed.swot ?? EMPTY_SWOT;

  return {
    companyName: parsed.companyName ?? input.companyName,
    website: parsed.website ?? input.website,
    phone: parsed.phone || input.serperPhone || "Not available",
    address: parsed.address || input.serperAddress || "Not available",
    industry: parsed.industry ?? "Not available",
    founded: parsed.founded ?? "Not available",
    headquarters: parsed.headquarters ?? parsed.address ?? "Not available",
    productsServices: Array.isArray(parsed.productsServices)
      ? parsed.productsServices
      : [],
    summary: parsed.summary ?? "",
    painPoints: Array.isArray(parsed.painPoints) ? parsed.painPoints : [],
    swot: {
      strengths: Array.isArray(swot.strengths) ? swot.strengths : [],
      weaknesses: Array.isArray(swot.weaknesses) ? swot.weaknesses : [],
      opportunities: Array.isArray(swot.opportunities) ? swot.opportunities : [],
      threats: Array.isArray(swot.threats) ? swot.threats : [],
    },
    competitors: Array.isArray(parsed.competitors)
      ? parsed.competitors.map((c: Competitor) => ({
          name: c.name ?? "Unknown",
          website: c.website ?? "",
        }))
      : input.serperCompetitors,
    pagesCrawled,
    sources: uniqueSources,
    generatedAt: new Date().toISOString(),
  };
}
