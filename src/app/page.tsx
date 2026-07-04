"use client";

import { useState } from "react";
import { Sidebar, SidebarToggle } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar
        model={model}
        onModelChange={setModel}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <SidebarToggle onClick={() => setSidebarOpen(true)} />
          <div>
            <p className="text-sm font-semibold text-white">Company Research</p>
            <p className="text-xs text-emerald-400">● LIVE</p>
          </div>
        </header>

        <ChatInterface model={model} />
      </main>
    </div>
  );
}
