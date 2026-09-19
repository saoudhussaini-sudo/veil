"use client";

import { useState } from "react";
import {
  FileText,
  Table,
  FileCode,
  Image as ImageIcon,
  Archive,
  Trash2,
  Eye,
  CheckCircle2,
  Clock
} from "lucide-react";
import { FileItem, deleteFileItem } from "@/lib/api";
import UnifiedFileViewer from "./UnifiedFileViewer";

interface FileListProps {
  files: FileItem[];
  onRefresh: () => void;
}

export default function FileList({ files, onRefresh }: FileListProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}" from your workspace?`)) return;
    try {
      await deleteFileItem(id);
      onRefresh();
    } catch (err: any) {
      alert("Error deleting file: " + err.message);
    }
  };

  const getFileIcon = (previewType: string) => {
    switch (previewType) {
      case "table":
        return <Table className="w-4 h-4 text-[#32D583]" />;
      case "code":
      case "json":
        return <FileCode className="w-4 h-4 text-[#22B8FF]" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-[#29C7FF]" />;
      case "archive":
        return <Archive className="w-4 h-4 text-[#FF7777]" />;
      default:
        return <FileText className="w-4 h-4 text-[#22B8FF]" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatLastAccessed = (ts?: number) => {
    if (!ts) return "Not accessed";
    const elapsed = Math.max(0, Math.floor(Date.now() / 1000 - ts));
    if (elapsed < 60) return `${elapsed}s ago`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
    if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
    return `${Math.floor(elapsed / 86400)}d ago`;
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-[#080D12] border border-[#17232D] divide-y divide-[#17232D] overflow-hidden shadow-xl">
        {/* Table Header */}
        <div className="px-6 py-3.5 bg-[#05080C] text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center justify-between font-mono">
          <span>File Name</span>
          <div className="flex items-center gap-8">
            <span className="hidden sm:inline">Type</span>
            <span>Size</span>
            <span>Status</span>
            <span className="hidden md:inline">Last Accessed</span>
            <span className="w-12 text-right">Actions</span>
          </div>
        </div>

        {/* Files List */}
        {files.length === 0 ? (
          <div className="py-20 text-center text-[#64748B] text-sm">
            <FileText className="w-10 h-10 mx-auto mb-3 text-[#17232D]" />
            <p className="text-[#94A3B8] font-medium">No files in your workspace yet.</p>
            <p className="text-xs text-[#64748B] mt-1">
              Upload local documents or click "Load Demo Knowledge".
            </p>
          </div>
        ) : (
          files.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFileId(f.id)}
              className="px-6 py-4 flex items-center justify-between hover:bg-[#0E1620] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center shrink-0 group-hover:border-[#22B8FF]/40 transition-colors">
                  {getFileIcon(f.preview_type)}
                </div>
                <div className="truncate">
                  <span className="text-sm font-medium text-[#F5F9FC] group-hover:text-[#22B8FF] transition-colors block truncate">
                    {f.original_name || f.filename}
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    {f.chunk_count} chunk{f.chunk_count === 1 ? "" : "s"} indexed
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-8 text-xs text-[#94A3B8] font-mono shrink-0">
                <span className="hidden sm:inline uppercase text-[10px] px-2 py-0.5 rounded-lg bg-[#0A1722] border border-[#163044] text-[#22B8FF]">
                  {f.file_ext || f.preview_type}
                </span>

                <span className="w-16 text-right">{formatSize(f.file_size)}</span>

                <span className="inline-flex items-center gap-1 text-[11px] text-[#32D583]">
                  <CheckCircle2 className="w-3 h-3 text-[#32D583]" />
                  <span className="hidden sm:inline">Ready</span>
                </span>

                <span className="hidden md:inline text-[11px] text-[#64748B] w-24 text-right">
                  {formatLastAccessed(f.last_accessed_at)}
                </span>

                <div className="w-12 flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => handleDelete(e, f.id, f.original_name || f.filename)}
                    title="Delete file"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#FF6666] hover:bg-[#201010] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
