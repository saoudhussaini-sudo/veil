"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Cpu, Database, Layers, CheckCircle2, XCircle } from "lucide-react";
import { QueryResponse } from "@/lib/api";

interface PipelineInspectorProps {
  data: QueryResponse;
  question: string;
}

export default function PipelineInspector({ data, question }: PipelineInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const routingMode = data.routing?.mode || "DIRECT";
  const isDirect = routingMode === "DIRECT";
  const mossUsed = data.moss?.used ?? !isDirect;
  const mossLatency = data.moss?.latencyMs;
  const aiLatency = data.localAI?.latencyMs ?? 0;
  const aiModel = data.localAI?.model || "veil-offline-v3";
  const aiProvider = data.localAI?.provider || "local-ai";
  const passagesCount = data.moss?.passages ?? 0;

  return (
    <div className="w-full mt-5 pt-4 border-t border-[#17232D]">
      {/* Telemetry Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-[#94A3B8] font-mono">
          {/* MOSS Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#080D12] border border-[#17232D]">
            <span className={`w-1.5 h-1.5 rounded-full ${mossUsed && passagesCount > 0 ? "bg-[#32D583]" : "bg-[#64748B]"}`} />
            <span className="text-[#64748B]">MOSS:</span>
            {mossUsed ? (
              passagesCount > 0 ? (
                <>
                  <span className="text-[#F5F9FC] font-semibold">{passagesCount} passages</span>
                  {mossLatency !== null && mossLatency !== undefined && (
                    <>
                      <span className="text-[#64748B]">·</span>
                      <span className="text-[#22B8FF] font-semibold">{mossLatency.toFixed(1)} ms</span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-[#94A3B8]">0 passages (no matches)</span>
              )
            ) : (
              <span className="text-[#64748B]">Not used</span>
            )}
          </div>

          {/* LOCAL AI Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#080D12] border border-[#17232D]">
            <Cpu className="w-3 h-3 text-[#22B8FF]" />
            <span className="text-[#64748B]">LOCAL AI:</span>
            <span className="text-[#F5F9FC] font-semibold truncate max-w-[150px]">{aiModel}</span>
            <span className="text-[#64748B]">·</span>
            <span className="text-[#22B8FF] font-semibold">{aiLatency.toFixed(1)} ms</span>
          </div>

          {/* ROUTE Badge */}
          <div className="px-2.5 py-0.5 rounded-lg bg-[#0A1722] border border-[#163044] text-[#22B8FF] font-mono text-[10px] font-semibold">
            {routingMode}
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-[#94A3B8] hover:text-[#22B8FF] flex items-center gap-1 transition-colors"
        >
          <span>{isOpen ? "Hide pipeline debug" : "Inspect pipeline"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Real Debug Panel */}
      {isOpen && (
        <div className="mt-3 p-5 rounded-2xl bg-[#080D12] border border-[#17232D] font-mono text-xs text-[#94A3B8] space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-[#17232D]">
            <span className="font-bold text-[#22B8FF] tracking-wider uppercase text-[11px]">
              LOCAL INTELLIGENCE PIPELINE DEBUG
            </span>
            <span className="text-[#64748B] text-[10px]">
              Query ID: {data.query_id?.slice(0, 8) || "local-call"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#05080C] border border-[#17232D]">
              <span className="text-[10px] text-[#64748B] block uppercase mb-1">QUERY</span>
              <span className="text-[#F5F9FC] truncate block">{question}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#05080C] border border-[#17232D]">
              <span className="text-[10px] text-[#64748B] block uppercase mb-1">ROUTING</span>
              <span className="text-[#22B8FF] font-bold block">{routingMode}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#05080C] border border-[#17232D]">
              <span className="text-[10px] text-[#64748B] block uppercase mb-1">MOSS RETRIEVAL</span>
              {mossUsed ? (
                <span className="text-[#F5F9FC] font-semibold block">
                  ✓ {passagesCount} passages ({mossLatency !== null && mossLatency !== undefined ? `${mossLatency.toFixed(2)} ms` : "in-process"})
                </span>
              ) : (
                <span className="text-[#64748B] block">Not used</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[#05080C] border border-[#17232D]">
              <span className="text-[10px] text-[#64748B] block uppercase mb-1">LOCAL AI INFERENCE</span>
              <span className="text-[#F5F9FC] font-semibold block">
                {aiProvider} · {aiLatency.toFixed(1)} ms
              </span>
            </div>
          </div>

          {data.accessedFiles && data.accessedFiles.length > 0 && (
            <div className="pt-2 border-t border-[#17232D]">
              <span className="text-[10px] text-[#64748B] uppercase block mb-1.5">
                LOCAL FILES ACCESSED ({data.accessedFiles.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {data.accessedFiles.map((af, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#05080C] border border-[#17232D] text-[#94A3B8] text-[11px]"
                  >
                    <span className="text-[#22B8FF]">●</span>
                    <span className="font-medium text-[#F5F9FC]">{af.filename}</span>
                    <span className="text-[10px] text-[#64748B] uppercase">[{af.action}]</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
