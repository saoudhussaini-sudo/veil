import uuid
import re
import time
import logging
from typing import Dict, Any, List, Optional
from app.services.local_ai_service import local_ai_service
from app.services.moss_service import moss_service
from app.services.comparison_service import comparison_service
from app.services.analysis_service import analysis_service
from app.storage.database import (
    save_query,
    log_access_event,
    list_documents,
    get_document
)
from app.models.query_models import (
    QueryResponse,
    RoutingInfo,
    SourceItem,
    MossInfo,
    LocalAIInfo,
    AccessedFileItem
)

logger = logging.getLogger("veil.services.orchestrator")

class QueryOrchestrator:
    """
    10-Step Query Orchestration Pipeline (Section 37).
    The Local AI is the brain.
    Moss is the memory/retrieval layer.
    User files are the private knowledge source.
    Local analytics track what data was actually accessed.
    """

    async def execute_query(
        self,
        question: str,
        mode: str = "AUTO",
        top_k: int = 4,
        file_ids: Optional[List[str]] = None
    ) -> QueryResponse:
        query_id = str(uuid.uuid4())
        q_clean = question.strip()
        user_files = list_documents()

        # STEP 2: Determine Intent
        intent = self._classify_intent(q_clean, mode, user_files, file_ids)
        logger.info(f"Query '{q_clean[:40]}...' routed to mode: {intent}")

        # STEP 3: DIRECT (General-Purpose Local AI)
        if intent == "DIRECT":
            answer, ai_latency, provider, model = await local_ai_service.generate(prompt=q_clean)
            
            # Save query log (no file access events)
            save_query(
                query_id=query_id,
                question=q_clean,
                answer=answer,
                routing_mode="DIRECT",
                moss_used=False,
                moss_passages=0,
                moss_latency_ms=None,
                ai_provider=provider,
                ai_model=model,
                ai_latency_ms=ai_latency,
                sources=[]
            )

            return QueryResponse(
                answer=answer,
                routing=RoutingInfo(mode="DIRECT"),
                sources=[],
                moss=MossInfo(used=False, passages=0, latencyMs=None),
                localAI=LocalAIInfo(used=True, provider=provider, model=model, latencyMs=ai_latency),
                accessedFiles=[],
                query_id=query_id
            )

        # STEP 5: ANALYSIS (Local Deterministic Processing)
        if intent == "ANALYSIS":
            target_doc = None
            if file_ids and len(file_ids) > 0:
                target_doc = get_document(file_ids[0])
            else:
                # Find matching structured file in query
                for f in user_files:
                    if f["filename"].lower() in q_clean.lower() or f.get("original_name", "").lower() in q_clean.lower():
                        target_doc = f
                        break
                if not target_doc:
                    # Pick first spreadsheet/csv file if available
                    for f in user_files:
                        if f["file_type"] in ["csv", "xlsx", "xls", "json"]:
                            target_doc = f
                            break

            if target_doc:
                from app.config import settings
                import os
                fpath = os.path.join(settings.FILES_DIR, target_doc["filename"])
                fname = target_doc.get("original_name") or target_doc["filename"]
                fext = target_doc.get("file_type", "")
                answer, metrics, lat = await analysis_service.analyze_structured_data(
                    file_path=fpath,
                    filename=fname,
                    file_ext=fext,
                    query=q_clean
                )

                # Log ANALYZED event
                log_access_event(
                    file_id=target_doc["id"],
                    action="ANALYZED",
                    query_id=query_id,
                    chunks_retrieved=0
                )

                save_query(
                    query_id=query_id,
                    question=q_clean,
                    answer=answer,
                    routing_mode="ANALYSIS",
                    moss_used=False,
                    moss_passages=0,
                    moss_latency_ms=None,
                    ai_provider="local-deterministic",
                    ai_model="veil-analyzer",
                    ai_latency_ms=lat,
                    sources=[{"title": fname, "file_id": target_doc["id"], "score": 1.0}]
                )

                return QueryResponse(
                    answer=answer,
                    routing=RoutingInfo(mode="ANALYSIS"),
                    sources=[SourceItem(
                        title=fname,
                        file_id=target_doc["id"],
                        file_name=fname,
                        score=1.0,
                        snippet=f"Structured dataset analyzed ({metrics.get('total_rows', 0)} rows)"
                    )],
                    moss=MossInfo(used=False, passages=0, latencyMs=None),
                    localAI=LocalAIInfo(used=True, provider="local-deterministic", model="veil-analyzer", latencyMs=lat),
                    accessedFiles=[AccessedFileItem(fileId=target_doc["id"], filename=fname, action="ANALYZED")],
                    query_id=query_id
                )

        # STEP 6: COMPARISON
        if intent == "COMPARISON":
            comp_file_ids = file_ids or []
            if not comp_file_ids or len(comp_file_ids) < 2:
                # Detect mentioned files
                mentioned = []
                for f in user_files:
                    fname = f.get("original_name") or f.get("filename")
                    if fname.lower() in q_clean.lower():
                        mentioned.append(f["id"])
                if len(mentioned) >= 2:
                    comp_file_ids = mentioned
                else:
                    # Fallback to top 2 available files
                    comp_file_ids = [f["id"] for f in user_files[:2]]

            if comp_file_ids:
                answer, sources, moss_lat, passages, ai_lat, provider, model = await comparison_service.compare_files(
                    file_ids=comp_file_ids,
                    question=q_clean,
                    query_id=query_id
                )

                accessed = []
                for fid in comp_file_ids:
                    doc = get_document(fid)
                    accessed.append(AccessedFileItem(
                        fileId=fid,
                        filename=doc["original_name"] if doc else "File",
                        action="COMPARED"
                    ))

                save_query(
                    query_id=query_id,
                    question=q_clean,
                    answer=answer,
                    routing_mode="COMPARISON",
                    moss_used=True,
                    moss_passages=passages,
                    moss_latency_ms=moss_lat,
                    ai_provider=provider,
                    ai_model=model,
                    ai_latency_ms=ai_lat,
                    sources=sources
                )

                return QueryResponse(
                    answer=answer,
                    routing=RoutingInfo(mode="COMPARISON"),
                    sources=[SourceItem(**s) for s in sources],
                    moss=MossInfo(used=True, passages=passages, latencyMs=moss_lat),
                    localAI=LocalAIInfo(used=True, provider=provider, model=model, latencyMs=ai_lat),
                    accessedFiles=accessed,
                    query_id=query_id
                )

        # STEP 4: RETRIEVAL (Query Moss)
        raw_docs, moss_lat = await moss_service.query(query_text=q_clean, top_k=top_k)

        # Build Sources & Context
        sources: List[SourceItem] = []
        accessed_map: Dict[str, AccessedFileItem] = {}

        for doc in raw_docs:
            meta = doc.get("metadata", {})
            fid = meta.get("document_id") or meta.get("fileId") or meta.get("doc_id") or ""
            fname = meta.get("filename") or "Document"
            c_idx = meta.get("chunk") or meta.get("chunkIndex") or 0
            page = meta.get("page")
            snippet = doc.get("text", "")[:240]

            sources.append(SourceItem(
                title=fname,
                file_id=fid,
                file_name=fname,
                score=doc.get("score", 1.0),
                snippet=snippet,
                chunk_index=c_idx,
                page=page
            ))

            if fid:
                if fid not in accessed_map:
                    accessed_map[fid] = AccessedFileItem(
                        fileId=fid,
                        filename=fname,
                        action="RETRIEVED",
                        chunksRetrieved=1
                    )
                else:
                    accessed_map[fid].chunksRetrieved += 1

        # STEP 8: Call Local AI with Context
        if raw_docs:
            answer, ai_latency, provider, model = await local_ai_service.reason_with_context(
                question=q_clean,
                context_chunks=raw_docs,
                mode="RETRIEVAL"
            )
        else:
            # Section 20: ZERO MOSS RESULTS
            # Do NOT fail. Distinguish requested file from general query.
            if any(term in q_clean.lower() for term in ["my file", "my notes", "the pdf", "the document", ".txt", ".md", ".pdf"]):
                answer = f"I searched your workspace with Moss but found no passages matching '{q_clean}'.\n\nHere is what I can explain based on general knowledge:\n\n"
                gen_ans, ai_latency, provider, model = await local_ai_service.generate(prompt=q_clean)
                answer += gen_ans
            else:
                answer, ai_latency, provider, model = await local_ai_service.generate(prompt=q_clean)

        # STEP 10: Log access events in SQLite
        for fid, item in accessed_map.items():
            log_access_event(
                file_id=fid,
                action="RETRIEVED",
                query_id=query_id,
                chunks_retrieved=item.chunksRetrieved
            )

        # Save query in SQLite
        save_query(
            query_id=query_id,
            question=q_clean,
            answer=answer,
            routing_mode="RETRIEVAL",
            moss_used=True,
            moss_passages=len(raw_docs),
            moss_latency_ms=moss_lat,
            ai_provider=provider,
            ai_model=model,
            ai_latency_ms=ai_latency,
            sources=[s.dict() for s in sources]
        )

        return QueryResponse(
            answer=answer,
            routing=RoutingInfo(mode="RETRIEVAL"),
            sources=sources,
            moss=MossInfo(used=True, passages=len(raw_docs), latencyMs=moss_lat),
            localAI=LocalAIInfo(used=True, provider=provider, model=model, latencyMs=ai_latency),
            accessedFiles=list(accessed_map.values()),
            query_id=query_id
        )

    def _classify_intent(
        self,
        query: str,
        mode: str,
        user_files: List[Dict[str, Any]],
        file_ids: Optional[List[str]] = None
    ) -> str:
        """
        Classifies query intent into: DIRECT, RETRIEVAL, ANALYSIS, COMPARISON.
        """
        if mode == "COMPARE":
            return "COMPARISON"
        if mode == "FILES":
            return "RETRIEVAL"

        q_lower = query.lower()

        # Check for local knowledge indicators (e.g. "in my file", "with my notes", "the pdf", "page")
        if any(term in q_lower for term in [
            "in my file", "in my notes", "with my notes", "from my notes", "uploaded",
            "my document", "my report", "the pdf", "this pdf", "my pdf", "the document",
            "this document", "what does the pdf", "what does page", "page ", "page 1", "page 2",
            "page 3", "page 4", "page 5", "page 6", "page 7", "page 8", "page 9", "page 10",
            "research.pdf", "test.pdf", ".pdf", ".txt", ".md", ".docx"
        ]):
            return "RETRIEVAL"

        # Check for explicit file references in query
        matched_files = [f for f in user_files if (f.get("original_name") or f.get("filename", "")).lower() in q_lower]

        # Check for comparison keywords
        if any(w in q_lower for w in ["compare", "comparison", "versus", "vs.", "contradiction", "differences between"]):
            if len(matched_files) >= 2 or (file_ids and len(file_ids) >= 2):
                return "COMPARISON"
            elif any(ext in q_lower for ext in [".txt", ".pdf", ".md", ".json", ".csv"]):
                return "COMPARISON"
            elif not matched_files:
                return "COMPARISON"

        # Check for deterministic analysis keywords
        if any(w in q_lower for w in ["average", "mean", "calculate", "sum of", "total of", "minimum", "maximum", "how many rows"]):
            if any(f["file_type"] in ["csv", "xlsx", "xls", "json"] for f in user_files):
                return "ANALYSIS"

        # If a single file was referenced
        if matched_files:
            return "RETRIEVAL"

        # If files exist and query asks about specific project/internal terms
        if any(term in q_lower for term in ["codename", "project", "architecture", "internal"]):
            if user_files:
                return "RETRIEVAL"

        # Default for normal assistant questions
        return "DIRECT"

query_orchestrator = QueryOrchestrator()
