from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import json
from typing import Optional, List
from app.models.query_models import (
    QueryRequest,
    CompareRequest,
    AnalyzeRequest,
    QueryResponse
)
from app.services.query_orchestrator import query_orchestrator
from app.services.comparison_service import comparison_service
from app.services.analysis_service import analysis_service
from app.services.moss_service import moss_service
from app.services.local_ai_service import local_ai_service
from app.storage.database import get_recent_queries, get_document
from app.config import settings
import os
import logging

logger = logging.getLogger("veil.api.query")

router = APIRouter(prefix="/api", tags=["Intelligent Query"])

@router.post("/query", response_model=QueryResponse)
async def execute_query(req: QueryRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Please provide a valid question.")

    logger.info(f"[QUERY] Request received. Mode: {req.mode}, TopK: {req.top_k}, Prompt: '{req.question[:60]}...'")
    try:
        res = await query_orchestrator.execute_query(
            question=req.question,
            mode=req.mode or "AUTO",
            top_k=req.top_k or 4,
            file_ids=req.file_ids
        )
        logger.info(f"[QUERY] Completed successfully. Route: {res.routing.mode}, AI latency: {res.localAI.latencyMs}ms")
        return res
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[QUERY] Execution error: {e}", exc_info=True)
        err_msg = str(e)
        if "Gemini API key is not configured" in err_msg:
            raise HTTPException(status_code=400, detail="Gemini API key is not configured.")
        return QueryResponse(
            answer=f"Notice: Query processing was interrupted ({err_msg}). Please retry.",
            routing={"mode": req.mode or "AUTO"},
            sources=[],
            moss={"used": False, "passages": 0, "latencyMs": 0.0},
            localAI={"used": False, "provider": settings.LLM_PROVIDER, "model": settings.GEMINI_MODEL, "latencyMs": 0.0},
            accessedFiles=[],
            query_id=""
        )

@router.post("/query/stream")
async def execute_query_stream(req: QueryRequest):
    """Streams response tokens in real-time."""
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Please provide a valid question.")

    async def event_generator():
        q_clean = req.question.strip()
        context_chunks = []
        if req.mode in ["FILES", "AUTO"]:
            raw_docs, moss_lat = await moss_service.query(query_text=q_clean, top_k=req.top_k or 4)
            context_chunks = raw_docs
            yield f"data: {json.dumps({'event': 'moss', 'passages': len(raw_docs), 'latencyMs': moss_lat})}\n\n"

        async for chunk in local_ai_service.stream_generate(prompt=q_clean, context_chunks=context_chunks):
            yield f"data: {json.dumps({'event': 'token', 'token': chunk})}\n\n"
        
        yield f"data: {json.dumps({'event': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/compare")
async def execute_comparison(req: CompareRequest):
    if not req.file_ids or len(req.file_ids) < 2:
        raise HTTPException(status_code=400, detail="Please provide at least 2 file IDs to compare.")

    try:
        answer, sources, moss_lat, passages = await comparison_service.compare_files(
            file_ids=req.file_ids,
            question=req.question or "Compare these documents and identify similarities, differences, and contradictions."
        )
        return {
            "answer": answer,
            "routing": {"mode": "COMPARISON"},
            "sources": sources,
            "moss": {"used": True, "passages": passages, "latencyMs": moss_lat},
            "localAI": {"used": True, "provider": "local-ai", "model": settings.LOCAL_AI_MODEL, "latencyMs": moss_lat},
            "comparedFiles": req.file_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")

@router.post("/analyze")
async def execute_analysis(req: AnalyzeRequest):
    doc = get_document(req.file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="File not found.")

    fpath = os.path.join(settings.FILES_DIR, doc["filename"])
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Physical file not found.")

    try:
        answer, metrics, lat = await analysis_service.analyze_structured_data(
            file_path=fpath,
            filename=doc.get("original_name") or doc["filename"],
            file_ext=doc.get("file_type", ""),
            query=req.question
        )
        return {
            "answer": answer,
            "routing": {"mode": "ANALYSIS"},
            "metrics": metrics,
            "localAI": {"used": True, "provider": "local-deterministic", "model": "veil-analyzer", "latencyMs": lat}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data analysis error: {str(e)}")

@router.get("/queries/recent")
def list_recent_queries(limit: int = 10):
    return get_recent_queries(limit=limit)
