"use client";

import { useEffect, useState } from "react";
import { Cpu, Database, HardDrive, ShieldCheck } from "lucide-react";
import { fetchHealth, HealthResponse } from "@/lib/api";

export default function StatusIndicator() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setHealth(h);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const aiReady = health?.local_ai?.connected ?? true;
  const mossReady = true;

  return (
    <div className="flex items-center gap-2.5 text-[11px] font-mono">
      {/* Local Mode Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080D12] border border-[#17232D] text-[#94A3B8]">
        <span className="w-2 h-2 rounded-full bg-[#32D583] animate-pulse shadow-[0_0_8px_rgba(50,213,131,0.5)]" />
        <span className="font-medium text-[#F5F9FC]">Local Mode</span>
      </div>

      {/* Local AI Status */}
      <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080D12] border border-[#17232D]">
        <Cpu className="w-3 h-3 text-[#22B8FF]" />
        <span className="text-[#64748B]">AI:</span>
        <span className="text-[#F5F9FC] font-medium">{health?.local_ai?.model || "qwen2.5:0.5b"}</span>
      </div>
    </div>
  );
}
