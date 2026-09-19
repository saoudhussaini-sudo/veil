"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Table,
  FileCode,
  Image as ImageIcon,
  Archive,
  Trash2,
  Eye,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { FileItem, uploadMultipleFiles, loadDemoFiles, deleteFileItem } from "@/lib/api";
import UnifiedFileViewer from "./UnifiedFileViewer";

interface FileManagerProps {
  files: FileItem[];
  onRefresh: () => void;
}

export default function FileManager({ files, onRefresh }: FileManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    setUploadStatus("Extracting content and indexing with Moss...");

    try {
      await uploadMultipleFiles(fileList);
      setUploadStatus("Ready.");
      setTimeout(() => setUploadStatus(null), 2000);
      onRefresh();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    try {
      await loadDemoFiles();
      onRefresh();
    } catch (err: any) {
      alert("Error loading demo knowledge files: " + err.message);
    } finally {
      setIsDemoLoading(false);
    }
  };

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

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (previewType: string) => {
    switch (previewType) {
      case "pdf":
        return <FileText className="w-4 h-4 text-[#FF5555]" />;
      case "table":
        return <Table className="w-4 h-4 text-[#32D583]" />;
      case "code":
        return <FileCode className="w-4 h-4 text-[#22B8FF]" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-[#29C7FF]" />;
      case "archive":
        return <Archive className="w-4 h-4 text-[#D888FF]" />;
      default:
        return <FileText className="w-4 h-4 text-[#22B8FF]" />;
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="p-6 rounded-2xl bg-[#080D12] border border-[#17232D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#22B8FF] font-bold block mb-1 font-mono">
            LOCAL KNOWLEDGE & FILE REPOSITORY
          </span>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-[#F5F9FC] font-sans">
              {files.length} {files.length === 1 ? "file" : "files"}
            </h3>
            <span className="text-[#64748B]">·</span>
            <span className="text-sm text-[#94A3B8]">
              {files.filter((f) => f.is_searchable).length} searchable in Moss
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleLoadDemo}
            disabled={isDemoLoading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#05080C] text-[#22B8FF] border border-[#163044] hover:bg-[#0E1620] hover:border-[#22B8FF]/40 transition-colors"
          >
            {isDemoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Load Demo Knowledge</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#22B8FF] text-[#000000] hover:bg-[#29C7FF] transition-colors shadow-[0_0_12px_rgba(34,184,255,0.25)]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Add Files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`p-6 rounded-2xl border border-dashed transition-all text-center cursor-pointer ${
          isDragging
            ? "border-[#22B8FF] bg-[#0E2232]/30"
            : "border-[#17232D] bg-[#080D12] hover:border-[#22B8FF]/50 hover:bg-[#0E1620]"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-6 h-6 mx-auto mb-2 text-[#22B8FF]" />
        <p className="text-sm font-medium text-[#94A3B8]">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-[#64748B] mt-1 font-mono">
          Supports PDF, DOCX, XLSX, CSV, JSON, Code, Markdown, Images, and Archives
        </p>
      </div>

      {/* Upload Status Toast */}
      {uploadStatus && (
        <div className="px-4 py-2.5 rounded-xl bg-[#080D12] border border-[#22B8FF]/40 text-xs text-[#22B8FF] flex items-center gap-2 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Files List Table */}
      <div className="rounded-2xl bg-[#080D12] border border-[#17232D] divide-y divide-[#17232D] overflow-hidden shadow-xl">
        <div className="px-6 py-3.5 bg-[#05080C] text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center justify-between font-mono">
          <span>File Name</span>
          <div className="flex items-center gap-8">
            <span>Size</span>
            <span>Status</span>
            <span className="w-16 text-right">Actions</span>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="py-20 text-center text-[#64748B] text-sm">
            <FileText className="w-10 h-10 mx-auto mb-3 text-[#17232D]" />
            <p className="text-[#94A3B8] font-medium">No files uploaded yet.</p>
            <p className="text-xs text-[#64748B] mt-1">
              Add your private files or click "Load Demo Knowledge" to explore.
            </p>
          </div>
        ) : (
          files.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFileId(f.id)}
              className="px-6 py-4 flex items-center justify-between hover:bg-[#0E1620] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center">
                  {getFileIcon(f.preview_type)}
                </div>
                <div>
                  <span className="text-sm font-medium text-[#F5F9FC] group-hover:text-[#22B8FF] transition-colors block">
                    {f.original_name || f.filename}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-0.5">
                    <span className="uppercase px-1.5 py-0.5 rounded-lg bg-[#0A1722] border border-[#163044] text-[#22B8FF]">
                      {f.file_ext.replace(".", "") || f.preview_type}
                    </span>
                    <span>{f.is_searchable ? "Searchable in Moss" : "Preview stored"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 text-xs font-mono">
                <span className="text-[#94A3B8]">{formatSize(f.file_size)}</span>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A2016] border border-[#32D583]/30 text-xs text-[#32D583]">
                  <CheckCircle2 className="w-3 h-3 text-[#32D583]" />
                  <span>{f.index_status || "Indexed"}</span>
                </div>

                <div className="w-16 flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFileId(f.id);
                    }}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#22B8FF] hover:bg-[#0E2232] transition-colors"
                    title="View file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, f.id, f.original_name || f.filename)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#FF5555] hover:bg-[#201010] transition-colors"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-Browser Unified File Viewer Modal */}
      {selectedFileId && (
        <UnifiedFileViewer
          fileId={selectedFileId}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </div>
  );
}
