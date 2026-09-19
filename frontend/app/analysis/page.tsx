"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  Upload,
  Layers,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  Tag,
  Zap,
} from "lucide-react";
import {
  fetchFiles,
  uploadMultipleFiles,
  runQuery,
  FileItem,
  QueryResponse,
} from "@/lib/api";

type AnalysisMode = "SUMMARIZE" | "EXTRACT" | "COMPARE" | "ANALYZE" | "QUESTION";

export default function AnalysisPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [mode, setMode] = useState<AnalysisMode>("SUMMARIZE");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles()
      .then((res) => {
        setFiles(res.files || []);
        if (res.files && res.files.length > 0) {
          // Default to first file for quick start
          setSelectedFile(res.files[0]);
        }
        setLoadingFiles(false);
      })
      .catch((err) => {
        console.error("Error loading files:", err);
        setLoadingFiles(false);
      });
  }, []);

  const modePrompts: Record<AnalysisMode, string> = {
    SUMMARIZE: "Provide a comprehensive structured summary with key takeaways and findings.",
    EXTRACT: "Extract all key entities, metrics, technical definitions, and concrete data points.",
    COMPARE: "Compare the key themes, differences, and structural elements within this knowledge.",
    ANALYZE: "Perform a deep qualitative and quantitative analysis of the content and methodologies.",
    QUESTION: "What are the core conclusions and actionable takeaways from this document?",
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      await uploadMultipleFiles(e.target.files);
      const res = await fetchFiles();
      setFiles(res.files || []);
      if (res.files && res.files.length > 0) {
        setSelectedFile(res.files[res.files.length - 1]);
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    }
  };

  const handleExecuteAnalysis = async () => {
    if (!selectedFile || isAnalyzing) return;
    setIsAnalyzing(true);
    setResult(null);

    const promptText =
      customPrompt.trim() ||
      `${modePrompts[mode]} File: ${selectedFile.original_name || selectedFile.filename}`;

    try {
      const res = await runQuery(
        promptText,
        "RETRIEVAL",
        4,
        [selectedFile.id]
      );
      setResult(res);
    } catch (err: any) {
      alert("Analysis failed: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const modes: { id: AnalysisMode; label: string }[] = [
    { id: "SUMMARIZE", label: "SUMMARIZE" },
    { id: "EXTRACT", label: "EXTRACT" },
    { id: "COMPARE", label: "COMPARE" },
    { id: "ANALYZE", label: "ANALYZE" },
    { id: "QUESTION", label: "QUESTION" },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[rgba(212,175,55,0.12)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#D4AF37] uppercase">
              ANALYSIS
            </span>
            <span className="text-[#666660]">/</span>
            <span className="text-[11px] font-mono tracking-widest text-[#A6A6A0] uppercase">
              SYNTHESIS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
            Turn your files into insight.
          </h1>
          <p className="text-sm text-[#A6A6A0]">
            Structured on-device extraction, document synthesis, and data reasoning.
          </p>
        </div>

        {/* Upload Dataset / Document */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0D0D0D] hover:bg-[#111111] border border-[rgba(212,175,55,0.12)] hover:border-[rgba(212,175,55,0.30)] text-[#A6A6A0] hover:text-[#F5F5F0] text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {modes.map((m) => {
          const isCurrent = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setCustomPrompt("");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wider transition-all ${
                isCurrent
                  ? "bg-[#111111] text-[#F0C75E] border border-[rgba(212,175,55,0.40)] shadow-[0_0_12px_rgba(212,175,55,0.12)] font-semibold"
                  : "bg-[#0D0D0D] text-[#A6A6A0] hover:text-[#F5F5F0] border border-[rgba(212,175,55,0.12)] hover:bg-[#111111]"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* 3-Column Analysis Workspace (Stacks vertically on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FILE / DATA (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666660]">
              FILE / DATA
            </span>
            <span className="text-[10px] font-mono text-[#D4AF37]">
              {files.length} indexed
            </span>
          </div>

          <div className="rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[#0D0D0D] p-3 space-y-2 max-h-96 overflow-y-auto">
            {loadingFiles ? (
              <div className="p-4 text-center text-xs font-mono text-[#666660] flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                <span>Loading files...</span>
              </div>
            ) : files.length === 0 ? (
              <p className="text-xs text-[#666660] p-3">No files available. Upload one above.</p>
            ) : (
              files.map((f) => {
                const isSelected = selectedFile?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFile(f);
                      setResult(null);
                    }}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-[#111111] border border-[rgba(212,175,55,0.40)] text-[#F5F5F0]"
                        : "hover:bg-[#111111] border border-transparent text-[#A6A6A0]"
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-[#D4AF37]" : "text-[#666660]"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {f.original_name || f.filename}
                      </p>
                      <p className="text-[10px] font-mono text-[#666660]">
                        {f.chunk_count || 1} chunks
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER COLUMN: ANALYSIS (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666660]">
              ANALYSIS EXECUTION
            </span>
            <span className="text-[10px] font-mono text-[#A6A6A0]">
              Mode: {mode}
            </span>
          </div>

          {/* Analysis Action Box */}
          <div className="p-4 rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[#0D0D0D] space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#A6A6A0] uppercase">
                Directive / Focus:
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={modePrompts[mode]}
                className="w-full bg-[#090909] border border-[rgba(255,255,255,0.08)] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-[#F5F5F0] placeholder-[#666660] focus:outline-none resize-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-[#666660] truncate max-w-xs">
                Target: {selectedFile?.original_name || selectedFile?.filename || "None"}
              </span>

              <button
                onClick={handleExecuteAnalysis}
                disabled={!selectedFile || isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#F0C75E] text-[#050505] font-semibold text-xs transition-all shadow-[0_0_12px_rgba(212,175,55,0.2)] disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#050505]" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#050505]" />
                    <span>Run {mode}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Output View */}
          {result ? (
            <div className="p-5 rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[#0D0D0D] space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(212,175,55,0.12)]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                  SYNTHESIS REPORT
                </span>
                <span className="text-[10px] font-mono text-[#666660]">
                  {((result.localAI?.latencyMs || 0) / 1000).toFixed(2)}s on-device
                </span>
              </div>

              <article className="prose prose-invert max-w-none text-xs sm:text-sm text-[#F5F5F0] leading-relaxed space-y-3 font-light">
                {result.answer.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </article>
            </div>
          ) : (
            <div className="p-10 rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[#0D0D0D]/50 text-center space-y-2">
              <p className="text-xs text-[#A6A6A0]">Select a file and click "Run {mode}"</p>
              <p className="text-[10px] text-[#666660]">
                Intelligence will be generated locally via Ollama with Moss retrieval grounding.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INSIGHTS (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666660] block">
            INSIGHTS & METRICS
          </span>

          <div className="rounded-2xl border border-[rgba(212,175,55,0.12)] bg-[#0D0D0D] p-4 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#666660] uppercase">
                Active Document
              </span>
              <p className="text-xs font-semibold text-[#F5F5F0] truncate">
                {selectedFile?.original_name || selectedFile?.filename || "None"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#666660] uppercase">
                Retrieval Engine
              </span>
              <p className="text-xs font-mono text-[#D4AF37]">
                {result?.moss?.passages || 0} chunks retrieved ({result?.moss?.latencyMs?.toFixed(1) || 0}ms)
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#666660] uppercase">
                Grounding Citations
              </span>
              {result?.sources && result.sources.length > 0 ? (
                <div className="space-y-1 pt-1">
                  {result.sources.map((s, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-[#090909] border border-[rgba(212,175,55,0.12)] text-[10px] font-mono text-[#A6A6A0] flex items-center justify-between"
                    >
                      <span className="truncate max-w-[120px]">{s.title}</span>
                      {s.page && <span className="text-[#D4AF37]">p.{s.page}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#666660] italic">
                  No citations active.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-[rgba(212,175,55,0.12)] space-y-1">
              <span className="text-[10px] font-mono text-[#666660] uppercase">
                Data Privacy
              </span>
              <p className="text-[11px] text-[#32D583] flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zero telemetry</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
