import * as cheerio from "cheerio";
import { normalizeUrl, getDomain } from "./utils";
import type { CrawledPage } from "@/types";

const COMMON_PATHS = [
  "/about",
  "/about-us",
  "/company",
  "/who-we-are",
  "/products",
  "/product",
  "/services",
  "/service",
  "/solutions",
  "/solution",
  "/contact",
  "/contact-us",
  "/pricing",
  "/plans",
];

const IMPORTANT_PATTERNS = [
  /\/(about|about-us|company|who-we-are)(\/|$)/i,
  /\/(products|product|solutions|solution)(\/|$)/i,
  /\/(services|service)(\/|$)/i,
  /\/(contact|contact-us|get-in-touch)(\/|$)/i,
  /\/(pricing|plans|price)(\/|$)/i,
];

const SKIP_PATTERNS = [
  /login|signin|sign-in|signup|sign-up|register|auth|oauth/i,
  /cart|checkout|account|dashboard|admin|portal|privacy|terms|cookie|legal/i,
  /blog|news|press|events|webinar|careers|jobs|docs|documentation|developers|api\//i,
  /support|help|faq|resources|learn|academy|community|forum|status/i,
  /\/tag\/|\/category\/|\/author\/|\/page\/\d|\/[a-z]{2}(-[a-z]{2})?\//i,
  /\.pdf$|\.jpg$|\.png$|\.zip$|\.xml$|\.json$/i,
];

const MAX_PAGES = 8;
const MAX_FETCHES = 8;
const FETCH_TIMEOUT = 5000;
const FETCH_CONCURRENCY = 3;

function shouldSkipUrl(url: string): boolean {
  return SKIP_PATTERNS.some((p) => p.test(url));
}

function isImportantPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  return IMPORTANT_PATTERNS.some((p) => p.test(pathname));
}

function urlPriority(url: string, baseUrl: string): number {
  try {
    const path = new URL(url).pathname;
    const base = baseUrl.replace(/\/+$/, "");
    if (url.replace(/\/+$/, "") === base) return 100;
    if (isImportantPath(path)) return 80;
    return 0;
  } catch {
    return 0;
  }
}

function normalizeLink(base: string, href: string): string | null {
  try {
    const resolved = new URL(href, base);
    if (!["http:", "https:"].includes(resolved.protocol)) return null;
    resolved.hash = "";
    return resolved.href.replace(/\/+$/, "") || resolved.origin;
  } catch {
    return null;
  }
}

function extractText(html: string, url: string): { title: string; content: string } {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, svg, nav, footer, header").remove();
  $('[role="navigation"], .cookie, .popup, .modal, #cookie, .banner').remove();

  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    url;

  const selectors = ["main", "article", '[role="main"]', ".content", "body"];
  let text = "";

  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length) {
      text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 100) break;
    }
  }

  if (!text) {
    text = $("body").text().replace(/\s+/g, " ").trim();
  }

  return { title, content: text.slice(0, 8000) };
}

async function fetchPage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildCandidateUrls(baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  const seen = new Set<string>();
  const candidates: string[] = [];

  const add = (url: string) => {
    const normalized = url.replace(/\/+$/, "") || origin;
    if (seen.has(normalized) || shouldSkipUrl(normalized)) return;
    if (getDomain(normalized) !== getDomain(baseUrl)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  add(baseUrl);
  for (const path of COMMON_PATHS) {
    add(`${origin}${path}`);
  }

  return candidates;
}

function discoverImportantLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const baseDomain = getDomain(baseUrl);
  const links: string[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return;

    const link = normalizeLink(baseUrl, href);
    if (!link || getDomain(link) !== baseDomain || shouldSkipUrl(link)) return;

    try {
      if (!isImportantPath(new URL(link).pathname)) return;
    } catch {
      return;
    }

    const key = link.replace(/\/+$/, "");
    if (seen.has(key)) return;
    seen.add(key);
    links.push(key);
  });

  return links;
}

async function fetchAndExtract(url: string): Promise<CrawledPage | null> {
  const html = await fetchPage(url);
  if (!html) return null;
  const { title, content } = extractText(html, url);
  if (content.length < 80) return null;
  return { url, title, content };
}

async function fetchBatch(urls: string[]): Promise<CrawledPage[]> {
  const results: CrawledPage[] = [];

  for (let i = 0; i < urls.length; i += FETCH_CONCURRENCY) {
    const batch = urls.slice(i, i + FETCH_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map((url) => fetchAndExtract(url)));
    for (const result of settled) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }
  }

  return results;
}

async function crawlWithTimeout(startUrl: string): Promise<CrawledPage[]> {
  const baseUrl = normalizeUrl(startUrl);
  const pages: CrawledPage[] = [];
  const fetched = new Set<string>();

  const candidates = buildCandidateUrls(baseUrl);

  const homeCandidate = candidates[0];
  const homeHtml = await fetchPage(homeCandidate);
  fetched.add(homeCandidate.replace(/\/+$/, ""));

  if (homeHtml) {
    const { title, content } = extractText(homeHtml, homeCandidate);
    if (content.length >= 80) {
      pages.push({ url: homeCandidate, title, content });
    }
    const discovered = discoverImportantLinks(homeHtml, baseUrl);
    for (const link of discovered) {
      if (!candidates.includes(link)) candidates.push(link);
    }
  }

  candidates.sort((a, b) => urlPriority(b, baseUrl) - urlPriority(a, baseUrl));

  const toFetch = candidates.filter((url) => {
    const key = url.replace(/\/+$/, "");
    if (fetched.has(key)) return false;
    return urlPriority(url, baseUrl) > 0;
  }).slice(0, MAX_FETCHES - 1);

  if (toFetch.length > 0 && pages.length < MAX_PAGES) {
    const extra = await fetchBatch(toFetch);
    for (const page of extra) {
      if (pages.length >= MAX_PAGES) break;
      if (!pages.some((p) => p.url.replace(/\/+$/, "") === page.url.replace(/\/+$/, ""))) {
        pages.push(page);
      }
    }
  }

  return pages;
}

export async function crawlWebsite(startUrl: string): Promise<CrawledPage[]> {
  try {
    const pages = await crawlWithTimeout(startUrl);
    if (pages.length > 0) return pages;

    const baseUrl = normalizeUrl(startUrl);
    const page = await fetchAndExtract(baseUrl);
    return page ? [page] : [];
  } catch {
    const baseUrl = normalizeUrl(startUrl);
    const page = await fetchAndExtract(baseUrl);
    return page ? [page] : [];
  }
}

export function summarizeCrawledContent(pages: CrawledPage[]): string {
  return pages
    .map((p) => `--- Page: ${p.title} (${p.url}) ---\n${p.content}`)
    .join("\n\n")
    .slice(0, 25000);
}
