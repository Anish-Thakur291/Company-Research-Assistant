const SERPER_URL = "https://google.serper.dev/search";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

interface SerperResponse {
  organic?: SerperResult[];
  knowledgeGraph?: {
    title?: string;
    website?: string;
    description?: string;
    phone?: string;
    address?: string;
  };
}

async function serperSearch(query: string, num = 10): Promise<SerperResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured");
  }

  const response = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  return response.json();
}

export async function findOfficialWebsite(
  companyName: string
): Promise<{ website: string; title: string }> {
  const data = await serperSearch(`${companyName} official website`, 8);
  const organic = data.organic ?? [];

  if (data.knowledgeGraph?.website) {
    return {
      website: data.knowledgeGraph.website,
      title: data.knowledgeGraph.title ?? companyName,
    };
  }

  const skipDomains = [
    "linkedin.com",
    "facebook.com",
    "twitter.com",
    "x.com",
    "instagram.com",
    "youtube.com",
    "wikipedia.org",
    "crunchbase.com",
    "bloomberg.com",
    "glassdoor.com",
    "indeed.com",
  ];

  for (const result of organic) {
    try {
      const hostname = new URL(result.link).hostname.replace(/^www\./, "");
      if (skipDomains.some((d) => hostname.includes(d))) continue;
      return { website: result.link, title: result.title };
    } catch {
      continue;
    }
  }

  if (organic[0]) {
    return { website: organic[0].link, title: organic[0].title };
  }

  throw new Error(`Could not find official website for "${companyName}"`);
}

export async function searchCompanyInfo(
  companyName: string,
  website: string
): Promise<{
  snippets: string[];
  phone: string;
  address: string;
  knowledgeDescription: string;
  sources: Array<{ title: string; url: string }>;
}> {
  const domain = new URL(website.startsWith("http") ? website : `https://${website}`)
    .hostname.replace(/^www\./, "");

  const [general, contact] = await Promise.all([
    serperSearch(`${companyName} company overview products services`, 8),
    serperSearch(`${companyName} ${domain} contact phone address`, 6),
  ]);

  const allResults = [...(general.organic ?? []), ...(contact.organic ?? [])];
  const snippets = allResults.map((r) => `${r.title}: ${r.snippet}`);

  const seen = new Set<string>();
  const sources = allResults
    .filter((r) => {
      if (seen.has(r.link)) return false;
      seen.add(r.link);
      return true;
    })
    .map((r) => ({ title: r.title, url: r.link }));

  const kg = general.knowledgeGraph ?? contact.knowledgeGraph;

  return {
    snippets,
    phone: kg?.phone ?? "",
    address: kg?.address ?? "",
    knowledgeDescription: kg?.description ?? "",
    sources,
  };
}

export async function searchCompetitors(
  companyName: string,
  industryHint: string
): Promise<Array<{ name: string; website: string }>> {
  const query = industryHint
    ? `${companyName} competitors ${industryHint} similar companies`
    : `${companyName} competitors alternative companies`;

  const data = await serperSearch(query, 10);
  const competitors: Array<{ name: string; website: string }> = [];
  const seen = new Set<string>();

  for (const result of data.organic ?? []) {
    const title = result.title
      .replace(/\s*[-|–].*$/, "")
      .replace(/\s*\(.*\)$/, "")
      .trim();

    let hostname = "";
    try {
      hostname = new URL(result.link).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }

    if (
      hostname.includes("wikipedia") ||
      hostname.includes("linkedin") ||
      title.toLowerCase().includes("competitor") ||
      title.toLowerCase().includes("top ") ||
      title.toLowerCase().includes("best ")
    ) {
      continue;
    }

    const key = hostname.toLowerCase();
    if (seen.has(key) || title.toLowerCase() === companyName.toLowerCase()) continue;
    seen.add(key);

    competitors.push({
      name: title,
      website: result.link.startsWith("http")
        ? new URL(result.link).origin
        : result.link,
    });

    if (competitors.length >= 5) break;
  }

  return competitors;
}
