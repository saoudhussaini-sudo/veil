import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.storage.file_storage import file_storage
from app.services.moss_service import moss_service

router = APIRouter(prefix="/api/debug", tags=["Debug Endpoints"])

class DocumentDebugRequest(BaseModel):
    document_id: Optional[str] = None
    filename: Optional[str] = None

class RetrievalDebugRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4

@router.post("/document")
async def debug_document(req: DocumentDebugRequest):
    files = file_storage.list_files()
    target = None
    if req.document_id:
        target = file_storage.get_file(req.document_id)
    elif req.filename:
        for f in files:
            if f.get("original_name") == req.filename or f.get("filename") == req.filename:
                target = f
                break
    else:
        if files:
            target = files[0]

    if not target:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc_id = target["id"]
    chunks = file_storage.get_file_chunks(doc_id)
    preview = file_storage.get_file_preview(doc_id)
    
    pages = 1
    if preview and preview.get("preview_data"):
        pages = preview["preview_data"].get("page_count", 1)

    chars_extracted = 0
    if target.get("extracted_path") and os.path.exists(target["extracted_path"]):
        with open(target["extracted_path"], "r", encoding="utf-8") as ef:
            chars_extracted = len(ef.read())
    elif preview and preview.get("extracted_text_preview"):
        chars_extracted = len(preview.get("extracted_text_preview", ""))

    is_indexed = (len(chunks) > 0 and target.get("index_status") == "indexed")

    return {
        "filename": target.get("original_name") or target["filename"],
        "document_id": doc_id,
        "pages": pages,
        "characters_extracted": chars_extracted,
        "chunks": len(chunks),
        "indexed": is_indexed
    }

@router.post("/retrieval")
async def debug_retrieval(req: RetrievalDebugRequest):
    raw_docs, latency_ms = await moss_service.query(query_text=req.query, top_k=req.top_k or 4)
    results = []
    for d in raw_docs:
        meta = d.get("metadata", {})
        results.append({
            "filename": meta.get("filename") or "Document",
            "page": meta.get("page") or 1,
            "score": float(d.get("score", 1.0)),
            "text": d.get("text", "")
        })

    return {
        "query": req.query,
        "results": results,
        "latency_ms": latency_ms
    }
