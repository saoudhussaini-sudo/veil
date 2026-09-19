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
  mode: string;
  service: string;
  version: string;
  moss: {
    index_name: string;
    has_official_sdk: boolean;
    configured: boolean;
    loaded_indexes: string[];
  };
  local_ai: {
    provider: string;
    model: string;
    base_url: string;
    connected: boolean;
  };
  workspace: {
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

const API_BASE = "";

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to connect to VEIL local service");
  return res.json();
}

export async function fetchFiles(): Promise<{ total_files: number; files: FileItem[] }> {
  const res = await fetch(`${API_BASE}/api/files`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export async function uploadMultipleFiles(files: FileList | File[]): Promise<any> {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  const res = await fetch(`${API_BASE}/api/files/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function loadDemoFiles(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/files/demo`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to load demo files");
  return res.json();
}

export async function fetchFilePreview(fileId: string): Promise<FilePreviewResponse> {
  const res = await fetch(`${API_BASE}/api/files/${fileId}/preview`);
  if (!res.ok) throw new Error("Failed to load file preview");
  return res.json();
}

export async function deleteFileItem(fileId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/files/${fileId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete file");
  return res.json();
}

export async function runQuery(
  question: string,
  mode: string = "AUTO",
  topK: number = 4,
  fileIds?: string[]
): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, mode, top_k: topK, file_ids: fileIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Query failed" }));
    throw new Error(err.detail || "Query execution failed");
  }
  return res.json();
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
  if (!res.ok) throw new Error("Comparison failed");
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
  if (!res.ok) throw new Error("Analysis failed");
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
  if (!res.ok) throw new Error("Failed to fetch AI models");
  return res.json();
}

export async function selectAiModel(model: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/ai/select-model`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!res.ok) throw new Error("Failed to select AI model");
  return res.json();
}

export async function testAiGeneration(prompt: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/ai/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error("Test generation failed");
  return res.json();
}
