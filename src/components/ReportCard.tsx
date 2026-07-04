"use client";

import {
  Globe,
  Download,
  ExternalLink,
  FileText,
  Link2,
} from "lucide-react";
import type { CompanyReport } from "@/types";

interface ReportCardProps {
  report: CompanyReport;
  onDownload: () => void;
  downloading?: boolean;
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-300">
          {title}
        </h3>
        <div className="mt-1.5 h-px bg-slate-600" />
      </div>
      <div className="text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 sm:grid-cols-[140px_1fr]">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-slate-200">{value || "Not available"}</span>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-slate-500">Not available</p>;
  }
  return (
    <ul className="list-inside list-disc space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ReportCard({ report, onDownload, downloading }: ReportCardProps) {
  return (
    <div className="space-y-6 rounded-xl border border-slate-700/60 bg-slate-800/30 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700/50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{report.companyName}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Report generated{" "}
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </div>

      <ReportSection title="Company Overview">
        <div className="space-y-2">
          <Field label="Name" value={report.companyName} />
          <Field label="Website" value={report.website} />
          <Field label="Phone" value={report.phone} />
          <Field label="Address" value={report.address} />
        </div>
      </ReportSection>

      <ReportSection title="Business Information">
        <div className="space-y-2">
          <Field label="Industry" value={report.industry} />
          <Field label="Founded" value={report.founded} />
          <Field label="Headquarters" value={report.headquarters} />
        </div>
      </ReportSection>

      <ReportSection title="Products & Services">
        <BulletList items={report.productsServices} />
      </ReportSection>

      <ReportSection title="AI Summary">
        <p className="whitespace-pre-wrap">
          {report.summary || "Not available"}
        </p>
      </ReportSection>

      <ReportSection title="Pain Points">
        <BulletList items={report.painPoints} />
      </ReportSection>

      <ReportSection title="SWOT Analysis">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Strengths", report.swot.strengths],
              ["Weaknesses", report.swot.weaknesses],
              ["Opportunities", report.swot.opportunities],
              ["Threats", report.swot.threats],
            ] as const
          ).map(([label, items]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {label}
              </p>
              <BulletList items={items} />
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Competitors">
        {report.competitors.length === 0 ? (
          <p className="text-slate-500">No competitors identified</p>
        ) : (
          <div className="space-y-2">
            {report.competitors.map((comp, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900/50 px-3 py-2"
              >
                <span className="font-medium text-slate-200">{comp.name}</span>
                <a
                  href={comp.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <Globe className="h-3 w-3" />
                  {comp.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </ReportSection>

      <ReportSection title="Pages Crawled">
        {report.pagesCrawled.length === 0 ? (
          <p className="text-slate-500">No pages crawled</p>
        ) : (
          <ul className="space-y-1.5">
            {report.pagesCrawled.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 break-all text-indigo-400 hover:text-indigo-300"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection title="Sources">
        {report.sources.length === 0 ? (
          <p className="text-slate-500">No sources recorded</p>
        ) : (
          <ul className="space-y-2">
            {report.sources.map((source, i) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg bg-slate-900/40 px-3 py-2 hover:bg-slate-900/70"
                >
                  <span className="flex items-center gap-1.5 text-sm text-slate-200 group-hover:text-white">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    {source.title}
                  </span>
                  <span className="mt-0.5 block break-all pl-5 text-xs text-slate-500">
                    {source.url}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <div className="border-t border-slate-700/50 pt-4">
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generating PDF..." : "Download PDF"}
        </button>
      </div>
    </div>
  );
}
