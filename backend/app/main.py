import os
import logging
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.storage.database import init_database, get_document
from app.storage.file_storage import init_file_database, file_storage
from app.services.file_service import file_service
from app.services.query_orchestrator import query_orchestrator
from app.services.local_ai_service import local_ai_service
from app.services.moss_service import moss_service
from app.services.analysis_service import analysis_service

from app.api.health import router as health_router
from app.api.files import router as files_router
from app.api.query import router as query_router
from app.api.analytics import router as analytics_router
from app.api.ai import router as ai_router
from app.api.debug import router as debug_router

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("veil")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing VEIL local SQLite database and directories...")
    init_database()
    init_file_database()
    logger.info(f"Syncing file chunks to Moss index '{settings.MOSS_INDEX_NAME}'...")
    try:
        await file_service.sync_all_to_moss()
    except Exception as e:
        logger.warning(f"Initial Moss sync completed with note: {e}")
    logger.info(f"VEIL intelligence backend started. LLM_PROVIDER={settings.LLM_PROVIDER}")
    yield
    logger.info("VEIL intelligence backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VEIL: Privacy-First AI Knowledge Workspace with Moss Semantic Retrieval Layer",
    lifespan=lifespan
)

# CORS Configuration
def get_cors_origins() -> List[str]:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    if settings.FRONTEND_URL:
        for u in settings.FRONTEND_URL.split(","):
            u_clean = u.strip()
            if u_clean and u_clean not in origins:
                origins.append(u_clean)
    return origins

# In development or when explicitly allowed, permit all or configured origins with Vercel preview support
cors_origins = ["*"] if (settings.DEBUG or settings.FRONTEND_URL == "*") else get_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$" if not (settings.DEBUG or settings.FRONTEND_URL == "*") else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Canonical Top-Level Endpoints per Master Spec
@app.get("/health", tags=["Production Health"])
async def root_health_check():
    """Canonical health check endpoint returning provider info without exposing secrets."""
    ai_status = await local_ai_service.check_health()
    files = file_service.list_files()
    chunks = file_storage.get_all_chunks()
    return {
        "status": "ok",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": local_ai_service.model,
        "moss_index": settings.MOSS_INDEX_NAME,
        "connected": ai_status.get("connected", True),
        "total_files": len(files),
        "total_chunks": len(chunks),
        "version": settings.VERSION
    }

class ChatPayload(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    mode: Optional[str] = "AUTO"
    top_k: Optional[int] = 4
    file_ids: Optional[List[str]] = None

@app.post("/chat", tags=["Production Query"])
async def root_chat_endpoint(payload: ChatPayload):
    """Canonical chat endpoint routing through the intelligence pipeline."""
    q = (payload.message or payload.question or "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Please provide a message or question.")
    try:
        return await query_orchestrator.execute_query(
            question=q,
            mode=payload.mode or "AUTO",
            top_k=payload.top_k or 4,
            file_ids=payload.file_ids
        )
    except Exception as e:
        logger.error(f"Chat execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload", tags=["Production Files"])
async def root_upload_endpoint(files: List[UploadFile] = File(...)):
    """Canonical file upload endpoint with validation and chunk indexing."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    results = []
    errors = []
    for f in files:
        if not f.filename:
            continue
        try:
            content = await f.read()
            if len(content) > 50 * 1024 * 1024:
                raise ValueError("File exceeds maximum allowed size (50MB).")
            info = await file_service.ingest_file(f.filename, content)
            results.append(info)
        except Exception as e:
            logger.error(f"Failed to ingest {f.filename}: {e}")
            errors.append({"filename": f.filename, "error": str(e)})

    return {
        "status": "SUCCESS" if results else "FAILED",
        "uploaded_count": len(results),
        "files": results,
        "errors": errors
    }

@app.get("/files", tags=["Production Files"])
def root_files_endpoint():
    """Canonical file listing endpoint."""
    files = file_service.list_files()
    return {
        "total_files": len(files),
        "files": files
    }

class SearchPayload(BaseModel):
    query: str
    top_k: Optional[int] = 4

@app.post("/search", tags=["Production Retrieval"])
async def root_search_endpoint(payload: SearchPayload):
    """Canonical semantic search endpoint querying Moss retrieval layer."""
    q = payload.query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")
    try:
        docs, lat = await moss_service.query(q, top_k=payload.top_k or 4)
        return {
            "query": q,
            "passages_found": len(docs),
            "latency_ms": lat,
            "passages": docs
        }
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzePayload(BaseModel):
    file_id: str
    question: Optional[str] = "Analyze this document and extract key findings."

@app.post("/analyze", tags=["Production Analysis"])
async def root_analyze_endpoint(payload: AnalyzePayload):
    """Canonical document analysis endpoint."""
    doc = get_document(payload.file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="File not found.")
    fpath = doc.get("storage_path") or os.path.join(settings.FILES_DIR, doc["filename"])
    if not os.path.exists(fpath):
        alt = os.path.join(settings.FILES_DIR, f"{doc['id']}_{doc['filename']}")
        if os.path.exists(alt):
            fpath = alt
        else:
            raise HTTPException(status_code=404, detail="Physical file not found in storage.")
    try:
        ext = doc.get("file_ext") or doc.get("file_type") or os.path.splitext(doc["filename"])[1]
        answer, metrics, lat = await analysis_service.analyze_structured_data(
            file_path=fpath,
            filename=doc.get("original_name") or doc["filename"],
            file_ext=ext,
            query=payload.question or "Analyze this file."
        )
        return {
            "answer": answer,
            "file_id": payload.file_id,
            "metrics": metrics,
            "latency_ms": lat
        }
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include all /api prefixed routers for existing frontend compatibility
app.include_router(health_router)
app.include_router(files_router)
app.include_router(query_router)
app.include_router(analytics_router)
app.include_router(ai_router)
app.include_router(debug_router)

@app.get("/")
def root():
    return {
        "app": "VEIL",
        "tagline": "Privacy-first AI knowledge workspace with Moss semantic retrieval.",
        "status": "online",
        "llm_provider": settings.LLM_PROVIDER,
        "docs_url": "/docs"
    }
