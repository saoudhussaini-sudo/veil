from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.local_ai_service import local_ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])

class SelectModelRequest(BaseModel):
    model: str

class TestGenerateRequest(BaseModel):
    prompt: str

@router.get("/models")
async def get_models():
    """Lists available models from the Gemini AI provider and the active model."""
    models = await local_ai_service.get_available_models()
    active = await local_ai_service.ensure_active_model()
    return {
        "active_model": active,
        "models": models,
        "count": len(models)
    }

@router.post("/select-model")
async def select_model(req: SelectModelRequest):
    """Switches the active model for subsequent VEIL generations."""
    if not req.model or not req.model.strip():
        raise HTTPException(status_code=400, detail="Model name must be provided.")
    new_model = local_ai_service.set_model(req.model)
    return {
        "success": True,
        "active_model": new_model,
        "message": f"Active AI model changed to {new_model}"
    }

@router.post("/test")
async def test_generation(req: TestGenerateRequest):
    """
    Executes real text generation with actual measured latency against Gemini API.
    """
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")
    try:
        result = await local_ai_service.test_generate(req.prompt.strip())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini generation failed: {str(e)}")

@router.get("/health")
async def ai_health():
    """Checks the health and connectivity of the Gemini AI runtime."""
    return await local_ai_service.check_health()
