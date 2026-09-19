"use client";

import { useState } from "react";
import { Sparkles, Layers, ShieldCheck, Cpu, Database, Copy, Check } from "lucide-react";
import { QueryResponse } from "@/lib/api";
import SourceList from "./SourceList";
import PipelineInspector from "./PipelineInspector";
import UnifiedFileViewer from "./UnifiedFileViewer";

interface AnswerPanelProps {
  data: QueryResponse;
  question: string;
}

export default function AnswerPanel({ data, question }: AnswerPanelProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const routingMode = data.routing?.mode || "DIRECT";

  const handleCopy = () => {
    navigator.clipboard.writeText(data.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl bg-[#080D12] border border-[#17232D] p-6 md:p-8 shadow-2xl transition-all animate-fadeIn mt-6">
      {/* Eyebrow & Question */}
      <div className="pb-4 border-b border-[#17232D] mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] font-mono">
            LOCAL INTELLIGENCE RESPONSE
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-[#0E1620] border border-[#17232D] text-[#22B8FF] font-semibold">
              ROUTE: {routingMode}
            </span>
            {data.localAI && (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0E1620] border border-[#17232D] text-[#F5F9FC]">
                AI: {data.localAI.model} · {data.localAI.latencyMs}ms
              </span>
            )}
            {data.moss?.used && (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#0E1620] border border-[#17232D] text-[#32D583]">
                MOSS: {data.moss.passages} passages · {data.moss.latencyMs}ms
              </span>
            )}
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-semibold text-[#F5F9FC] font-sans">
          {question}
        </h2>
      </div>

      {/* Answer Content */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#0E1620] border border-[#17232D] flex items-center justify-center text-[#22B8FF]">
              <Sparkles className="w-3 h-3 text-[#22B8FF]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#22B8FF] font-mono">
              ANSWER
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-mono text-[#94A3B8] hover:text-[#22B8FF] transition-colors px-2 py-1 rounded bg-[#0E1620] border border-[#17232D]"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#32D583]" />
                <span className="text-[#32D583]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="text-sm md:text-base text-[#E2E8F0] leading-relaxed whitespace-pre-wrap font-sans bg-[#05080C] p-4 rounded-xl border border-[#17232D]/60">
          {data.answer}
        </div>
      </div>

      {/* Accessed Files badges */}
      {data.accessedFiles && data.accessedFiles.length > 0 && (
        <div className="mb-6 p-3 rounded-xl bg-[#05080C] border border-[#17232D]">
          <span className="text-[10px] uppercase font-mono text-[#64748B] block mb-2 font-bold tracking-wider">
            OFFLINE FILES ACCESSED
          </span>
          <div className="flex flex-wrap gap-2">
            {data.accessedFiles.map((af, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080D12] border border-[#17232D] text-xs text-[#F5F9FC] font-mono"
              >
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0E1620] text-[#22B8FF] font-bold">
                  {af.action}
                </span>
                <span>{af.filename}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Local Sources (Only shown when local files were retrieved) */}
      {data.sources && data.sources.length > 0 && (
        <SourceList
          sources={data.sources}
          onSelectFile={(id) => setSelectedFileId(id)}
        />
      )}

      {/* Real Pipeline Telemetry Inspector */}
      <PipelineInspector data={data} question={question} />

      {/* In-Browser File Viewer Modal */}
      {selectedFileId && (
        <UnifiedFileViewer
          fileId={selectedFileId}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </div>
  );
}
