export interface FileItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  file_ext: string;
  preview_type: string;
  processing_status: string;
  index_status: string;
  chunk_count: number;
  is_searchable: boolean;
  created_at: number;
  last_accessed_at?: number;
}

export interface FilePreviewResponse {
  file: FileItem;
  preview_type: "pdf" | "image" | "table" | "json" | "code" | "text" | "archive" | "unsupported";
  preview_data: any;
  extracted_text_preview: string;
}

export interface SourceItem {
  title: string;
  file_id?: string | null;
  file_name?: string | null;
  score: number;
  snippet: string;
  chunk_index?: number;
  page?: number | null;
}

export interface AccessedFileItem {
  fileId: string;
  filename: string;
  action: string;
  chunksRetrieved?: number;
}

export interface QueryResponse {
  answer: string;
  routing: {
    mode: string; // DIRECT, RETRIEVAL, ANALYSIS, COMPARISON
  };
  sources: SourceItem[];
  moss: {
    used: boolean;
    passages: number;
    latencyMs?: number | null;
  };
  localAI: {
    used: boolean;
    provider: string;
    model: string;
    latencyMs: number;
  };
  accessedFiles: AccessedFileItem[];
  query_id?: string;
}

export interface HealthResponse {
  status: string;
  mode?: string;
  service?: string;
  version?: string;
  llm_provider?: string;
  llm_model?: string;
  moss?: {
    index_name: string;
    has_official_sdk: boolean;
    configured: boolean;
    loaded_indexes: string[];
  };
  local_ai?: {
    provider: string;
    model: string;
    base_url: string;
    connected: boolean;
  };
  workspace?: {
    total_files: number;
    total_chunks: number;
  };
}

export interface AccessEvent {
  eventId: string;
  timestamp: number;
  fileId: string;
  filename: string;
  action: string;
  queryId?: string;
  chunksRetrieved: number;
  timeAgo?: string;
}

export interface MostAccessedItem {
  fileId: string;
  filename: string;
  accessCount: number;
  lastAction: string;
  lastAccessedAt: number;
}

export interface DailyAccessCount {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  files_accessed: number;
  offline_queries: number;
  moss_retrievals: number;
  local_analyses: number;
  total_files: number;
  total_chunks: number;
  recent_access: AccessEvent[];
  most_accessed: MostAccessedItem[];
  access_over_time: DailyAccessCount[];
}

// Production & Development API Base URL resolution
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

async function extractErrorMessage(res: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await res.json();
    return data.detail || data.message || data.error || defaultMessage;
  } catch {
    return `${defaultMessage} (HTTP ${res.status}: ${res.statusText || "Server error"})`;
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
    if (!res.ok) {
      const err = await extractErrorMessage(res, "Backend health check failed");
      throw new Error(err);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(`Backend unavailable at ${API_BASE || "local port 8000"}. Please verify server is running.`);
    }
    throw err;
  }
}

export async function fetchFiles(): Promise<{ total_files: number; files: FileItem[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/files`, { cache: "no-store" });
    if (!res.ok) {
      const err = await extractErrorMessage(res, "Failed to fetch files");
      throw new Error(err);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Backend unavailable. Could not fetch files.");
    }
    throw err;
  }
}

export async function uploadMultipleFiles(files: FileList | File[]): Promise<any> {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  try {
    const res = await fetch(`${API_BASE}/api/files/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await extractErrorMessage(res, "File upload failed");
      throw new Error(err);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Backend unavailable. Could not complete file upload.");
    }
    throw err;
  }
}

export async function loadDemoFiles(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/files/demo`, { method: "POST" });
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to load demo files");
    throw new Error(err);
  }
  return res.json();
}

export async function fetchFilePreview(fileId: string): Promise<FilePreviewResponse> {
  const res = await fetch(`${API_BASE}/api/files/${fileId}/preview`);
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to load file preview");
    throw new Error(err);
  }
  return res.json();
}

export async function deleteFileItem(fileId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/files/${fileId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to delete file");
    throw new Error(err);
  }
  return res.json();
}

export async function runQuery(
  question: string,
  mode: string = "AUTO",
  topK: number = 4,
  fileIds?: string[]
): Promise<QueryResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, mode, top_k: topK, file_ids: fileIds }),
    });
    if (!res.ok) {
      const err = await extractErrorMessage(res, "Query execution failed");
      throw new Error(err);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(`Cannot reach VEIL backend API at ${API_BASE || "local server"}. Please check server status.`);
    }
    throw err;
  }
}

export async function compareFiles(
  fileIds: string[],
  question?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_ids: fileIds, question }),
  });
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Comparison failed");
    throw new Error(err);
  }
  return res.json();
}

export async function analyzeFile(
  fileId: string,
  question: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, question }),
  });
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Analysis failed");
    throw new Error(err);
  }
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/api/analytics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function fetchRecentAccess(limit: number = 20): Promise<AccessEvent[]> {
  const res = await fetch(`${API_BASE}/api/analytics/recent?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchRecentQueries(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/queries/recent`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function saveSettings(settings: any): Promise<any> {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function fetchAiModels(): Promise<{ active_model: string; models: string[]; count: number }> {
  const res = await fetch(`${API_BASE}/api/ai/models`, { cache: "no-store" });
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to fetch AI models");
    throw new Error(err);
  }
  return res.json();
}

export async function selectAiModel(model: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/ai/select-model`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to select AI model");
    throw new Error(err);
  }
  return res.json();
}

export async function testAiGeneration(prompt: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/ai/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await extractErrorMessage(res, "Test generation failed");
    throw new Error(err);
  }
  return res.json();
}

/* ==========================================================================
   VEIL STUDY SUITE (Gemini Cloud + Local Hybrid)
   ========================================================================== */

export interface PersonalizationOptions {
  level?: "beginner" | "intermediate" | "advanced";
  style?: "simple" | "detailed" | "exam-focused" | "technical" | "examples-first";
  responseLength?: "short" | "balanced" | "detailed";
}

export interface SummaryResponse {
  type: string;
  filename: string;
  summary: string;
  timestamp: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  reference?: string;
}

export interface QuizResponse {
  title: string;
  difficulty: string;
  total: number;
  questions: QuizQuestion[];
  timestamp: number;
}

export interface QAItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  reference?: string;
  keyPoints?: string[];
}

export interface QAResponse {
  title: string;
  category: string;
  total: number;
  items: QAItem[];
  timestamp: number;
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  category: string;
  reference?: string;
}

export interface FlashcardsResponse {
  title: string;
  total: number;
  cards: Flashcard[];
  timestamp: number;
}

export interface StudyToolResponse {
  tool: string;
  result: string;
  timestamp: number;
}

// In-memory client cache to eliminate duplicate Gemini API calls
const studyCache = new Map<string, any>();

export function clearStudyCache(fileId?: string) {
  if (!fileId) {
    studyCache.clear();
  } else {
    for (const key of Array.from(studyCache.keys())) {
      if (key.startsWith(fileId)) {
        studyCache.delete(key);
      }
    }
  }
}

export function getPersonalizationSettings(): PersonalizationOptions {
  if (typeof window === "undefined") return { level: "intermediate", style: "simple", responseLength: "balanced" };
  try {
    const saved = localStorage.getItem("veil_personalization");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { level: "intermediate", style: "simple", responseLength: "balanced" };
}

export function savePersonalizationSettings(options: PersonalizationOptions) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("veil_personalization", JSON.stringify(options));
  } catch {}
}

export async function fetchSummary(params: {
  fileId: string;
  content: string;
  type?: "quick" | "detailed" | "chapter" | "key_points" | "terms" | "tldr";
  filename?: string;
  forceRefresh?: boolean;
}): Promise<SummaryResponse> {
  const cacheKey = `${params.fileId}_summary_${params.type || "quick"}`;
  if (!params.forceRefresh && studyCache.has(cacheKey)) {
    return studyCache.get(cacheKey);
  }

  const personalization = getPersonalizationSettings();
  const res = await fetch(`${API_BASE}/api/study/summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: params.content,
      type: params.type || "quick",
      filename: params.filename || "Document",
      personalization,
    }),
  });

  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to generate summary");
    throw new Error(err);
  }

  const data = await res.json();
  studyCache.set(cacheKey, data);
  return data;
}

export async function generateQuiz(params: {
  fileId: string;
  content: string;
  difficulty?: "easy" | "medium" | "hard";
  count?: number;
  filename?: string;
  forceRefresh?: boolean;
}): Promise<QuizResponse> {
  const cacheKey = `${params.fileId}_quiz_${params.difficulty || "medium"}_${params.count || 5}`;
  if (!params.forceRefresh && studyCache.has(cacheKey)) {
    return studyCache.get(cacheKey);
  }

  const personalization = getPersonalizationSettings();
  const res = await fetch(`${API_BASE}/api/study/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: params.content,
      difficulty: params.difficulty || "medium",
      count: params.count || 5,
      filename: params.filename || "Document",
      personalization,
    }),
  });

  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to generate quiz");
    throw new Error(err);
  }

  const data = await res.json();
  studyCache.set(cacheKey, data);
  return data;
}

export async function generateQA(params: {
  fileId: string;
  content: string;
  category?: "short" | "long" | "important" | "exam" | "conceptual" | "all";
  filename?: string;
  forceRefresh?: boolean;
}): Promise<QAResponse> {
  const cacheKey = `${params.fileId}_qa_${params.category || "all"}`;
  if (!params.forceRefresh && studyCache.has(cacheKey)) {
    return studyCache.get(cacheKey);
  }

  const personalization = getPersonalizationSettings();
  const res = await fetch(`${API_BASE}/api/study/qa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: params.content,
      category: params.category || "all",
      filename: params.filename || "Document",
      personalization,
    }),
  });

  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to generate Q&A");
    throw new Error(err);
  }

  const data = await res.json();
  studyCache.set(cacheKey, data);
  return data;
}

export async function generateFlashcards(params: {
  fileId: string;
  content: string;
  count?: number;
  filename?: string;
  forceRefresh?: boolean;
}): Promise<FlashcardsResponse> {
  const cacheKey = `${params.fileId}_flashcards_${params.count || 10}`;
  if (!params.forceRefresh && studyCache.has(cacheKey)) {
    return studyCache.get(cacheKey);
  }

  const personalization = getPersonalizationSettings();
  const res = await fetch(`${API_BASE}/api/study/flashcards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: params.content,
      count: params.count || 10,
      filename: params.filename || "Document",
      personalization,
    }),
  });

  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to generate flashcards");
    throw new Error(err);
  }

  const data = await res.json();
  studyCache.set(cacheKey, data);
  return data;
}

export async function runStudyTool(params: {
  tool: string;
  content: string;
  target?: string;
  filename?: string;
}): Promise<StudyToolResponse> {
  const personalization = getPersonalizationSettings();
  const res = await fetch(`${API_BASE}/api/study/tools`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tool: params.tool,
      content: params.content,
      target: params.target || "",
      filename: params.filename || "Document",
      personalization,
    }),
  });

  if (!res.ok) {
    const err = await extractErrorMessage(res, `Failed to run ${params.tool} tool`);
    throw new Error(err);
  }

  return res.json();
}

export async function sendChatMessage(params: {
  message: string;
  documentContext?: string;
}): Promise<{
  answer: string;
  sources: Array<{ snippet: string; page?: number }>;
  provider: string;
  model: string;
  latencyMs: number;
}> {
  const personalization = getPersonalizationSettings();
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: params.message,
      documentContext: params.documentContext || "",
      personalization,
    }),
  });

  if (!res.ok) {
    const err = await extractErrorMessage(res, "Failed to send chat message");
    throw new Error(err);
  }

  return res.json();
}

