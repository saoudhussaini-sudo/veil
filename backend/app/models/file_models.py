from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class FileMetadata(BaseModel):
    id: str
    filename: str
    original_name: str
    extension: str
    mime_type: str
    size: int
    created_at: float
    updated_at: float
    processing_status: str = "READY"  # UPLOADING, PROCESSING, EXTRACTING, INDEXING, READY, FAILED, UNSUPPORTED
    index_status: str = "INDEXED"     # INDEXED, PENDING, FAILED, SKIPPED
    preview_available: bool = True
    last_accessed_at: Optional[float] = None
    chunk_count: int = 0

class FilePreviewResponse(BaseModel):
    file: FileMetadata
    preview_type: str  # pdf, image, table, json, code, text, archive, unsupported
    preview_data: Any
    extracted_text_preview: str

class FileListResponse(BaseModel):
    total_files: int
    files: List[FileMetadata]
