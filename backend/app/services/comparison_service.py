import time
import logging
from typing import List, Dict, Any, Tuple
from app.services.moss_service import moss_service
from app.services.local_ai_service import local_ai_service
from app.storage.database import get_document, log_access_event

logger = logging.getLogger("veil.services.comparison")

class ComparisonService:
    """
    Multi-document comparison and contradiction detection.
    Retrieves evidence from selected files using Moss, groups by document,
    and prompts Local AI to synthesize similarities, differences, and contradictions.
    """
    async def compare_files(
        self,
        file_ids: List[str],
        question: str = "Compare these documents and identify similarities, differences, and contradictions.",
        query_id: str = ""
    ) -> Tuple[str, List[Dict[str, Any]], float, int]:
        """
        Executes comparison across specified files.
        Returns: (comparison_answer, sources, moss_latency_ms, total_passages)
        """
        start = time.perf_counter()
        total_moss_latency = 0.0
        all_sources: List[Dict[str, Any]] = []
        doc_contexts: Dict[str, List[str]] = {}

        # 1. Retrieve context for each file
        for fid in file_ids:
            doc_rec = get_document(fid)
            fname = doc_rec["original_name"] if doc_rec else f"File_{fid[:6]}"

            # Query Moss for this specific file
            raw_docs, lat_ms = await moss_service.query(query_text=question, top_k=3)
            total_moss_latency += lat_ms

            # Filter docs matching this file
            file_passages = [d for d in raw_docs if d.get("metadata", {}).get("fileId") == fid]
            
            # If no direct chunk match by query, use file text directly if available
            if not file_passages and doc_rec and doc_rec.get("content"):
                file_passages = [{
                    "id": f"{fid}_direct",
                    "text": doc_rec["content"][:600],
                    "score": 1.0,
                    "metadata": {"filename": fname, "fileId": fid}
                }]

            doc_contexts[fname] = [p["text"] for p in file_passages]

            for p in file_passages:
                all_sources.append({
                    "title": fname,
                    "file_id": fid,
                    "file_name": fname,
                    "score": p.get("score", 1.0),
                    "snippet": p["text"][:200]
                })

            # Log COMPARED access event
            log_access_event(
                file_id=fid,
                action="COMPARED",
                query_id=query_id,
                chunks_retrieved=len(file_passages)
            )

        # 2. Build structured comparison prompt for Local AI
        doc_blocks = []
        for fname, passages in doc_contexts.items():
            content = "\n".join(f"- {p}" for p in passages) if passages else "No text extracted."
            doc_blocks.append(f"### Document: {fname}\n{content}")

        comparison_prompt = f"""You are performing a comparative analysis of the following documents:

{chr(10).join(doc_blocks)}

User Focus / Query:
{question}

Instructions:
1. Identify key SIMILARITIES across the documents.
2. Identify distinct DIFFERENCES between them.
3. Identify any factual CONTRADICTIONS or discrepancies (if none exist, explicitly state that no contradictions were detected; never invent contradictions).
4. Clearly cite the source document for each finding."""

        ai_answer, ai_latency, provider, model = await local_ai_service.generate(prompt=comparison_prompt)
        return ai_answer, all_sources, round(total_moss_latency, 2), len(all_sources), ai_latency, provider, model

comparison_service = ComparisonService()
