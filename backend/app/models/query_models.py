from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    question: str
    mode: str = "AUTO"  # AUTO, FILES, COMPARE
    top_k: int = 4
    file_ids: Optional[List[str]] = None

class CompareRequest(BaseModel):
    file_ids: List[str]
    question: Optional[str] = "Compare these documents and identify similarities, differences, and contradictions."

class AnalyzeRequest(BaseModel):
    file_id: str
    question: str

class SourceItem(BaseModel):
    title: str
    file_id: Optional[str] = None
    file_name: Optional[str] = None
    score: float = 1.0
    snippet: str
    chunk_index: Optional[int] = None
    page: Optional[int] = None

class MossInfo(BaseModel):
    used: bool = False
    passages: int = 0
    latencyMs: Optional[float] = None

class LocalAIInfo(BaseModel):
    used: bool = True
    provider: str = "ollama"
    model: str = "llama3"
    latencyMs: float = 0.0

class RoutingInfo(BaseModel):
    mode: str = "DIRECT"  # DIRECT, RETRIEVAL, ANALYSIS, COMPARISON, RETRIEVAL_ANALYSIS, RETRIEVAL_COMPARISON

class AccessedFileItem(BaseModel):
    fileId: str
    filename: str
    action: str  # RETRIEVED, ANALYZED, COMPARED, VIEWED
    chunksRetrieved: int = 0

class QueryResponse(BaseModel):
    answer: str
    routing: RoutingInfo
    sources: List[SourceItem] = []
    moss: MossInfo
    localAI: LocalAIInfo
    accessedFiles: List[AccessedFileItem] = []
    query_id: Optional[str] = None
