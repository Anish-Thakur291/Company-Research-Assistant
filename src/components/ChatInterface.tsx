"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, User } from "lucide-react";
import { getApplicantSettings } from "./Sidebar";
import { ProgressSteps } from "./ProgressSteps";
import { ReportCard } from "./ReportCard";
import type { CompanyReport, ResearchStep } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string;
  report?: CompanyReport;
  step?: ResearchStep;
  stepMessage?: string;
  error?: boolean;
}

interface ChatInterfaceProps {
  model: string;
}

export function ChatInterface({ model }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 150;
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  const downloadPdf = useCallback(async (report: CompanyReport) => {
    setDownloading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || `PDF generation failed: ${res.status}`);
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error("PDF blob is empty");
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.companyName.replace(/[^a-z0-9]/gi, "_")}_report.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download PDF";
      alert(`Failed to download PDF: ${message}`);
      console.error("PDF download error:", error);
    } finally {
      setDownloading(false);
    }
  }, []);

  const notifyDiscord = useCallback(async (report: CompanyReport) => {
    try {
      await fetch("/api/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report,
          applicant: getApplicantSettings(),
        }),
      });
    } catch {
      /* Discord is optional */
    }
  }, []);

  const updateProgress = (
    progressId: string,
    step: ResearchStep,
    message: string
  ) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === progressId ? { ...m, step, stepMessage: message } : m
      )
    );
  };

  const postJson = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  };

  const handleSubmit = async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setLoading(true);
    shouldAutoScrollRef.current = true;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };

    const progressId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: progressId,
        role: "assistant",
        step: "validating",
        stepMessage: "Starting research...",
      },
    ]);

    try {
      updateProgress(progressId, "searching", "Finding official website...");
      const { companyName, website } = await postJson("/api/research/resolve", {
        query,
      });

      updateProgress(
        progressId,
        "crawling",
        `Crawling ${website} for key pages...`
      );
      const { pages, content } = await postJson("/api/research/crawl", {
        website,
      });

      updateProgress(
        progressId,
        "collecting",
        "Collecting additional public information..."
      );
      const { companyInfo, competitors } = await postJson(
        "/api/research/collect",
        { companyName, website, contentHint: content?.slice(0, 500) }
      );

      updateProgress(
        progressId,
        "analyzing",
        "AI is analyzing company data and identifying competitors..."
      );
      const { report } = await postJson("/api/research/analyze", {
        companyName,
        website,
        crawledContent: content,
        crawledPages: pages,
        companyInfo,
        competitors,
        model,
      });

      updateProgress(progressId, "generating", "Finalizing research report...");

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== progressId),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Research complete for ${report.companyName}. Here's your comprehensive report:`,
          report,
        },
      ]);
      await notifyDiscord(report);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== progressId),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: msg,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const showHero = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 md:px-8"
      >
        {showHero ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-POWERED INTELLIGENCE
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Know any company{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                in minutes
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-slate-400">
              Enter a company name or website URL to get AI-powered insights,
              competitor analysis, pain points, and a professional PDF report.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Microsoft", "Tesla", "stripe.com"].map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-400 transition hover:border-indigo-500/50 hover:text-indigo-300"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 pb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role !== "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                )}
                <div
                  className={`space-y-3 ${
                    msg.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-white"
                      : msg.report
                        ? "min-w-0 flex-1"
                        : "max-w-[85%]"
                  }`}
                >
                  {msg.role === "user" && (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  {msg.step && (
                    <ProgressSteps
                      currentStep={msg.step}
                      message={msg.stepMessage}
                    />
                  )}
                  {msg.content && msg.role === "assistant" && !msg.report && (
                    <p
                      className={`text-sm ${
                        msg.error ? "text-red-400" : "text-slate-300"
                      }`}
                    >
                      {msg.content}
                    </p>
                  )}
                  {msg.report && (
                    <>
                      {msg.content && (
                        <p className="text-sm text-slate-300">{msg.content}</p>
                      )}
                      <ReportCard
                        report={msg.report}
                        onDownload={() => downloadPdf(msg.report!)}
                        downloading={downloading}
                      />
                    </>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-800 bg-slate-900/80 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-2xl border border-slate-700 bg-slate-800/60 shadow-lg">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter company name or website URL..."
              rows={1}
              disabled={loading}
              className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm text-slate-200 outline-none placeholder:text-slate-500 disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="absolute bottom-2.5 right-2.5 rounded-xl bg-indigo-600 p-2.5 text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-600">
            ENTER TO RESEARCH · SHIFT+ENTER FOR NEW LINE
          </p>
        </div>
      </div>
    </div>
  );
}
