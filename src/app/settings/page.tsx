"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
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

        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Configure applicant details and verify server settings.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Server Environment
            </h2>
            <ConfigStatus />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Applicant Details
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              These details are stored locally in your browser for report context.
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
