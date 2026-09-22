"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  FileText,
  ArrowLeftRight,
  Loader2,
  Cpu,
  Database,
  HardDrive,
  ChevronDown,
  Check
} from "lucide-react";
import {
  runQuery,
  QueryResponse,
  fetchAiModels,
  selectAiModel,
  fetchHealth,
  HealthResponse
} from "@/lib/api";
import AnswerPanel from "./AnswerPanel";

export default function AskInterface() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"AUTO" | "FILES" | "COMPARE">("AUTO");
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<{
    response: QueryResponse;
    question: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Model selection
  const [models, setModels] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>("gemini-1.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Health / Status
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetchAiModels()
      .then((data) => {
        if (data.models && data.models.length > 0) {
          setModels(data.models);
          setActiveModel(data.active_model);
        }
      })
      .catch(() => {});

    fetchHealth()
      .then(setHealth)
      .catch(() => {});
  }, []);

  const handleModelChange = async (newModel: string) => {
    setActiveModel(newModel);
    setIsModelDropdownOpen(false);
    try {
      await selectAiModel(newModel);
    } catch (e) {
      console.error("Failed to change model:", e);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await runQuery(question.trim(), mode);
      setCurrentAnswer({ response: res, question: question.trim() });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process query on local AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleClick = (text: string) => {
    setQuestion(text);
    if (text.toLowerCase().includes("compare")) {
      setMode("COMPARE");
    } else if (text.toLowerCase().includes("dataset") || text.toLowerCase().includes("notes")) {
      setMode("FILES");
    } else {
      setMode("AUTO");
    }
  };

  const sampleQueries = [
    "What is React?",
    "Explain quantum computing",
    "Analyze my dataset.xlsx",
    "Compare two PDFs",
    "What do my notes say about machine learning?",
  ];

  return (
    <div className="w-full space-y-6">
      {/* Hero Headline strictly matching reference screenshot */}
      <div className="text-left pt-2 pb-1">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F5F9FC] font-sans">
          Your knowledge. <span className="text-[#22B8FF]">Ask anything.</span>
        </h1>
        <p className="text-sm sm:text-base text-[#94A3B8] mt-2">
          General AI, private retrieval, and local intelligence.
        </p>
      </div>

      {/* 2-Column Ask Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (8 cols): Prompt Input Card */}
        <div className="lg:col-span-8 flex flex-col">
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col justify-between rounded-2xl bg-[#080D12] border border-[#17232D] p-5 shadow-xl hover:border-[#1F3040] focus-within:border-[#22B8FF]/50 focus-within:shadow-[0_0_25px_rgba(34,184,255,0.12)] transition-all"
          >
            {/* Textarea */}
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask anything about your files or anything in general..."
              rows={4}
              className="w-full bg-transparent text-sm sm:text-base text-[#F5F9FC] placeholder-[#64748B] focus:outline-none resize-none leading-relaxed"
            />

            {/* Inner divider */}
            <div className="border-t border-[#17232D] my-3" />

            {/* Bottom Bar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Left: Source Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8] font-sans">Source:</span>
                <div className="flex items-center gap-1.5">
                  {/* AUTO */}
                  <button
                    type="button"
                    onClick={() => setMode("AUTO")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      mode === "AUTO"
                        ? "bg-[#0E2232] text-[#22B8FF] border border-[#22B8FF]/60 shadow-[0_0_10px_rgba(34,184,255,0.2)]"
                        : "bg-[#05080C] text-[#94A3B8] border border-[#17232D] hover:text-[#F5F9FC]"
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    </div>
                    <span>AUTO</span>
                  </button>

                  {/* FILES */}
                  <button
                    type="button"
                    onClick={() => setMode("FILES")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      mode === "FILES"
                        ? "bg-[#0E2232] text-[#22B8FF] border border-[#22B8FF]/60 shadow-[0_0_10px_rgba(34,184,255,0.2)]"
                        : "bg-[#05080C] text-[#94A3B8] border border-[#17232D] hover:text-[#F5F9FC]"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#22B8FF]" />
                    <span>FILES</span>
                  </button>

                  {/* COMPARE */}
                  <button
                    type="button"
                    onClick={() => setMode("COMPARE")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      mode === "COMPARE"
                        ? "bg-[#0E2232] text-[#22B8FF] border border-[#22B8FF]/60 shadow-[0_0_10px_rgba(34,184,255,0.2)]"
                        : "bg-[#05080C] text-[#94A3B8] border border-[#17232D] hover:text-[#F5F9FC]"
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#22B8FF]" />
                    <span>COMPARE</span>
                  </button>
                </div>

                {/* Model Selector Dropdown */}
                {models.length > 0 && (
                  <div className="relative ml-1">
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#05080C] border border-[#17232D] hover:border-[#22B8FF]/40 text-[11px] font-mono text-[#94A3B8] hover:text-[#F5F9FC] transition-all"
                    >
                      <Cpu className="w-3 h-3 text-[#22B8FF]" />
                      <span>{activeModel}</span>
                      <ChevronDown className="w-3 h-3 text-[#64748B]" />
                    </button>

                    {isModelDropdownOpen && (
                      <div className="absolute left-0 bottom-full mb-2 w-48 rounded-xl bg-[#080D12] border border-[#17232D] shadow-2xl p-1 z-50">
                        <span className="text-[10px] font-mono text-[#64748B] px-2.5 py-1 block uppercase font-semibold">
                          Installed Models
                        </span>
                        {models.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleModelChange(m)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                              m === activeModel
                                ? "bg-[#0E1620] text-[#22B8FF]"
                                : "text-[#94A3B8] hover:bg-[#05080C] hover:text-[#F5F9FC]"
                            }`}
                          >
                            <span>{m}</span>
                            {m === activeModel && <Check className="w-3 h-3 text-[#22B8FF]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Enter hint + Ask VEIL Button */}
              <div className="flex items-center gap-4">
                <span className="hidden sm:flex items-center gap-1 text-xs text-[#94A3B8] font-sans">
                  Press{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-[#0E1620] border border-[#17232D] text-[10px] text-[#F5F9FC] font-mono">
                    Enter
                  </kbd>{" "}
                  to ask
                </span>

                <button
                  type="submit"
                  disabled={!question.trim() || isLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#22B8FF] hover:bg-[#29C7FF] text-[#000000] font-semibold text-xs transition-all shadow-[0_0_16px_rgba(34,184,255,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reasoning...</span>
                    </>
                  ) : (
                    <>
                      <span>Ask VEIL</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column (4 cols): Local Status Card matching reference screenshot */}
        <div className="lg:col-span-4 rounded-2xl bg-[#080D12] border border-[#17232D] p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            {/* Row 1: Local AI */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#32D583] shadow-[0_0_8px_rgba(50,213,131,0.5)] shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#F5F9FC]">AI Engine</p>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    Gemini &middot; {activeModel}
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#32D583] font-medium">Ready</span>
            </div>

            {/* Row 2: Moss Retrieval */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#32D583] shadow-[0_0_8px_rgba(50,213,131,0.5)] shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#F5F9FC]">Moss Retrieval</p>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    Index loaded
                  </p>
                </div>
              </div>
              <span className="text-xs text-[#32D583] font-medium">Ready</span>
            </div>

            {/* Row 3: Storage */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#32D583] shadow-[0_0_8px_rgba(50,213,131,0.5)] shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-[#F5F9FC]">Storage</p>
                  <p className="text-xs text-[#94A3B8] font-mono">Local</p>
                </div>
              </div>
              <span className="text-xs text-[#32D583] font-medium">Ready</span>
            </div>
          </div>

          {/* Bottom text: Offline ready. No internet required. */}
          <div className="pt-4 border-t border-[#17232D] text-center">
            <p className="text-xs text-[#94A3B8]">
              Offline ready. No internet required.
            </p>
          </div>
        </div>
      </div>

      {/* Try asking: suggestion pills matching reference screenshot */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-[#94A3B8] mr-1">Try asking:</span>
        {sampleQueries.map((sq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSampleClick(sq)}
            className="px-3 py-1.5 rounded-full bg-[#080D12] border border-[#17232D] text-[#94A3B8] hover:text-[#F5F9FC] hover:border-[#22B8FF]/50 hover:bg-[#0E1620] transition-all"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#170A0A] border border-[#FF4444]/40 text-xs text-[#FF8888] font-mono">
          {errorMessage}
        </div>
      )}

      {/* Live Answer Panel */}
      {currentAnswer && (
        <div className="pt-2">
          <AnswerPanel
            data={currentAnswer.response}
            question={currentAnswer.question}
          />
        </div>
      )}
    </div>
  );
}
