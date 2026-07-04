"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Cpu } from "lucide-react";
import type { OpenRouterModel } from "@/lib/openrouter";

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        const list = data.models ?? [];
        setModels(list);
        if (list.length > 0 && !value) {
          const preferred =
            list.find((m: OpenRouterModel) => m.id === "openai/gpt-4o-mini") ??
            list[0];
          onChange(preferred.id);
        }
      })
      .catch(() => {
        setModels([{ id: "openai/gpt-4o-mini", name: "GPT-4o Mini" }]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        <Cpu className="h-3.5 w-3.5" />
        AI Model
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 pr-8 text-sm text-slate-200 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}
