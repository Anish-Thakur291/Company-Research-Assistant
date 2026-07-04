"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Settings,
  Sparkles,
  X,
  Menu,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfigStatus } from "./ConfigStatus";
import { ModelSelector } from "./ModelSelector";
import type { ApplicantSettings } from "@/types";

const STORAGE_KEY = "company-research-applicant";

interface SidebarProps {
  model: string;
  onModelChange: (model: string) => void;
  researchDisabled?: boolean;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({
  model,
  onModelChange,
  researchDisabled,
  open,
  onClose,
}: SidebarProps) {
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

  const saveApplicant = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applicant));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Search className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Research AI</p>
            <p className="text-xs text-slate-500">Company Intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <ConfigStatus />
        <ModelSelector
          value={model}
          onChange={onModelChange}
          disabled={researchDisabled}
        />

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Applicant Details
          </p>
          <input
            type="text"
            placeholder="Applicant Name"
            value={applicant.applicantName}
            onChange={(e) =>
              setApplicant((p) => ({ ...p, applicantName: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
          />
          <input
            type="email"
            placeholder="Applicant Email"
            value={applicant.applicantEmail}
            onChange={(e) =>
              setApplicant((p) => ({ ...p, applicantEmail: e.target.value }))
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
          />
          <button
            onClick={saveApplicant}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-600"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save Configuration"}
          </button>
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Powered by OpenRouter & Serper
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-900/50 lg:block">
        {content}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 shadow-2xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
      )}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export function getApplicantSettings(): ApplicantSettings {
  if (typeof window === "undefined") {
    return { applicantName: "", applicantEmail: "" };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { applicantName: "", applicantEmail: "" };
  } catch {
    return { applicantName: "", applicantEmail: "" };
  }
}
