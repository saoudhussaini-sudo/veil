from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class MossDocItem:
    """Document item prepared for Moss indexing."""
    id: str
    text: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    payload: Optional[Dict[str, Any]] = None

@dataclass
class RetrievedDocument:
    """Standardized representation of a single retrieved document chunk."""
    id: str
    index_name: str
    text: str
    score: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    payload: Optional[Dict[str, Any]] = None

@dataclass
class MossRetrievalResult:
    """Standardized retrieval output with measured latency."""
    docs: List[RetrievedDocument]
    index_name: str
    model_id: str
    query: str
    time_taken_ms: float
    retrieved_count: int
    mode: str  # "OFFICIAL_MOSS" or "LOCAL_MOSS_ENGINE"
