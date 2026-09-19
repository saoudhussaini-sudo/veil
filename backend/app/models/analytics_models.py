from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AccessEvent(BaseModel):
    eventId: str
    timestamp: float
    fileId: str
    filename: str
    action: str  # VIEWED, RETRIEVED, ANALYZED, COMPARED, INDEXED
    queryId: Optional[str] = None
    chunksRetrieved: int = 0
    timeAgo: Optional[str] = None

class MostAccessedItem(BaseModel):
    fileId: str
    filename: str
    accessCount: int
    lastAction: str
    lastAccessedAt: float

class DailyAccessCount(BaseModel):
    date: str  # e.g. "Mon", "2026-09-19"
    count: int

class AnalyticsSummary(BaseModel):
    files_accessed: int
    offline_queries: int
    moss_retrievals: int
    local_analyses: int
    recent_access: List[AccessEvent]
    most_accessed: List[MostAccessedItem]
    access_over_time: List[DailyAccessCount]
    total_files: int
    total_chunks: int
