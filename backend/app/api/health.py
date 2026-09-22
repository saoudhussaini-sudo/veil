import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.services.moss_service import moss_service, HAS_MOSS_CORE
from app.services.local_ai_service import local_ai_service
from app.storage.file_storage import file_storage

router = APIRouter(prefix="/api", tags=["System Health & Diagnostics"])

class SettingsUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    gemini_model: Optional[str] = None

@router.get("/health")
async def get_health():
    ai_status = await local_ai_service.check_health()
    moss_status = moss_service.get_status()
    files = file_storage.list_files()
    chunks = file_storage.get_all_chunks()

    return {
        "status": "ok",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": local_ai_service.model,
        "mode": "GEMINI_MOSS_HYBRID",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini": {
            "provider": "GEMINI",
            "model": local_ai_service.model,
            "connected": ai_status.get("connected", False),
            "configured": ai_status.get("configured", False),
            "status": ai_status.get("status", "unknown"),
            "latencyMs": ai_status.get("latencyMs")
        },
        "moss": moss_status,
        "local_ai": {
            "provider": ai_status.get("provider", "GEMINI"),
            "model": ai_status.get("model", local_ai_service.model),
            "base_url": local_ai_service.base_url,
            "connected": ai_status.get("connected", False)
        },
        "workspace": {
            "total_files": len(files),
            "total_chunks": len(chunks)
        }
    }

@router.get("/health/moss")
async def get_health_moss():
    """Diagnostic test for the MOSS retrieval layer with genuine measured latency."""
    start = time.perf_counter()
    docs, query_lat = await moss_service.query("health check test", top_k=1)
    total_time = round((time.perf_counter() - start) * 1000, 2)

    status = moss_service.get_status()
    return {
        "ok": True,
        "index": settings.MOSS_INDEX_NAME,
        "engine": status.get("engine", "MOSS Core"),
        "documentsFound": len(docs),
        "latencyMs": query_lat,
        "totalTestTimeMs": total_time,
        "has_moss_core": HAS_MOSS_CORE,
        "docCount": status.get("doc_count", 0)
    }

@router.get("/health/ai")
async def get_health_ai():
    """Diagnostic test for Gemini API runtime."""
    return await local_ai_service.check_health()
