import time
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.moss_service import moss_service

logger = logging.getLogger("veil.services.retrieval")

class RetrievalService:
    """
    High-level local retrieval service bridging between VEIL files and Moss index.
    Strictly local: no internet search, no external APIs.
    """
    def __init__(self):
        self.index_name = settings.MOSS_INDEX_NAME

    async def retrieve_context(
        self,
        query: str,
        search_files: bool = True,
        top_k: int = 4
    ) -> Dict[str, Any]:
        """
        Retrieves relevant passages across the user's local files via Moss.
        Returns: { 'evidence': list, 'moss_latency_ms': float, 'passages': int }
        """
        if not search_files:
            return {
                "evidence": [],
                "moss_latency_ms": 0.0,
                "passages": 0,
                "sources": []
            }

        docs, latency_ms = await moss_service.query(query_text=query, top_k=top_k)

        evidence = []
        sources = []
        for d in docs:
            meta = d.get("metadata", {})
            fname = meta.get("filename") or meta.get("source") or "Uploaded Document"
            fid = meta.get("fileId") or meta.get("doc_id") or ""
            c_idx = meta.get("chunkIndex") or meta.get("chunk_index") or 0

            evidence.append({
                "sourceType": "local_file",
                "fileId": fid,
                "title": fname,
                "content": d["text"],
                "score": d["score"],
                "metadata": meta
            })

            sources.append({
                "title": fname,
                "file_id": fid,
                "file_name": fname,
                "score": d["score"],
                "snippet": d["text"][:200],
                "chunk_index": c_idx
            })

        return {
            "evidence": evidence,
            "moss_latency_ms": latency_ms,
            "passages": len(docs),
            "sources": sources
        }

retrieval_service = RetrievalService()
