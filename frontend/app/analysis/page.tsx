"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  FileText,
  Upload,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  RefreshCw,
  HelpCircle,
  Award,
  BookOpen,
  Brain,
  Layers,
  Wand2,
  GraduationCap,
  ListChecks,
  FileQuestion,
  Lightbulb,
  Check,
  X,
  ArrowRight,
  Eye,
} from "lucide-react";
import {
  fetchFiles,
  uploadMultipleFiles,
  fetchFilePreview,
  runQuery,
  fetchSummary,
  generateQuiz,
  generateQA,
  generateFlashcards,
  runStudyTool,
  FileItem,
  QuizResponse,
  QuizQuestion,
  QAResponse,
  FlashcardsResponse,
  Flashcard,
  SummaryResponse,
} from "@/lib/api";

type SuiteTab =
  | "STUDY_MODE"
  | "SUMMARIES"
  | "QUIZ"
  | "EXAM_QA"
  | "FLASHCARDS"
  | "AI_TOOLS"
  | "SYNTHESIS";

type SummaryType = "quick" | "detailed" | "chapter" | "key_points" | "terms" | "tldr";
type QACategory = "all" | "short" | "long" | "important" | "conceptual";
type QuizDifficulty = "easy" | "medium" | "hard";
type ClassicMode = "SUMMARIZE" | "EXTRACT" | "COMPARE" | "ANALYZE" | "QUESTION";

const AI_TOOLS_LIST = [
  { id: "explain", label: "Deep Explain", desc: "Intuitive mental model & step-by-step breakdown" },
  { id: "simplify", label: "Simplify (ELI5)", desc: "Metaphors and plain language for beginners" },
  { id: "rewrite", label: "Rewrite Notes", desc: "Structured bullet points & formatted notes" },
  { id: "key_points", label: "Key Points", desc: "Top 10 high-impact takeaways" },
  { id: "examples", label: "Real Examples", desc: "Real-world analogies and application scenarios" },
  { id: "compare", label: "Compare Concepts", desc: "Markdown comparison table & key differences" },
  { id: "ask_why", label: "Ask Why", desc: "Underlying principles, origins, and motivation" },
  { id: "exam_mode", label: "Exam Mode", desc: "High-yield topics, trap questions & scoring tips" },
  { id: "notes_generator", label: "Cornell Notes", desc: "Cues, detailed notes, and consolidated summary" },
  { id: "revision_mode", label: "5-Min Revision", desc: "Rapid-fire bulleted recall prompts" },
  { id: "cheat_sheet", label: "Cheat Sheet", desc: "Ultra-dense 1-page formula & concept sheet" },
];

export default function AnalysisPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState<SuiteTab>("STUDY_MODE");
  const [documentText, setDocumentText] = useState<string>("");
  const [textLoading, setTextLoading] = useState(false);

  // Study Mode 4-Step state
  const [studyStep, setStudyStep] = useState<1 | 2 | 3 | 4>(1);

  // Summaries State
  const [summaryType, setSummaryType] = useState<SummaryType>("quick");
  const [summaryResult, setSummaryResult] = useState<SummaryResponse | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Quiz State
  const [quizDifficulty, setQuizDifficulty] = useState<QuizDifficulty>("medium");
  const [quizCount, setQuizCount] = useState<number>(5);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Exam QA State
  const [qaCategory, setQaCategory] = useState<QACategory>("all");
  const [qaData, setQaData] = useState<QAResponse | null>(null);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);

  // Flashcards State
  const [flashcardsData, setFlashcardsData] = useState<FlashcardsResponse | null>(null);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // AI Tools State
  const [selectedTool, setSelectedTool] = useState<string>("explain");
  const [toolTarget, setToolTarget] = useState<string>("");
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [isToolRunning, setIsToolRunning] = useState(false);

  // Classic Synthesis State
  const [classicMode, setClassicMode] = useState<ClassicMode>("SUMMARIZE");
  const [classicPrompt, setClassicPrompt] = useState("");
  const [classicResult, setClassicResult] = useState<string | null>(null);
  const [isClassicRunning, setIsClassicRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files on mount
  useEffect(() => {
    loadFilesList();
  }, []);

  const loadFilesList = () => {
    fetchFiles()
      .then((res) => {
        setFiles(res.files || []);
        if (res.files && res.files.length > 0) {
          setSelectedFile(res.files[0]);
          loadDocContent(res.files[0].id);
        }
        setLoadingFiles(false);
      })
      .catch((err) => {
        console.error("Error loading files:", err);
        setLoadingFiles(false);
      });
  };

  const loadDocContent = async (fileId: string) => {
    setTextLoading(true);
    try {
      const preview = await fetchFilePreview(fileId);
      const text = preview?.extracted_text_preview || "";
      setDocumentText(text);
    } catch (err) {
      console.warn("Could not load preview text for file", fileId);
      setDocumentText("");
    } finally {
      setTextLoading(false);
    }
  };

  const handleSelectFile = (file: FileItem) => {
    setSelectedFile(file);
    loadDocContent(file.id);
    // Reset state for new document
    setSummaryResult(null);
    setQuizData(null);
    setQuizSubmitted(false);
    setUserAnswers({});
    setQaData(null);
    setFlashcardsData(null);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setToolResult(null);
    setClassicResult(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      await uploadMultipleFiles(e.target.files);
      const res = await fetchFiles();
      setFiles(res.files || []);
      if (res.files && res.files.length > 0) {
        const newest = res.files[res.files.length - 1];
        setSelectedFile(newest);
        loadDocContent(newest.id);
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    }
  };

  /* ------------------- ACTIONS ------------------- */

  const handleGenerateSummary = async (type: SummaryType = summaryType) => {
    if (!selectedFile) return;
    setIsSummarizing(true);
    try {
      const res = await fetchSummary({
        fileId: selectedFile.id,
        content: documentText || `Document: ${selectedFile.original_name}`,
        type,
        filename: selectedFile.original_name || selectedFile.filename,
      });
      setSummaryResult(res);
    } catch (err: any) {
      alert("Summary generation failed: " + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) return;
    setIsGeneratingQuiz(true);
    setQuizSubmitted(false);
    setUserAnswers({});
    try {
      const res = await generateQuiz({
        fileId: selectedFile.id,
        content: documentText || `Document: ${selectedFile.original_name}`,
        difficulty: quizDifficulty,
        count: quizCount,
        filename: selectedFile.original_name || selectedFile.filename,
      });
      setQuizData(res);
    } catch (err: any) {
      alert("Quiz generation failed: " + err.message);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSelectQuizAnswer = (questionId: number, option: "A" | "B" | "C" | "D") => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = () => {
    if (!quizData) return;
    let score = 0;
    quizData.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        score += 1;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleGenerateQA = async (cat: QACategory = qaCategory) => {
    if (!selectedFile) return;
    setIsGeneratingQA(true);
    try {
      const res = await generateQA({
        fileId: selectedFile.id,
        content: documentText || `Document: ${selectedFile.original_name}`,
        category: cat,
        filename: selectedFile.original_name || selectedFile.filename,
      });
      setQaData(res);
    } catch (err: any) {
      alert("Q&A generation failed: " + err.message);
    } finally {
      setIsGeneratingQA(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedFile) return;
    setIsGeneratingCards(true);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    try {
      const res = await generateFlashcards({
        fileId: selectedFile.id,
        content: documentText || `Document: ${selectedFile.original_name}`,
        count: 10,
        filename: selectedFile.original_name || selectedFile.filename,
      });
      setFlashcardsData(res);
    } catch (err: any) {
      alert("Flashcard generation failed: " + err.message);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const handleRunTool = async (toolId: string) => {
    if (!selectedFile) return;
    setSelectedTool(toolId);
    setIsToolRunning(true);
    setToolResult(null);
    try {
      const res = await runStudyTool({
        tool: toolId,
        content: documentText || `Document: ${selectedFile.original_name}`,
        target: toolTarget,
        filename: selectedFile.original_name || selectedFile.filename,
      });
      setToolResult(res.result);
    } catch (err: any) {
      alert("AI Tool failed: " + err.message);
    } finally {
      setIsToolRunning(false);
    }
  };

  const handleRunClassic = async () => {
    if (!selectedFile) return;
    setIsClassicRunning(true);
    setClassicResult(null);
    try {
      const res = await runQuery(
        classicPrompt.trim() || `Analyze ${selectedFile.original_name} in ${classicMode} mode`,
        "RETRIEVAL",
        4,
        [selectedFile.id]
      );
      setClassicResult(res.answer);
    } catch (err: any) {
      alert("Execution failed: " + err.message);
    } finally {
      setIsClassicRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[rgba(201,164,92,0.12)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#C9A45C] uppercase">
              STUDY & ANALYSIS
            </span>
            <span className="text-[#666660]">/</span>
            <span className="text-[11px] font-mono tracking-widest text-[#A6A6A0] uppercase">
              GEMINI CLOUD SUITE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
            AI Document & Study Suite
          </h1>
          <p className="text-sm text-[#A6A6A0]">
            Systematic learning, structured summaries, interactive quizzes, 3D flashcards & precision exam tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0D0D0D] hover:bg-[#111111] border border-[rgba(201,164,92,0.12)] hover:border-[rgba(201,164,92,0.30)] text-[#A6A6A0] hover:text-[#F5F5F0] text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-[#C9A45C]" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Main Suite Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1A1A1A] pb-4">
        {[
          { id: "STUDY_MODE", label: "Study Mode (4-Step)", icon: GraduationCap },
          { id: "SUMMARIES", label: "Summaries (6 Types)", icon: BookOpen },
          { id: "QUIZ", label: "Interactive Quiz", icon: Award },
          { id: "EXAM_QA", label: "Exam Q&A", icon: FileQuestion },
          { id: "FLASHCARDS", label: "3D Flashcards", icon: Layers },
          { id: "AI_TOOLS", label: "11 AI Tools", icon: Wand2 },
          { id: "SYNTHESIS", label: "Custom Synthesis", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SuiteTab)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.40)] shadow-[0_0_12px_rgba(201,164,92,0.12)] font-semibold"
                  : "bg-[#0D0D0D] text-[#A6A6A0] hover:text-[#F5F5F0] border border-[rgba(201,164,92,0.12)] hover:bg-[#111111]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-[#C9A45C]" : "text-[#666660]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ACTIVE DOCUMENTS (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666660]">
              DOCUMENT SOURCE
            </span>
            <span className="text-[10px] font-mono text-[#C9A45C]">
              {files.length} available
            </span>
          </div>

          <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] p-3 space-y-2 max-h-[500px] overflow-y-auto">
            {loadingFiles ? (
              <div className="p-6 text-center text-xs font-mono text-[#666660] flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A45C]" />
                <span>Loading documents...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-[#A6A6A0]">No documents yet.</p>
                <p className="text-[10px] text-[#666660]">Upload a PDF or go to Files to load demo documents.</p>
              </div>
            ) : (
              files.map((f) => {
                const isSelected = selectedFile?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => handleSelectFile(f)}
                    className={`p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? "bg-[#1A160F] border border-[rgba(201,164,92,0.40)] text-[#F5F5F0]"
                        : "hover:bg-[#111111] border border-transparent text-[#A6A6A0]"
                    }`}
                  >
                    <FileText
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-[#C9A45C]" : "text-[#666660]"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {f.original_name || f.filename}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#666660] mt-0.5">
                        <span>{f.file_ext.toUpperCase()}</span>
                        <span>·</span>
                        <span>{f.chunk_count || 1} chunks</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER COLUMN: ACTIVE STUDY SUITE COMPONENT (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* TAB 1: STUDY MODE (4-Step Learning Path) */}
          {activeTab === "STUDY_MODE" && (
            <div className="space-y-6">
              {/* Step Navigation Indicator */}
              <div className="p-4 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#C9A45C]">
                    STUDY PATH: READ → UNDERSTAND → REVISE → TEST
                  </span>
                  <span className="text-[10px] font-mono text-[#A6A6A0]">
                    Step {studyStep} of 4
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { step: 1, label: "1. READ", desc: "Quick Overview" },
                    { step: 2, label: "2. UNDERSTAND", desc: "Key Points" },
                    { step: 3, label: "3. REVISE", desc: "Flashcards" },
                    { step: 4, label: "4. TEST", desc: "Take Quiz" },
                  ].map((s) => (
                    <button
                      key={s.step}
                      onClick={() => setStudyStep(s.step as any)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        studyStep === s.step
                          ? "bg-[#1A160F] border-[rgba(201,164,92,0.40)] text-[#C9A45C]"
                          : studyStep > s.step
                          ? "bg-[#090909] border-[rgba(50,213,131,0.2)] text-[#32D583]"
                          : "bg-[#090909] border-[#1A1A1A] text-[#666660]"
                      }`}
                    >
                      <p className="text-xs font-bold tracking-tight">{s.label}</p>
                      <p className="text-[9px] font-mono mt-0.5 truncate">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 1 Content: READ (Quick Summary) */}
              {studyStep === 1 && (
                <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F5F0]">Phase 1: Read & Comprehend</h3>
                      <p className="text-xs text-[#A6A6A0]">Get a high-level overview of the entire document before diving deep.</p>
                    </div>
                    <button
                      onClick={() => handleGenerateSummary("quick")}
                      disabled={isSummarizing || !selectedFile}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                    >
                      {isSummarizing ? "Reading..." : "Generate Summary"}
                    </button>
                  </div>

                  {summaryResult?.summary ? (
                    <div className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-3">
                      <div className="prose prose-invert max-w-none text-xs text-[#F5F5F0] leading-relaxed whitespace-pre-line font-light">
                        {summaryResult.summary}
                      </div>
                      <div className="pt-3 border-t border-[#1A1A1A] flex justify-end">
                        <button
                          onClick={() => setStudyStep(2)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A160F] border border-[rgba(201,164,92,0.3)] text-xs text-[#C9A45C] hover:text-[#D8B46E]"
                        >
                          <span>Proceed to Understand</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#666660]">
                      Click "Generate Summary" to begin studying this document.
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 Content: UNDERSTAND (Key Points & Glossary) */}
              {studyStep === 2 && (
                <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F5F0]">Phase 2: Understand Core Concepts</h3>
                      <p className="text-xs text-[#A6A6A0]">Deconstruct essential definitions, rules, and core points.</p>
                    </div>
                    <button
                      onClick={() => handleGenerateSummary("key_points")}
                      disabled={isSummarizing || !selectedFile}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                    >
                      {isSummarizing ? "Extracting..." : "Extract Key Points"}
                    </button>
                  </div>

                  {summaryResult?.summary ? (
                    <div className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-3">
                      <div className="prose prose-invert max-w-none text-xs text-[#F5F5F0] leading-relaxed whitespace-pre-line font-light">
                        {summaryResult.summary}
                      </div>
                      <div className="pt-3 border-t border-[#1A1A1A] flex justify-between">
                        <button
                          onClick={() => setStudyStep(1)}
                          className="px-3 py-1.5 rounded-xl bg-[#0D0D0D] border border-[#1A1A1A] text-xs text-[#A6A6A0]"
                        >
                          Back to Read
                        </button>
                        <button
                          onClick={() => {
                            setStudyStep(3);
                            handleGenerateFlashcards();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A160F] border border-[rgba(201,164,92,0.3)] text-xs text-[#C9A45C]"
                        >
                          <span>Proceed to Flashcards</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#666660]">
                      Click "Extract Key Points" to extract high-yield concepts.
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 Content: REVISE (Flashcards) */}
              {studyStep === 3 && (
                <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F5F0]">Phase 3: Active Recall Flashcards</h3>
                      <p className="text-xs text-[#A6A6A0]">Test your memory before the final exam quiz.</p>
                    </div>
                    <button
                      onClick={handleGenerateFlashcards}
                      disabled={isGeneratingCards || !selectedFile}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                    >
                      {isGeneratingCards ? "Generating..." : "Generate Deck"}
                    </button>
                  </div>

                  {flashcardsData && flashcardsData.cards.length > 0 ? (
                    <div className="space-y-4">
                      {/* 3D Card */}
                      <div
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="perspective-1000 w-full h-56 cursor-pointer select-none"
                      >
                        <div
                          className={`relative w-full h-full duration-500 transform-style-3d transition-transform rounded-2xl border border-[rgba(201,164,92,0.25)] ${
                            isCardFlipped ? "rotate-y-180 bg-[#14120D]" : "bg-[#090909]"
                          }`}
                        >
                          {/* Front Side */}
                          <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#666660]">
                              <span className="uppercase text-[#C9A45C]">
                                {flashcardsData.cards[currentCardIndex].category || "CONCEPT"}
                              </span>
                              <span>CARD {currentCardIndex + 1} / {flashcardsData.cards.length}</span>
                            </div>
                            <div className="text-center px-4">
                              <p className="text-sm sm:text-base font-medium text-[#F5F5F0] leading-snug">
                                {flashcardsData.cards[currentCardIndex].front}
                              </p>
                            </div>
                            <p className="text-[10px] font-mono text-center text-[#666660]">
                              (Click to flip answer)
                            </p>
                          </div>

                          {/* Back Side */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col justify-between">
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#666660]">
                              <span className="uppercase text-[#32D583]">ANSWER & EXPLANATION</span>
                              {flashcardsData.cards[currentCardIndex].reference && (
                                <span className="text-[#C9A45C]">
                                  {flashcardsData.cards[currentCardIndex].reference}
                                </span>
                              )}
                            </div>
                            <div className="text-center px-4 overflow-y-auto">
                              <p className="text-xs sm:text-sm text-[#F5F5F0] leading-relaxed">
                                {flashcardsData.cards[currentCardIndex].back}
                              </p>
                            </div>
                            <p className="text-[10px] font-mono text-center text-[#666660]">
                              (Click to flip front)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Nav Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => {
                            setIsCardFlipped(false);
                            setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                          }}
                          disabled={currentCardIndex === 0}
                          className="px-3 py-1.5 rounded-xl bg-[#090909] border border-[#1A1A1A] text-xs text-[#A6A6A0] disabled:opacity-30 inline-flex items-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </button>

                        <span className="text-xs font-mono text-[#666660]">
                          {currentCardIndex + 1} of {flashcardsData.cards.length}
                        </span>

                        <button
                          onClick={() => {
                            setIsCardFlipped(false);
                            setCurrentCardIndex((prev) =>
                              Math.min(flashcardsData.cards.length - 1, prev + 1)
                            );
                          }}
                          disabled={currentCardIndex === flashcardsData.cards.length - 1}
                          className="px-3 py-1.5 rounded-xl bg-[#090909] border border-[#1A1A1A] text-xs text-[#A6A6A0] disabled:opacity-30 inline-flex items-center gap-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="pt-3 border-t border-[#1A1A1A] flex justify-end">
                        <button
                          onClick={() => {
                            setStudyStep(4);
                            handleGenerateQuiz();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A160F] border border-[rgba(201,164,92,0.3)] text-xs text-[#C9A45C]"
                        >
                          <span>Proceed to Take Quiz</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#666660]">
                      Click "Generate Deck" to generate flashcards.
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 Content: TEST (Interactive Quiz) */}
              {studyStep === 4 && (
                <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F5F5F0]">Phase 4: Knowledge Test</h3>
                      <p className="text-xs text-[#A6A6A0]">Verify your mastery with automatic evaluation.</p>
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isGeneratingQuiz || !selectedFile}
                      className="px-3.5 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                    >
                      {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
                    </button>
                  </div>

                  {quizData && quizData.questions.length > 0 ? (
                    <div className="space-y-4">
                      {/* Score Banner if Submitted */}
                      {quizSubmitted && (
                        <div className="p-4 rounded-xl bg-[#1A160F] border border-[rgba(201,164,92,0.3)] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className="w-6 h-6 text-[#C9A45C]" />
                            <div>
                              <p className="text-xs font-semibold text-[#F5F5F0]">
                                Final Quiz Score: {quizScore} / {quizData.total}
                              </p>
                              <p className="text-[11px] text-[#A6A6A0]">
                                Mastery: {Math.round((quizScore / quizData.total) * 100)}%
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setQuizSubmitted(false);
                              setUserAnswers({});
                            }}
                            className="px-3 py-1 rounded-lg bg-[#090909] text-[11px] font-mono text-[#C9A45C] hover:bg-[#111111]"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      )}

                      {/* Questions List */}
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                        {quizData.questions.map((q, idx) => {
                          const userChoice = userAnswers[q.id];
                          const isCorrect = userChoice === q.correctAnswer;

                          return (
                            <div
                              key={q.id}
                              className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-[#F5F5F0]">
                                  <span className="font-mono text-[#C9A45C] mr-1.5">Q{idx + 1}.</span>
                                  {q.question}
                                </p>
                                {quizSubmitted && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                                      isCorrect
                                        ? "bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/30"
                                        : "bg-[#FF5C67]/10 text-[#FF5C67] border border-[#FF5C67]/30"
                                    }`}
                                  >
                                    {isCorrect ? "Correct" : "Incorrect"}
                                  </span>
                                )}
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 gap-1.5">
                                {(["A", "B", "C", "D"] as const).map((opt) => {
                                  const optionText = q.options[opt];
                                  if (!optionText) return null;
                                  const isSelected = userChoice === opt;
                                  const isAnswerKey = quizSubmitted && q.correctAnswer === opt;

                                  let optStyles = "bg-[#0D0D0D] border-[#1A1A1A] text-[#A6A6A0] hover:border-[rgba(201,164,92,0.25)]";
                                  if (isSelected && !quizSubmitted) {
                                    optStyles = "bg-[#1A160F] border-[rgba(201,164,92,0.40)] text-[#C9A45C] font-semibold";
                                  } else if (quizSubmitted) {
                                    if (isAnswerKey) {
                                      optStyles = "bg-[#32D583]/10 border-[#32D583]/40 text-[#32D583] font-semibold";
                                    } else if (isSelected && !isCorrect) {
                                      optStyles = "bg-[#FF5C67]/10 border-[#FF5C67]/40 text-[#FF5C67]";
                                    }
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => handleSelectQuizAnswer(q.id, opt)}
                                      disabled={quizSubmitted}
                                      className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2.5 ${optStyles}`}
                                    >
                                      <span className="w-5 h-5 rounded-md font-mono text-[10px] flex items-center justify-center bg-[#050505] shrink-0">
                                        {opt}
                                      </span>
                                      <span className="flex-1">{optionText}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Explanation upon submission */}
                              {quizSubmitted && (
                                <div className="p-3 rounded-lg bg-[#050505] border border-[#1A1A1A] text-[11px] text-[#A6A6A0] space-y-1">
                                  <p className="font-semibold text-[#F5F5F0]">Explanation:</p>
                                  <p>{q.explanation}</p>
                                  {q.reference && (
                                    <p className="font-mono text-[10px] text-[#C9A45C]">
                                      Reference: {q.reference}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {!quizSubmitted && (
                        <div className="pt-3 border-t border-[#1A1A1A] flex justify-end">
                          <button
                            onClick={handleSubmitQuiz}
                            disabled={Object.keys(userAnswers).length === 0}
                            className="px-4 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                          >
                            Submit & Grade Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#666660]">
                      Click "Generate Quiz" to test yourself on this document.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUMMARIES (6 Dimensions) */}
          {activeTab === "SUMMARIES" && (
            <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F0]">Document Summarization Suite</h3>
                  <p className="text-xs text-[#A6A6A0]">Select a specialized summary dimension for your learning need.</p>
                </div>
                <button
                  onClick={() => handleGenerateSummary(summaryType)}
                  disabled={isSummarizing || !selectedFile}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>

              {/* 6 Dimension Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { id: "quick", label: "Quick Summary" },
                  { id: "detailed", label: "Detailed Breakdown" },
                  { id: "chapter", label: "Chapter Breakdown" },
                  { id: "key_points", label: "Key Points" },
                  { id: "terms", label: "Terms & Glossary" },
                  { id: "tldr", label: "TL;DR" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSummaryType(s.id as SummaryType);
                      handleGenerateSummary(s.id as SummaryType);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      summaryType === s.id
                        ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.4)] font-semibold"
                        : "bg-[#090909] text-[#A6A6A0] hover:text-[#F5F5F0] border border-[#1A1A1A]"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Output Content */}
              {summaryResult ? (
                <div className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1A1A1A] text-[10px] font-mono text-[#666660]">
                    <span className="uppercase text-[#C9A45C]">{summaryResult.type.replace("_", " ")}</span>
                    <span>Document: {summaryResult.filename}</span>
                  </div>
                  <div className="prose prose-invert max-w-none text-xs text-[#F5F5F0] leading-relaxed whitespace-pre-line font-light">
                    {summaryResult.summary}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#666660]">
                  Select a summary mode above or click Generate to view.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STANDALONE QUIZ */}
          {activeTab === "QUIZ" && (
            <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F0]">Interactive Exam Quiz Generator</h3>
                  <p className="text-xs text-[#A6A6A0]">Configure difficulty and question count for tailored practice.</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value as any)}
                    className="bg-[#090909] border border-[#1A1A1A] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F5F0] focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>

                  <select
                    value={quizCount}
                    onChange={(e) => setQuizCount(Number(e.target.value))}
                    className="bg-[#090909] border border-[#1A1A1A] rounded-xl px-2.5 py-1.5 text-xs text-[#F5F5F0] focus:outline-none"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz || !selectedFile}
                    className="px-3.5 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                  >
                    {isGeneratingQuiz ? "Building..." : "Generate"}
                  </button>
                </div>
              </div>

              {quizData && quizData.questions.length > 0 ? (
                <div className="space-y-4">
                  {quizSubmitted && (
                    <div className="p-4 rounded-xl bg-[#1A160F] border border-[rgba(201,164,92,0.3)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-[#C9A45C]" />
                        <div>
                          <p className="text-xs font-semibold text-[#F5F5F0]">
                            Score: {quizScore} / {quizData.total} ({Math.round((quizScore / quizData.total) * 100)}%)
                          </p>
                          <p className="text-[11px] text-[#A6A6A0]">Difficulty: {quizData.difficulty}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setUserAnswers({});
                        }}
                        className="px-3 py-1 rounded-lg bg-[#090909] text-[11px] font-mono text-[#C9A45C]"
                      >
                        Retake
                      </button>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {quizData.questions.map((q, idx) => {
                      const userChoice = userAnswers[q.id];
                      const isCorrect = userChoice === q.correctAnswer;

                      return (
                        <div key={q.id} className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-[#F5F5F0]">
                              <span className="font-mono text-[#C9A45C] mr-1">Q{idx + 1}.</span>
                              {q.question}
                            </p>
                            {quizSubmitted && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                                  isCorrect
                                    ? "bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/30"
                                    : "bg-[#FF5C67]/10 text-[#FF5C67] border border-[#FF5C67]/30"
                                }`}
                              >
                                {isCorrect ? "Correct" : "Incorrect"}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-1.5">
                            {(["A", "B", "C", "D"] as const).map((opt) => {
                              const optionText = q.options[opt];
                              if (!optionText) return null;
                              const isSelected = userChoice === opt;
                              const isAnswerKey = quizSubmitted && q.correctAnswer === opt;

                              let optStyles = "bg-[#0D0D0D] border-[#1A1A1A] text-[#A6A6A0]";
                              if (isSelected && !quizSubmitted) {
                                optStyles = "bg-[#1A160F] border-[rgba(201,164,92,0.40)] text-[#C9A45C] font-semibold";
                              } else if (quizSubmitted) {
                                if (isAnswerKey) {
                                  optStyles = "bg-[#32D583]/10 border-[#32D583]/40 text-[#32D583] font-semibold";
                                } else if (isSelected && !isCorrect) {
                                  optStyles = "bg-[#FF5C67]/10 border-[#FF5C67]/40 text-[#FF5C67]";
                                }
                              }

                              return (
                                <button
                                  key={opt}
                                  onClick={() => handleSelectQuizAnswer(q.id, opt)}
                                  disabled={quizSubmitted}
                                  className={`w-full p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2.5 ${optStyles}`}
                                >
                                  <span className="w-5 h-5 rounded-md font-mono text-[10px] flex items-center justify-center bg-[#050505] shrink-0">
                                    {opt}
                                  </span>
                                  <span className="flex-1">{optionText}</span>
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className="p-3 rounded-lg bg-[#050505] border border-[#1A1A1A] text-[11px] text-[#A6A6A0] space-y-1">
                              <p className="font-semibold text-[#F5F5F0]">Explanation:</p>
                              <p>{q.explanation}</p>
                              {q.reference && (
                                <p className="font-mono text-[10px] text-[#C9A45C]">Ref: {q.reference}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted && (
                    <div className="pt-3 border-t border-[#1A1A1A] flex justify-end">
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(userAnswers).length === 0}
                        className="px-4 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                      >
                        Grade Quiz
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#666660]">
                  Configure your preferences above and click "Generate" to create a custom quiz.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXAM Q&A */}
          {activeTab === "EXAM_QA" && (
            <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F0]">Categorized Exam Q&A</h3>
                  <p className="text-xs text-[#A6A6A0]">Model answers with page references and high-yield scoring keys.</p>
                </div>
                <button
                  onClick={() => handleGenerateQA(qaCategory)}
                  disabled={isGeneratingQA || !selectedFile}
                  className="px-3.5 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                >
                  {isGeneratingQA ? "Generating..." : "Generate Q&A"}
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { id: "all", label: "All Questions" },
                  { id: "short", label: "Short Answer" },
                  { id: "long", label: "Long / Essay" },
                  { id: "important", label: "Important Questions" },
                  { id: "conceptual", label: "Deep Conceptual" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setQaCategory(c.id as QACategory);
                      handleGenerateQA(c.id as QACategory);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                      qaCategory === c.id
                        ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.4)] font-semibold"
                        : "bg-[#090909] text-[#A6A6A0] hover:text-[#F5F5F0] border border-[#1A1A1A]"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Items List */}
              {qaData && qaData.items.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {qaData.items.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.2)]">
                          {item.category}
                        </span>
                        {item.reference && (
                          <span className="text-[10px] font-mono text-[#666660]">
                            {item.reference}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-[#F5F5F0]">
                        {item.question}
                      </p>
                      <p className="text-xs text-[#A6A6A0] leading-relaxed whitespace-pre-line">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#666660]">
                  Select a category above to generate structured exam questions.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FLASHCARDS */}
          {activeTab === "FLASHCARDS" && (
            <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#F5F5F0]">3D Active-Recall Flashcards</h3>
                  <p className="text-xs text-[#A6A6A0]">Spaced-repetition card deck generated from document concepts.</p>
                </div>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={isGeneratingCards || !selectedFile}
                  className="px-3.5 py-1.5 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                >
                  {isGeneratingCards ? "Generating..." : "Generate Cards"}
                </button>
              </div>

              {flashcardsData && flashcardsData.cards.length > 0 ? (
                <div className="space-y-4">
                  {/* 3D Flip Card */}
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="perspective-1000 w-full h-64 cursor-pointer select-none"
                  >
                    <div
                      className={`relative w-full h-full duration-500 transform-style-3d transition-transform rounded-2xl border border-[rgba(201,164,92,0.25)] ${
                        isCardFlipped ? "rotate-y-180 bg-[#14120D]" : "bg-[#090909]"
                      }`}
                    >
                      {/* Front */}
                      <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#666660]">
                          <span className="uppercase text-[#C9A45C]">
                            {flashcardsData.cards[currentCardIndex].category || "CONCEPT"}
                          </span>
                          <span>CARD {currentCardIndex + 1} / {flashcardsData.cards.length}</span>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-sm sm:text-base font-medium text-[#F5F5F0] leading-snug">
                            {flashcardsData.cards[currentCardIndex].front}
                          </p>
                        </div>
                        <p className="text-[10px] font-mono text-center text-[#666660]">
                          (Click card to flip)
                        </p>
                      </div>

                      {/* Back */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#666660]">
                          <span className="uppercase text-[#32D583]">EXPLANATION</span>
                          {flashcardsData.cards[currentCardIndex].reference && (
                            <span className="text-[#C9A45C]">
                              {flashcardsData.cards[currentCardIndex].reference}
                            </span>
                          )}
                        </div>
                        <div className="text-center px-4 overflow-y-auto">
                          <p className="text-xs sm:text-sm text-[#F5F5F0] leading-relaxed">
                            {flashcardsData.cards[currentCardIndex].back}
                          </p>
                        </div>
                        <p className="text-[10px] font-mono text-center text-[#666660]">
                          (Click card to flip)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        setIsCardFlipped(false);
                        setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                      }}
                      disabled={currentCardIndex === 0}
                      className="px-3 py-1.5 rounded-xl bg-[#090909] border border-[#1A1A1A] text-xs text-[#A6A6A0] disabled:opacity-30 inline-flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <span className="text-xs font-mono text-[#666660]">
                      {currentCardIndex + 1} of {flashcardsData.cards.length}
                    </span>

                    <button
                      onClick={() => {
                        setIsCardFlipped(false);
                        setCurrentCardIndex((prev) =>
                          Math.min(flashcardsData.cards.length - 1, prev + 1)
                        );
                      }}
                      disabled={currentCardIndex === flashcardsData.cards.length - 1}
                      className="px-3 py-1.5 rounded-xl bg-[#090909] border border-[#1A1A1A] text-xs text-[#A6A6A0] disabled:opacity-30 inline-flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#666660]">
                  Click "Generate Cards" to build an interactive flashcard deck.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: 11 AI TOOLS */}
          {activeTab === "AI_TOOLS" && (
            <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#F5F5F0]">11 Specialized AI Study Tools</h3>
                <p className="text-xs text-[#A6A6A0]">One-click transformation tools for targeted comprehension and exam readiness.</p>
              </div>

              {/* Optional Concept Target Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#666660] uppercase">
                  Specific Concept or Section (Optional):
                </label>
                <input
                  type="text"
                  value={toolTarget}
                  onChange={(e) => setToolTarget(e.target.value)}
                  placeholder="e.g. Quantum entanglement, Attention mechanism, Section 2..."
                  className="w-full bg-[#090909] border border-[#1A1A1A] rounded-xl px-3 py-1.5 text-xs text-[#F5F5F0] placeholder-[#666660] focus:outline-none focus:border-[#C9A45C]"
                />
              </div>

              {/* 11 Tool Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AI_TOOLS_LIST.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleRunTool(t.id)}
                    disabled={isToolRunning || !selectedFile}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedTool === t.id
                        ? "bg-[#1A160F] border-[rgba(201,164,92,0.4)] text-[#C9A45C]"
                        : "bg-[#090909] border-[#1A1A1A] text-[#A6A6A0] hover:text-[#F5F5F0] hover:border-[rgba(201,164,92,0.2)]"
                    }`}
                  >
                    <p className="text-xs font-semibold">{t.label}</p>
                    <p className="text-[10px] text-[#666660] truncate">{t.desc}</p>
                  </button>
                ))}
              </div>

              {/* Tool Execution Result */}
              {isToolRunning ? (
                <div className="p-8 text-center text-xs font-mono text-[#666660] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9A45C]" />
                  <span>Processing with Gemini...</span>
                </div>
              ) : toolResult ? (
                <div className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#666660] pb-2 border-b border-[#1A1A1A]">
                    <span className="uppercase text-[#C9A45C]">
                      TOOL RESULT: {selectedTool.replace("_", " ")}
                    </span>
                    <span>Document: {selectedFile?.original_name}</span>
                  </div>
                  <div className="prose prose-invert max-w-none text-xs text-[#F5F5F0] leading-relaxed whitespace-pre-line font-light">
                    {toolResult}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 7: CLASSIC SYNTHESIS */}
          {activeTab === "SYNTHESIS" && (
            <div className="p-5 rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["SUMMARIZE", "EXTRACT", "COMPARE", "ANALYZE", "QUESTION"] as ClassicMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setClassicMode(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono tracking-wider transition-all ${
                      classicMode === m
                        ? "bg-[#1A160F] text-[#C9A45C] border border-[rgba(201,164,92,0.40)] font-semibold"
                        : "bg-[#090909] text-[#A6A6A0] hover:text-[#F5F5F0] border border-[#1A1A1A]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#A6A6A0] uppercase">
                  Directive / Custom Prompt:
                </label>
                <textarea
                  rows={2}
                  value={classicPrompt}
                  onChange={(e) => setClassicPrompt(e.target.value)}
                  placeholder={`Perform ${classicMode} on ${selectedFile?.original_name || "document"}...`}
                  className="w-full bg-[#090909] border border-[#1A1A1A] focus:border-[#C9A45C] rounded-xl p-3 text-xs text-[#F5F5F0] placeholder-[#666660] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-[#666660] truncate max-w-xs">
                  Target: {selectedFile?.original_name || "None"}
                </span>

                <button
                  onClick={handleRunClassic}
                  disabled={!selectedFile || isClassicRunning}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C9A45C] hover:bg-[#D8B46E] text-[#050505] font-semibold text-xs transition-all disabled:opacity-40"
                >
                  {isClassicRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Run {classicMode}</span>
                    </>
                  )}
                </button>
              </div>

              {classicResult && (
                <div className="p-4 rounded-xl bg-[#090909] border border-[#1A1A1A] space-y-3">
                  <div className="prose prose-invert max-w-none text-xs text-[#F5F5F0] leading-relaxed whitespace-pre-line font-light">
                    {classicResult}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE METRICS & GROUNDING (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666660] block">
            DOCUMENT METRICS
          </span>

          <div className="rounded-2xl border border-[rgba(201,164,92,0.12)] bg-[#0D0D0D] p-4 space-y-4">
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
                AI Inference Layer
              </span>
              <p className="text-xs font-mono text-[#C9A45C] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C9A45C]" />
                <span>Google Gemini Cloud</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#666660] uppercase">
                Context Window
              </span>
              <p className="text-xs font-mono text-[#F5F5F0]">
                {documentText ? `${documentText.length.toLocaleString()} characters` : "Pending load"}
              </p>
            </div>

            <div className="pt-2 border-t border-[#1A1A1A] space-y-1">
              <span className="text-[10px] font-mono text-[#666660] uppercase">
                Anti-Hallucination
              </span>
              <p className="text-[11px] text-[#32D583] flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Document Grounded</span>
              </p>
              <p className="text-[10px] text-[#666660] leading-tight">
                Responses strictly cited from uploaded document text.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
