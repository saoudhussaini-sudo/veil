"use client";

import { FileText } from "lucide-react";
import { SourceItem } from "@/lib/api";

interface SourceListProps {
  sources: SourceItem[];
  onSelectFile?: (fileId: string) => void;
}

export default function SourceList({ sources, onSelectFile }: SourceListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="pt-4 border-t border-[#17232D]">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2.5">
        <FileText className="w-3.5 h-3.5 text-[#22B8FF]" />
        <span>LOCAL SOURCES ({sources.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((src, idx) => (
          <button
            key={idx}
            onClick={() => src.file_id && onSelectFile?.(src.file_id)}
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080D12] border border-[#17232D] hover:border-[#22B8FF]/50 hover:bg-[#0E1620] transition-all text-left"
          >
            <FileText className="w-3 h-3 text-[#22B8FF]" />
            <span className="text-xs text-[#94A3B8] group-hover:text-[#F5F9FC] transition-colors font-medium">
              {src.title || src.file_name || "Document"}
            </span>
            {src.page ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#0E2232] text-[#22B8FF] font-mono border border-[#16394F] font-medium">
                Page {src.page}
              </span>
            ) : src.chunk_index !== undefined ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#05080C] text-[#64748B] font-mono border border-[#17232D]">
                p.{src.chunk_index + 1}
              </span>
            ) : null}
            <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[#0E2232] border border-[#163044] text-[#22B8FF] font-mono font-medium">
              {(src.score || 1.0).toFixed(2)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
