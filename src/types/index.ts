export interface Competitor {
  name: string;
  website: string;
}

export interface SwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ReportSource {
  title: string;
  url: string;
}

export interface CompanyReport {
  companyName: string;
  website: string;
  phone: string;
  address: string;
  industry: string;
  founded: string;
  headquarters: string;
  productsServices: string[];
  summary: string;
  painPoints: string[];
  swot: SwotAnalysis;
  competitors: Competitor[];
  pagesCrawled: string[];
  sources: ReportSource[];
  generatedAt: string;
}

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
}

export type ResearchStep =
  | "validating"
  | "searching"
  | "crawling"
  | "collecting"
  | "analyzing"
  | "generating"
  | "complete"
  | "error";

export interface ProgressEvent {
  type: "progress" | "complete" | "error";
  step?: ResearchStep;
  message?: string;
  data?: CompanyReport;
  error?: string;
}

export interface ApplicantSettings {
  applicantName: string;
  applicantEmail: string;
}
