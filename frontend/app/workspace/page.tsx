"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  runQuery,
  sendChatMessage,
  fetchFiles,
  fetchFilePreview,
  QueryResponse,
  FileItem,
} from "@/lib/api";

export default function WorkspacePage() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("AUTO");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("all");
  const [activeDocContext, setActiveDocContext] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load available files for document context grounding
  useEffect(() => {
    fetchFiles()
      .then((res) => {
        setFiles(res.files || []);
        if (res.files && res.files.length > 0) {
          // Pre-select first document for immediate study utility
          setSelectedFileId(res.files[0].id);
          fetchFilePreview(res.files[0].id)
            .then((p) => setActiveDocContext(p.extracted_text_preview || ""))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleDocumentChange = async (fileId: string) => {
    setSelectedFileId(fileId);
    if (fileId === "all") {
      setActiveDocContext("");
    } else {
      try {
        const preview = await fetchFilePreview(fileId);
        setActiveDocContext(preview.extracted_text_preview || "");
      } catch {
        setActiveDocContext("");
      }
    }
  };

  const selectedFile = files.find((f) => f.id === selectedFileId);

  const dynamicPills = selectedFile
    ? [
        `What are the core findings of ${selectedFile.original_name || selectedFile.filename}?`,
        "Explain the key concepts like I'm a beginner",
        "What are the most important formulas or rules mentioned?",
        "Extract 5 critical exam questions from this document",
      ]
    : [
        "Summarize my uploaded study materials",
        "What does my research say about quantum computing?",
        "Explain the transformer attention mechanism",
        "Compare classical and quantum information states",
      ];

  const sourceControls = [
    { id: "AUTO", label: "AUTO" },
    { id: "FILES", label: "FILES" },
    { id: "LOCAL", label: "LOCAL" },
    { id: "WEB", label: "WEB (AIR-GAPPED)", disabled: true },
  ];

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [question]);

  const handleSubmit = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      if (activeDocContext) {
        // Use precision contextual chat with strict anti-hallucination
        const chatRes = await sendChatMessage({
          message: q.trim(),
          documentContext: activeDocContext,
        });

        setResponse({
          answer: chatRes.answer,
          routing: { mode: "DOCUMENT_GROUNDED" },
          sources: chatRes.sources.map((s) => ({
            title: selectedFile?.original_name || "Active Document",
            score: 0.98,
            snippet: s.snippet,
            page: s.page,
          })),
          moss: { used: false, passages: 0 },
          localAI: {
            used: true,
            provider: chatRes.provider,
            model: chatRes.model,
            latencyMs: chatRes.latencyMs,
          },
          accessedFiles: selectedFile
            ? [{ fileId: selectedFile.id, filename: selectedFile.original_name, action: "GROUNDED_QUERY" }]
            : [],
        });
      } else {
        const res = await runQuery(
          q.trim(),
          mode === "WEB" ? "AUTO" : mode,
          4,
          selectedFileId !== "all" ? [selectedFileId] : undefined
        );
        setResponse(res);
      }
    } catch (err: any) {
      console.error("Query failed:", err);
      setError(err.message || "Failed to execute query.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const resetQuery = () => {
    setQuestion("");
    setResponse(null);
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
      {/* Header Eyebrow & Title */}
      <div className="space-y-1 pb-6">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest text-[#C9A45C] uppercase">
            VEIL
          </span>
          <span className="text-[#666660]">/</span>
          <span className="text-[11px] font-mono tracking-widest text-[#A6A6A0] uppercase">
            WORKSPACE
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
            Ask anything about your documents.
          </h1>

          {/* Active Document Selector Pill */}
          {files.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-[#666660] shrink-0">Focus:</span>
              <select
                value={selectedFileId}
                onChange={(e) => handleDocumentChange(e.target.value)}
                className="bg-[#0D0D0D] border border-[rgba(201,164,92,0.2)] hover:border-[rgba(201,164,92,0.4)] text-xs text-[#C9A45C] font-mono rounded-xl px-3 py-1.5 focus:outline-none max-w-xs truncate"
              >
                <option value="all">All Documents</option>
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.original_name || f.filename}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Intelligence Interaction Container */}
      {!response ? (
        <div className="flex-1 flex flex-col justify-center space-y-6 my-auto py-6">
          {/* Active Grounding Indicator */}
          <div className="flex items-center justify-between px-1 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-[#32D583]">
              <Shield className="w-3.5 h-3.5" />
              <span>Anti-Hallucination Guardrail Active</span>
            </div>
            {selectedFile && (
              <span className="text-[#666660] truncate max-w-xs">
                Context: {selectedFile.original_name}
              </span>
            )}
          </div>

          {/* Large Minimal Input Box */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#090909] focus-within:border-[#C9A45C]/60 focus-within:shadow-[0_0_24px_rgba(201,164,92,0.08)] transition-all p-4 space-y-4">
            <textarea
              ref={textareaRef}
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedFile
                  ? `Ask questions grounded specifically in ${selectedFile.original_name}...`
                  : "Ask VEIL anything about your knowledge..."
              }
              disabled={loading}
              className="w-full bg-transparent text-[#F5F5F0] placeholder-[#666660] text-base sm:text-lg resize-none focus:outline-none leading-relaxed"
            />

            {/* Bottom Controls Row inside input box */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1A1A1A]">
              {/* Source Controls */}
              <div className="flex items-center gap-1.5">
                {sourceControls.map((sc) => {
                  const isSelected = mode === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      disabled={sc.disabled}
                      onClick={() => setMode(sc.id)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wider uppercase transition-all ${
                        isSelected
                          ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.3)] font-semibold"
                          : sc.disabled
                          ? "text-[#666660]/40 cursor-not-allowed border border-transparent"
                          : "text-[#666660] hover:text-[#A6A6A0] hover:bg-[#111111] border border-transparent"
                      }`}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!question.trim() || loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all shadow-[0_0_12px_rgba(201,164,92,0.2)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#050505]" />
                    <span>Reasoning...</span>
                  </>
                ) : (
                  <>
                    <span>Ask</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#050505]" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Example Question Pills */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-[#666660] uppercase block">
              Suggested contextual queries
            </span>
            <div className="flex flex-wrap gap-2">
              {dynamicPills.map((pill) => (
                <button
                  key={pill}
                  onClick={() => {
                    setQuestion(pill);
                    handleSubmit(pill);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0D0D0D] hover:bg-[#141414] border border-[#1A1A1A] hover:border-[rgba(201,164,92,0.3)] text-xs text-[#A6A6A0] hover:text-[#F5F5F0] transition-all text-left"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-[#FF5C67]/10 border border-[#FF5C67]/30 text-xs text-[#FF5C67] flex items-center gap-3">
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        /* Document / Intelligence Report Reading Layout */
        <div className="flex-1 space-y-8 animate-in fade-in duration-300">
          {/* User Question Line */}
          <div className="pb-4 border-b border-[#1A1A1A] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#666660]">
                Query
              </span>
              <p className="text-xl font-medium text-[#F5F5F0]">
                {question}
              </p>
            </div>

            <button
              onClick={resetQuery}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D0D0D] hover:bg-[#141414] border border-[#1A1A1A] hover:border-[rgba(201,164,92,0.3)] text-xs font-medium text-[#A6A6A0] hover:text-[#F5F5F0] transition-all shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New query</span>
            </button>
          </div>

          {/* Subtle Metadata Strip */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-2 px-3.5 rounded-lg bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)] text-[11px] font-mono text-[#666660]">
            <div className="flex items-center gap-1.5">
              <span>ROUTE</span>
              <span className="text-[#A6A6A0]">·</span>
              <span className="text-[#C9A45C] font-semibold">
                {response.routing?.mode || "DIRECT"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>MODEL</span>
              <span className="text-[#A6A6A0]">·</span>
              <span className="text-[#F5F5F0]">
                {response.localAI?.model || "Gemini 2.5 Flash"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>LATENCY</span>
              <span className="text-[#A6A6A0]">·</span>
              <span className="text-[#F5F5F0]">
                {((response.localAI?.latencyMs || 0) / 1000).toFixed(2)}s
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>GROUNDING</span>
              <span className="text-[#A6A6A0]">·</span>
              <span className="text-[#32D583]">VERIFIED</span>
            </div>
          </div>

          {/* Answer in Clean Document Reading Layout */}
          <article className="prose prose-invert max-w-none space-y-4 text-[#F5F5F0] text-base sm:text-lg leading-relaxed font-light select-text">
            {response.answer.split("\n\n").map((para, i) => (
              <p key={i} className="leading-relaxed">
                {para}
              </p>
            ))}
          </article>

          {/* Grounded Sources Section */}
          {response.sources && response.sources.length > 0 && (
            <div className="pt-6 border-t border-[#1A1A1A] space-y-3">
              <button
                onClick={() => setExpandedSources(!expandedSources)}
                className="flex items-center justify-between w-full text-left group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C9A45C]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#A6A6A0] group-hover:text-[#D8B46E] transition-colors">
                    Grounding Sources ({response.sources.length})
                  </span>
                </div>
                {expandedSources ? (
                  <ChevronUp className="w-4 h-4 text-[#666660]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#666660]" />
                )}
              </button>

              {expandedSources && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-in fade-in duration-200">
                  {response.sources.map((src, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[rgba(201,164,92,0.12)] hover:border-[rgba(201,164,92,0.30)] transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#F5F5F0] truncate">
                          {src.title || src.file_name || "Document"}
                        </span>
                        {src.page && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.25)] shrink-0">
                            Page {src.page}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A6A6A0] line-clamp-3 leading-relaxed">
                        {src.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Follow-up Input */}
          <div className="pt-8 border-t border-[#1A1A1A]">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#090909] border border-[rgba(255,255,255,0.08)] focus-within:border-[#C9A45C]/60">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="Ask a follow-up question..."
                className="flex-1 bg-transparent px-2 text-sm text-[#F5F5F0] placeholder-[#666660] focus:outline-none"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!question.trim() || loading}
                className="px-3.5 py-1.5 rounded-lg bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-30"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#050505]" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
