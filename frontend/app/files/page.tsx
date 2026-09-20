"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  X,
  Loader2,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FileSpreadsheet,
  FileQuestion,
  ExternalLink,
} from "lucide-react";
import {
  fetchFiles,
  uploadMultipleFiles,
  loadDemoFiles,
  fetchFilePreview,
  deleteFileItem,
  FileItem,
  FilePreviewResponse,
} from "@/lib/api";

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewData, setPreviewData] = useState<FilePreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    fetchFiles()
      .then((res) => {
        setFiles(res.files || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching files:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      await uploadMultipleFiles(fileList);
      loadData();
    } catch (err: any) {
      alert("Upload error: " + (err.message || "Failed to upload."));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleLoadDemo = async () => {
    setIsDemoLoading(true);
    try {
      await loadDemoFiles();
      loadData();
    } catch (err: any) {
      alert("Error loading demo files: " + err.message);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSelectFile = async (file: FileItem) => {
    setSelectedFile(file);
    setPreviewLoading(true);
    try {
      const p = await fetchFilePreview(file.id);
      setPreviewData(p);
    } catch (err) {
      console.error("Error loading preview:", err);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Remove this file and its indexed chunks from VEIL?")) return;
    try {
      await deleteFileItem(fileId);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setPreviewData(null);
      }
      loadData();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "—";
    const d = new Date(timestamp * 1000);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === ".pdf") return <FileText className="w-4 h-4 text-[#C9A45C]" />;
    if (e === ".csv" || e === ".xlsx")
      return <FileSpreadsheet className="w-4 h-4 text-[#32D583]" />;
    if (e === ".py" || e === ".ts" || e === ".js" || e === ".json")
      return <FileCode className="w-4 h-4 text-[#D8B46E]" />;
    return <FileText className="w-4 h-4 text-[#A6A6A0]" />;
  };

  const filteredFiles = files.filter(
    (f) =>
      (f.original_name || f.filename)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (f.file_ext || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#1A1A1A]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#C9A45C] uppercase">
              VEIL
            </span>
            <span className="text-[#666660]">/</span>
            <span className="text-[11px] font-mono tracking-widest text-[#A6A6A0] uppercase">
              FILES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
            Your knowledge, organized.
          </h1>
          <p className="text-sm text-[#A6A6A0]">
            Private local documents, datasets, and code indexed in Moss.
          </p>
        </div>

        {/* Demo Data Button */}
        <button
          onClick={handleLoadDemo}
          disabled={isDemoLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#1A1A1A] hover:border-[rgba(201,164,92,0.3)] text-[#A6A6A0] hover:text-[#F5F5F0] font-medium text-xs transition-all disabled:opacity-40 shrink-0"
        >
          {isDemoLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A45C]" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#C9A45C]" />
          )}
          <span>Load Demo Files</span>
        </button>
      </div>

      {/* Large Minimal Drop Area */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`p-10 sm:p-12 rounded-2xl border border-dashed transition-all text-center cursor-pointer group select-none ${
          dragActive
            ? "border-[#C9A45C] bg-[#111111] shadow-[0_0_24px_rgba(201,164,92,0.12)]"
            : "border-[#1A1A1A] bg-[#0D0D0D] hover:border-[rgba(201,164,92,0.3)] hover:bg-[#111111]"
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-[#111111] border border-[rgba(201,164,92,0.15)] flex items-center justify-center mx-auto mb-4 group-hover:border-[#C9A45C]/50 transition-colors">
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-[#C9A45C] animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-[#A6A6A0] group-hover:text-[#C9A45C] transition-colors" />
          )}
        </div>

        <h3 className="text-base font-semibold text-[#F5F5F0] tracking-tight">
          {isUploading ? "Indexing into Moss..." : "DROP FILES HERE"}
        </h3>
        <p className="text-xs text-[#A6A6A0] mt-1">or click to browse from device</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono text-[#666660]">
          <span className="px-2 py-0.5 rounded bg-[#090909] border border-[#1A1A1A]">PDF</span>
          <span className="px-2 py-0.5 rounded bg-[#090909] border border-[#1A1A1A]">DOCX</span>
          <span className="px-2 py-0.5 rounded bg-[#090909] border border-[#1A1A1A]">TXT</span>
          <span className="px-2 py-0.5 rounded bg-[#090909] border border-[#1A1A1A]">CSV</span>
          <span className="px-2 py-0.5 rounded bg-[#090909] border border-[#1A1A1A]">XLSX</span>
          <span className="px-2 py-0.5 rounded bg-[#090909] border border-[#1A1A1A]">MD</span>
        </div>
      </div>

      {/* Files List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#666660]">
              YOUR FILES
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#0D0D0D] border border-[rgba(201,164,92,0.15)] text-[10px] font-mono text-[#C9A45C]">
              {files.length}
            </span>
          </div>

          {/* Search filter */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#666660]" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090909] border border-[rgba(255,255,255,0.08)] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F5F5F0] placeholder-[#666660] focus:outline-none focus:border-[#C9A45C]/60"
            />
          </div>
        </div>

        {/* Minimal Table / List (Cards #0D0D0D with rgba(201,164,92,0.12) border) */}
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#666660] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#C9A45C]" />
            <span>Loading local index...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] text-center space-y-2">
            <p className="text-sm text-[#A6A6A0]">No files in your local workspace.</p>
            <p className="text-xs text-[#666660]">
              Drop documents above or click "Load Demo Files" to start.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] overflow-hidden divide-y divide-[#1A1A1A]">
            {filteredFiles.map((file) => {
              const isScanned =
                file.index_status === "scanned" ||
                file.processing_status?.includes("OCR");

              return (
                <div
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className="flex items-center justify-between gap-4 p-3.5 hover:bg-[#111111] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#090909] border border-[#1A1A1A] flex items-center justify-center shrink-0">
                      {getFileIcon(file.file_ext)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#F5F5F0] truncate group-hover:text-[#D8B46E] transition-colors">
                        {file.original_name || file.filename}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#666660] mt-0.5">
                        <span className="uppercase">{file.file_ext.replace(".", "") || "FILE"}</span>
                        <span>·</span>
                        <span>{formatSize(file.file_size)}</span>
                        <span>·</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Status and actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isScanned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono bg-[#C9A45C]/10 text-[#C9A45C] border border-[#C9A45C]/25">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="hidden sm:inline">OCR Required</span>
                      </span>
                    ) : file.index_status === "indexed" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Indexed</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#A6A6A0]">
                        {file.processing_status || "Ready"}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className="p-1.5 rounded-lg text-[#666660] hover:text-[#FF5C67] hover:bg-[#FF5C67]/10 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-out File Detail Drawer */}
      {selectedFile && (
        <div
          onClick={() => setSelectedFile(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:w-[480px] h-full bg-[#080808] border-l border-[#1A1A1A] flex flex-col z-50 animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-[#1A1A1A]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#C9A45C] shrink-0" />
                <h3 className="text-sm font-semibold text-[#F5F5F0] truncate">
                  {selectedFile.original_name || selectedFile.filename}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A6A6A0] hover:text-[#F5F5F0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)] space-y-1">
                  <span className="text-[10px] font-mono text-[#666660] uppercase">Size</span>
                  <p className="text-xs font-mono font-medium text-[#F5F5F0]">
                    {formatSize(selectedFile.file_size)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)] space-y-1">
                  <span className="text-[10px] font-mono text-[#666660] uppercase">Format</span>
                  <p className="text-xs font-mono font-medium text-[#F5F5F0]">
                    {selectedFile.file_ext?.toUpperCase() || "UNKNOWN"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)] space-y-1">
                  <span className="text-[10px] font-mono text-[#666660] uppercase">Chunks</span>
                  <p className="text-xs font-mono font-medium text-[#C9A45C]">
                    {selectedFile.chunk_count || 0} indexed
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)] space-y-1">
                  <span className="text-[10px] font-mono text-[#666660] uppercase">Status</span>
                  <p className="text-xs font-mono font-medium text-[#32D583]">
                    {selectedFile.index_status || "Ready"}
                  </p>
                </div>
              </div>

              {/* Scanned warning if detected */}
              {(selectedFile.index_status === "scanned" ||
                selectedFile.processing_status?.includes("OCR")) && (
                <div className="p-3.5 rounded-xl bg-[#C9A45C]/10 border border-[#C9A45C]/30 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#C9A45C]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Scanned Document</span>
                  </div>
                  <p className="text-[11px] text-[#C9A45C]/80 leading-relaxed">
                    Text extraction requires OCR. This file is preserved in storage but excluded from semantic retrieval.
                  </p>
                </div>
              )}

              {/* Extracted Text Preview */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#666660]">
                  Extracted Text Preview
                </span>
                {previewLoading ? (
                  <div className="p-8 text-center text-xs font-mono text-[#666660] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C9A45C]" />
                    <span>Loading preview...</span>
                  </div>
                ) : previewData?.extracted_text_preview ? (
                  <div className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] max-h-72 overflow-y-auto">
                    <pre className="text-xs font-mono text-[#A6A6A0] whitespace-pre-wrap leading-relaxed">
                      {previewData.extracted_text_preview}
                    </pre>
                  </div>
                ) : (
                  <p className="text-xs text-[#666660] italic">
                    No text preview available for this document.
                  </p>
                )}
              </div>
            </div>

            {/* Drawer Actions Footer */}
            <div className="p-4 border-t border-[#1A1A1A] flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteFile(selectedFile.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FF5C67]/10 hover:bg-[#FF5C67]/20 border border-[#FF5C67]/30 text-xs font-medium text-[#FF5C67] transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete File</span>
              </button>

              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#1A1A1A] text-xs font-medium text-[#F5F5F0] transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
