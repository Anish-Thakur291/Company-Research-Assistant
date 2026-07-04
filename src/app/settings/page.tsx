"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageSquare, Save, XCircle } from "lucide-react";
import { ConfigStatus } from "@/components/ConfigStatus";
import type { ApplicantSettings } from "@/types";

const STORAGE_KEY = "company-research-applicant";

export default function SettingsPage() {
  const [applicant, setApplicant] = useState<ApplicantSettings>({
    applicantName: "",
    applicantEmail: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setApplicant(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applicant));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Research
        </Link>

        <h1 className="text-2xl font-bold text-white">Discord Integration</h1>
        <p className="mt-2 text-sm text-slate-400">
          Configure applicant details and verify Discord server settings.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              <MessageSquare className="h-4 w-4" />
              Server Environment
            </h2>
            <ConfigStatus />
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                DISCORD_BOT_TOKEN — set in Vercel environment variables
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                DISCORD_CHANNEL_ID — set in Vercel environment variables
              </p>
              <p className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 text-slate-600" />
                Tokens are never stored in the browser for security
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Applicant Details
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              These details are included when reports are automatically sent to Discord.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Applicant Name"
                value={applicant.applicantName}
                onChange={(e) =>
                  setApplicant((p) => ({ ...p, applicantName: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
              <input
                type="email"
                placeholder="Applicant Email Address"
                value={applicant.applicantEmail}
                onChange={(e) =>
                  setApplicant((p) => ({ ...p, applicantEmail: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
              <button
                onClick={save}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Save className="h-4 w-4" />
                {saved ? "Configuration Saved!" : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
