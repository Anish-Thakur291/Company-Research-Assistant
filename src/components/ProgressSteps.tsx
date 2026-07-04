"use client";

import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchStep } from "@/types";

const STEPS: { key: ResearchStep; label: string }[] = [
  { key: "searching", label: "Searching" },
  { key: "crawling", label: "Crawling" },
  { key: "collecting", label: "Collecting" },
  { key: "analyzing", label: "Analyzing" },
  { key: "generating", label: "Generating" },
];

interface ProgressStepsProps {
  currentStep?: ResearchStep;
  message?: string;
}

const stepOrder: ResearchStep[] = [
  "validating",
  "searching",
  "crawling",
  "collecting",
  "analyzing",
  "generating",
  "complete",
];

export function ProgressSteps({ currentStep, message }: ProgressStepsProps) {
  const currentIndex = currentStep ? stepOrder.indexOf(currentStep) : -1;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
        <span className="text-sm font-medium text-slate-200">
          {message ?? "Research in progress..."}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step) => {
          const stepIndex = stepOrder.indexOf(step.key);
          const isDone = currentIndex > stepIndex;
          const isActive = currentStep === step.key;

          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
                isDone && "bg-emerald-500/15 text-emerald-400",
                isActive && "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40",
                !isDone && !isActive && "bg-slate-700/50 text-slate-500"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="h-3 w-3 rounded-full border border-slate-600" />
              )}
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
