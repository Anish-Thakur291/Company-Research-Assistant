"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigStatus {
  openrouter: boolean;
  serper: boolean;
}

export function ConfigStatus() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setConfig({ openrouter: !!data.openrouter, serper: !!data.serper }))
      .catch(() => setConfig({ openrouter: false, serper: false }));
  }, []);

  if (!config) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking configuration...
      </div>
    );
  }

  const items = [
    { label: "OpenRouter", ok: config.openrouter },
    { label: "Serper.dev", ok: config.serper },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        Server Configuration
      </p>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          {item.ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400" />
          )}
          <span className={cn(item.ok ? "text-slate-300" : "text-slate-500")}>
            {item.label}
          </span>
          <span className={cn("ml-auto text-xs", item.ok ? "text-emerald-500" : "text-red-400")}>
            {item.ok ? "Ready" : "Missing"}
          </span>
        </div>
      ))}
    </div>
  );
}
