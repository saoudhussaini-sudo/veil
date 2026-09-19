"use client";

import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Download,
  Table,
  FileCode,
  Image as ImageIcon,
  Archive,
  AlertCircle,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import { FilePreviewResponse, fetchFilePreview } from "@/lib/api";

interface UnifiedFileViewerProps {
  fileId: string | null;
  onClose: () => void;
}

export default function UnifiedFileViewer({ fileId, onClose }: UnifiedFileViewerProps) {
  const [data, setData] = useState<FilePreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    fetchFilePreview(fileId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [fileId]);

  if (!fileId) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const file = data?.file;
  const previewType = data?.preview_type || "unsupported";
  const contentUrl = `/api/files/${fileId}/content`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[#080D12] border border-[#17232D] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#17232D] flex items-center justify-between bg-[#05080C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center text-[#22B8FF]">
              {previewType === "pdf" && <FileText className="w-4 h-4" />}
              {previewType === "table" && <Table className="w-4 h-4" />}
              {previewType === "code" && <FileCode className="w-4 h-4" />}
              {previewType === "image" && <ImageIcon className="w-4 h-4" />}
              {previewType === "archive" && <Archive className="w-4 h-4" />}
              {["text", "json", "unsupported"].includes(previewType) && <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F5F9FC] font-sans">
                {file?.original_name || file?.filename || "Document Viewer"}
              </h3>
              <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5">
                <span className="uppercase px-1.5 py-0.5 rounded-lg bg-[#0A1722] border border-[#163044] text-[#22B8FF] font-mono">
                  {file?.file_ext.replace(".", "") || previewType}
                </span>
                <span>{file ? formatSize(file.file_size) : ""}</span>
                <span>·</span>
                <span className="text-[#32D583]">Status: {file?.index_status || "Ready"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={contentUrl}
              download={file?.original_name || file?.filename}
              className="p-2 rounded-xl bg-[#080D12] border border-[#17232D] text-[#94A3B8] hover:text-[#22B8FF] hover:border-[#22B8FF]/40 transition-colors"
              title="Download original file"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#080D12] border border-[#17232D] text-[#94A3B8] hover:text-[#F5F9FC] hover:border-[#22B8FF]/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#080D12]">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-[#94A3B8] gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#22B8FF]" />
              <span className="text-xs font-mono">Loading file preview...</span>
            </div>
          ) : (
            <div>
              {/* 1. PDF Preview */}
              {previewType === "pdf" && (
                <div className="space-y-4">
                  <div className="w-full h-[550px] rounded-xl overflow-hidden border border-[#17232D] bg-[#05080C]">
                    <iframe
                      src={contentUrl}
                      className="w-full h-full border-none"
                      title="PDF Preview"
                    />
                  </div>
                  {data?.extracted_text_preview && (
                    <details className="mt-4 group">
                      <summary className="text-xs text-[#94A3B8] hover:text-[#22B8FF] cursor-pointer font-mono select-none">
                        View extracted text preview &darr;
                      </summary>
                      <div className="mt-2 p-4 rounded-xl bg-[#05080C] border border-[#17232D] font-mono text-xs text-[#94A3B8] max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {data.extracted_text_preview}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* 2. Image Preview */}
              {previewType === "image" && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="max-w-full max-h-[500px] rounded-xl overflow-hidden border border-[#17232D] bg-[#05080C] p-2">
                    <img
                      src={contentUrl}
                      alt={file?.filename}
                      className="max-h-[480px] max-w-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* 3. Table / Spreadsheet Preview */}
              {previewType === "table" && data?.preview_data && (
                <div className="space-y-3">
                  <div className="text-xs text-[#94A3B8] flex items-center justify-between">
                    <span>Spreadsheet Preview ({data.preview_data.total_preview_rows} rows displayed)</span>
                    {data.preview_data.sheet_name && (
                      <span className="text-[#22B8FF] font-mono text-[11px]">Sheet: {data.preview_data.sheet_name}</span>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#17232D] overflow-x-auto bg-[#05080C]">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr className="bg-[#080D12] border-b border-[#17232D] text-[#22B8FF]">
                          {data.preview_data.headers?.map((h: string, idx: number) => (
                            <th key={idx} className="px-4 py-2.5 font-semibold">
                              {h || `Col ${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#17232D]">
                        {data.preview_data.rows?.map((row: string[], rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-[#0E1620] transition-colors">
                            {row.map((cell: string, cIdx: number) => (
                              <td key={cIdx} className="px-4 py-2 text-[#94A3B8] whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. Code & Text Preview */}
              {["code", "text", "json"].includes(previewType) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Format: {previewType.toUpperCase()} ({data?.extracted_text_preview.split("\n").length} lines)</span>
                    <button
                      onClick={() => handleCopy(data?.extracted_text_preview || "")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#05080C] border border-[#17232D] hover:text-[#F5F9FC] hover:border-[#22B8FF]/40 transition-colors text-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#32D583]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy Text"}</span>
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-[#05080C] border border-[#17232D] overflow-x-auto">
                    <pre className="font-mono text-xs leading-relaxed text-[#94A3B8] whitespace-pre-wrap">
                      {data?.extracted_text_preview}
                    </pre>
                  </div>
                </div>
              )}

              {/* 5. Archive (ZIP) Preview */}
              {previewType === "archive" && data?.preview_data && (
                <div className="space-y-3">
                  <div className="text-xs text-[#94A3B8]">
                    Archive Contents ({data.preview_data.total_files} files inside)
                  </div>
                  <div className="p-4 rounded-xl bg-[#05080C] border border-[#17232D] divide-y divide-[#17232D]">
                    {data.preview_data.files?.map((fname: string, idx: number) => (
                      <div key={idx} className="py-2 text-xs font-mono text-[#94A3B8] flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#22B8FF]" />
                        <span>{fname}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Unsupported Binary Preview */}
              {previewType === "unsupported" && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0E2232] border border-[#16394F] flex items-center justify-center text-[#22B8FF]">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-[#F5F9FC]">
                      Preview Unavailable
                    </h4>
                    <p className="text-xs text-[#64748B] max-w-sm mt-1 leading-relaxed">
                      This is a binary or proprietary format. The file is preserved safely
                      in your workspace and can be downloaded anytime.
                    </p>
                  </div>
                  <a
                    href={contentUrl}
                    download={file?.original_name || file?.filename}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22B8FF] text-[#000000] text-xs font-semibold hover:bg-[#29C7FF] transition-colors shadow-[0_0_12px_rgba(34,184,255,0.25)]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
