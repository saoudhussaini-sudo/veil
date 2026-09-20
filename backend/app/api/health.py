import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.services.moss_service import moss_service, HAS_OFFICIAL_MOSS
from app.services.local_ai_service import local_ai_service
from app.storage.file_storage import file_storage

router = APIRouter(prefix="/api", tags=["System Health & Diagnostics"])

class SettingsUpdateRequest(BaseModel):
    moss_project_id: Optional[str] = None
    moss_project_key: Optional[str] = None
    local_ai_provider: Optional[str] = None
    local_ai_base_url: Optional[str] = None
    local_ai_model: Optional[str] = None

@router.get("/health")
async def get_health():
    ai_status = await local_ai_service.check_health()
    files = file_storage.list_files()
    chunks = file_storage.get_all_chunks()

    return {
        "status": "ok",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": local_ai_service.model,
        "mode": "LOCAL_FIRST" if settings.LLM_PROVIDER == "OLLAMA_LOCAL" else "PRODUCTION_CLOUD",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "moss": {
            "index_name": settings.MOSS_INDEX_NAME,
            "has_official_sdk": HAS_OFFICIAL_MOSS,
            "configured": bool(settings.MOSS_PROJECT_ID and settings.MOSS_PROJECT_KEY),
            "loaded_indexes": list(moss_service.loaded_indexes)
        },
        "local_ai": {
            "provider": ai_status.get("provider", settings.LLM_PROVIDER),
            "model": ai_status.get("model", local_ai_service.model),
            "base_url": local_ai_service.base_url,
            "connected": ai_status.get("connected", True)
        },
        "workspace": {
            "total_files": len(files),
            "total_chunks": len(chunks)
        }
    }

@router.get("/health/moss")
async def get_health_moss():
    """Diagnostic test for the Moss retrieval layer."""
    start = time.perf_counter()
    docs, query_lat = await moss_service.query("health check test", top_k=1)
    total_time = round((time.perf_counter() - start) * 1000, 2)

    return {
        "ok": True,
        "index": settings.MOSS_INDEX_NAME,
        "documentsFound": len(docs),
        "latencyMs": query_lat,
        "totalTestTimeMs": total_time,
        "official_sdk": HAS_OFFICIAL_MOSS,
        "mode": "official-moss" if moss_service.official_ready else "local-runtime"
    }

@router.get("/health/ai")
async def get_health_ai():
    """Diagnostic test for the Local AI runtime."""
    return await local_ai_service.check_health()

@router.post("/settings")
def update_settings(req: SettingsUpdateRequest):
    if req.moss_project_id is not None:
        settings.MOSS_PROJECT_ID = req.moss_project_id.strip()
    if req.moss_project_key is not None:
        settings.MOSS_PROJECT_KEY = req.moss_project_key.strip()
    if req.local_ai_provider is not None:
        settings.LOCAL_AI_PROVIDER = req.local_ai_provider.strip().lower()
    if req.local_ai_base_url is not None:
        settings.LOCAL_AI_BASE_URL = req.local_ai_base_url.strip()
    if req.local_ai_model is not None:
        settings.LOCAL_AI_MODEL = req.local_ai_model.strip()

    return {
        "status": "UPDATED",
        "moss_index": settings.MOSS_INDEX_NAME,
        "local_ai_provider": settings.LOCAL_AI_PROVIDER,
        "local_ai_model": settings.LOCAL_AI_MODEL
    }
