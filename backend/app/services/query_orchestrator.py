import os
import uuid
import re
import time
import logging
from typing import Dict, Any, List, Optional, Tuple
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
from app.config import settings
from app.llm.provider import SYSTEM_PROMPT
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
    Search & Reasoning Orchestration Pipeline.
    1. Query routing (Search / Retrieval / Comparison / Direct)
    2. Fast local Windows retrieval via native MOSS (sub-10ms)
    3. Minimal relevant context extraction
    4. Reasoning and generation via Google Gemini API
    5. Strict source-aware responses with filenames & paths
    6. Robust error handling per architectural specifications
    """

    def _is_meta_question(self, query: str) -> bool:
        """Detects if query is asking about VEIL's capabilities, identity, or purpose."""
        q = query.lower().strip(" ?.!,")
        meta_phrases = [
            "what are you used for",
            "what are you",
            "who are you",
            "what is veil",
            "what can you do",
            "what do you do",
            "how do you work",
            "what are your capabilities",
            "what is this app",
            "what is this application",
            "help",
            "tell me about yourself",
            "explain veil",
        ]
        return any(q == p or q.startswith(p) or f" {p}" in q for p in meta_phrases)

    def _synthesize_from_chunks(self, question: str, chunks: List[Dict[str, Any]]) -> str:
        """Fallback grounded summary directly from retrieved MOSS chunks when Gemini is temporarily unavailable."""
        if not chunks:
            return "No relevant local files were found."

        lines = [
            "Notice: Google Gemini AI service is momentarily experiencing high demand. VEIL retrieved the following relevant passages directly from your local documents:\n"
        ]
        for i, c in enumerate(chunks[:3], 1):
            meta = c.get("metadata", {})
            fname = meta.get("filename") or c.get("file_name") or f"Document {i}"
            text = (c.get("text") or c.get("snippet") or "").strip()
            if len(text) > 400:
                text = text[:400] + "..."
            lines.append(f"### Passages from {fname}:\n> {text}\n")
        lines.append("*(Sources are cited below. You can query again in a moment to obtain a full AI synthesis.)*")
        return "\n".join(lines)

    async def _safe_generate(self, prompt: str, system: Optional[str] = None) -> Tuple[str, float, str, str]:
        """Safely executes generation with standardized error handling."""
        try:
            return await local_ai_service.generate(prompt=prompt, system=system)
        except Exception as e:
            logger.error(f"Gemini generation call failed: {e}", exc_info=True)
            provider = getattr(local_ai_service, "provider", settings.LLM_PROVIDER)
            model = getattr(local_ai_service, "model", settings.GEMINI_MODEL)
            err_str = str(e)
            if "Gemini API key is not configured" in err_str or "key is not configured" in err_str:
                return "Gemini API key is not configured.", 0.0, provider, model
            elif "Gemini is currently unavailable" in err_str or "unavailable" in err_str:
                return "Gemini is currently unavailable.", 0.0, provider, model
            return "Gemini is currently unavailable.", 0.0, provider, model

    async def _safe_reason(self, question: str, context_chunks: List[Dict[str, Any]], mode: str = "RETRIEVAL") -> Tuple[str, float, str, str]:
        """Safely executes context reasoning with standardized error handling."""
        provider = getattr(local_ai_service, "provider", settings.LLM_PROVIDER)
        model = getattr(local_ai_service, "model", settings.GEMINI_MODEL)
        try:
            ans, lat, p, m = await local_ai_service.reason_with_context(question=question, context_chunks=context_chunks, mode=mode)
            if ans and not ans.startswith("Gemini is currently unavailable"):
                return ans, lat, p, m
            if context_chunks:
                return self._synthesize_from_chunks(question, context_chunks), lat, p, m
            return ans, lat, p, m
        except Exception as e:
            logger.error(f"Gemini reasoning call failed: {e}", exc_info=True)
            err_str = str(e)
            if "Gemini API key is not configured" in err_str or "key is not configured" in err_str:
                return "Gemini API key is not configured.", 0.0, provider, model
            if context_chunks:
                return self._synthesize_from_chunks(question, context_chunks), 0.0, provider, model
            return "Gemini is currently unavailable.", 0.0, provider, model

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
        provider = getattr(local_ai_service, "provider", settings.LLM_PROVIDER)
        model = getattr(local_ai_service, "model", settings.GEMINI_MODEL)

        # STEP 1: Handle meta questions regarding VEIL
        if self._is_meta_question(q_clean):
            ai_latency = 0.0
            default_meta_answer = (
                "VEIL is an AI intelligence workspace powered by Google Gemini and native MOSS local retrieval.\n\n"
                "Key capabilities:\n"
                "• Ultra-Fast Local File Search: Uses MOSS to search local Windows files and document chunks in milliseconds (~5-10ms range).\n"
                "• Advanced Reasoning via Gemini: Synthesizes answers strictly from retrieved local documents with source citations.\n"
                "• Air-Gapped Privacy: Never uploads your entire Windows filesystem to the cloud; only minimal relevant context is passed to Gemini.\n"
                "• Multi-Document Comparison: Compares local documents side-by-side to highlight agreements, differences, and discrepancies.\n"
                "• Deterministic Data Analysis: Evaluates structured datasets (CSV, Excel, JSON) locally.\n\n"
                "Note: No local files were queried for this capability summary."
            )
            try:
                gen_answer, lat, p, m = await self._safe_generate(
                    prompt=f"Explain what VEIL is used for: an AI intelligence workspace powered by Google Gemini and native MOSS local retrieval for Windows files.",
                    system=SYSTEM_PROMPT
                )
                if gen_answer and not gen_answer.startswith("Gemini"):
                    answer = gen_answer
                    ai_latency = lat
                else:
                    answer = default_meta_answer
            except Exception:
                answer = default_meta_answer

            effective_mode = "RETRIEVAL" if mode == "FILES" else "DIRECT"
            save_query(
                query_id=query_id,
                question=q_clean,
                answer=answer,
                routing_mode=effective_mode,
                moss_used=False,
                moss_passages=0,
                moss_latency_ms=0.0,
                ai_provider=provider,
                ai_model=model,
                ai_latency_ms=ai_latency,
                sources=[]
            )

            return QueryResponse(
                answer=answer,
                routing=RoutingInfo(mode=effective_mode),
                sources=[],
                moss=MossInfo(used=False, passages=0, latencyMs=0.0),
                localAI=LocalAIInfo(used=True, provider=provider, model=model, latencyMs=ai_latency),
                accessedFiles=[],
                query_id=query_id
            )

        # STEP 2: Determine Intent & Routing Mode
        intent = self._classify_intent(q_clean, mode, user_files, file_ids)
        logger.info(f"Query '{q_clean[:40]}...' routed to mode: {intent}")

        # STEP 3: DIRECT (General-Purpose Gemini Reasoning)
        if intent == "DIRECT":
            answer, ai_latency, provider, model = await self._safe_generate(prompt=q_clean)
            
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
                moss=MossInfo(used=False, passages=0, latencyMs=0.0),
                localAI=LocalAIInfo(used=True, provider=provider, model=model, latencyMs=ai_latency),
                accessedFiles=[],
                query_id=query_id
            )

        # STEP 4: ANALYSIS (Deterministic Data File Analysis)
        if intent == "ANALYSIS":
            data_file = None
            if file_ids:
                data_file = get_document(file_ids[0])
            if not data_file:
                for f in user_files:
                    if f["file_type"] in ["csv", "xlsx", "xls", "json"] and f["original_name"].lower() in q_clean.lower():
                        data_file = f
                        break
            if not data_file:
                for f in user_files:
                    if f["file_type"] in ["csv", "xlsx", "xls", "json"]:
                        data_file = f
                        break

            if data_file:
                try:
                    ans, sources, lat, _ = await analysis_service.analyze(
                        file_id=data_file["id"],
                        question=q_clean,
                        query_id=query_id
                    )
                    save_query(
                        query_id=query_id,
                        question=q_clean,
                        answer=ans,
                        routing_mode="ANALYSIS",
                        moss_used=False,
                        moss_passages=0,
                        moss_latency_ms=0.0,
                        ai_provider=provider,
                        ai_model=model,
                        ai_latency_ms=lat,
                        sources=sources
                    )
                    return QueryResponse(
                        answer=ans,
                        routing=RoutingInfo(mode="ANALYSIS"),
                        sources=[SourceItem(**s) for s in sources],
                        moss=MossInfo(used=False, passages=0, latencyMs=0.0),
                        localAI=LocalAIInfo(used=True, provider=provider, model=model, latencyMs=lat),
                        accessedFiles=[AccessedFileItem(
                            fileId=data_file["id"],
                            filename=data_file.get("original_name") or data_file.get("filename", "Data File"),
                            action="ANALYZED"
                        )],
                        query_id=query_id
                    )
                except Exception as e:
                    logger.error(f"Analysis engine exception: {e}", exc_info=True)

        # STEP 5: COMPARISON (Multi-Document Synthesis)
        if intent == "COMPARISON":
            comp_file_ids = file_ids or []
            if len(comp_file_ids) < 2:
                mentioned = [
                    f["id"] for f in user_files
                    if (f.get("original_name") or f.get("filename", "")).lower() in q_clean.lower()
                ]
                if len(mentioned) >= 2:
                    comp_file_ids = mentioned
                else:
                    comp_file_ids = [f["id"] for f in user_files[:2]]

            if len(comp_file_ids) >= 2:
                try:
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
                except Exception as e:
                    logger.error(f"Comparison service error: {e}", exc_info=True)

            # Fallback if insufficient files exist
            answer = "Document comparison requires at least two files in your workspace. Please upload two or more documents in the Files section to compare them."
            return QueryResponse(
                answer=answer,
                routing=RoutingInfo(mode="COMPARISON"),
                sources=[],
                moss=MossInfo(used=False, passages=0, latencyMs=0.0),
                localAI=LocalAIInfo(used=False, provider=provider, model=model, latencyMs=0.0),
                accessedFiles=[],
                query_id=query_id
            )

        # STEP 6: RETRIEVAL & SEARCH (Query MOSS -> Context Extraction -> Gemini Reasoning)
        try:
            raw_docs, moss_lat = await moss_service.query(query_text=q_clean, top_k=top_k)
        except Exception as e:
            logger.error(f"MOSS local retrieval failure: {e}", exc_info=True)
            return QueryResponse(
                answer="Local file search is unavailable. Please check the MOSS connection.",
                routing=RoutingInfo(mode="RETRIEVAL"),
                sources=[],
                moss=MossInfo(used=False, passages=0, latencyMs=0.0),
                localAI=LocalAIInfo(used=False, provider=provider, model=model, latencyMs=0.0),
                accessedFiles=[],
                query_id=query_id
            )

        # Zero results from local retrieval
        if not raw_docs:
            answer = "No relevant local files were found."
            save_query(
                query_id=query_id,
                question=q_clean,
                answer=answer,
                routing_mode="RETRIEVAL",
                moss_used=True,
                moss_passages=0,
                moss_latency_ms=moss_lat,
                ai_provider=provider,
                ai_model=model,
                ai_latency_ms=0.0,
                sources=[]
            )
            return QueryResponse(
                answer=answer,
                routing=RoutingInfo(mode="RETRIEVAL"),
                sources=[],
                moss=MossInfo(used=True, passages=0, latencyMs=moss_lat),
                localAI=LocalAIInfo(used=False, provider=provider, model=model, latencyMs=0.0),
                accessedFiles=[],
                query_id=query_id
            )

        # Build Sources & Context (skipping unreadable chunks)
        sources: List[SourceItem] = []
        valid_chunks: List[Dict[str, Any]] = []
        accessed_map: Dict[str, AccessedFileItem] = {}

        for doc in raw_docs:
            try:
                meta = doc.get("metadata", {})
                fid = meta.get("document_id") or meta.get("fileId") or meta.get("doc_id") or ""
                fname = meta.get("filename") or "Document"
                fpath = meta.get("path") or meta.get("storage_path") or ""
                c_idx = meta.get("chunk") or meta.get("chunkIndex") or 0
                page = meta.get("page")
                snippet = doc.get("text", "")[:260]

                sources.append(SourceItem(
                    title=fname,
                    file_id=fid,
                    file_name=fname,
                    path=fpath,
                    score=doc.get("score", 1.0),
                    snippet=snippet,
                    chunk_index=c_idx,
                    page=page
                ))
                valid_chunks.append(doc)

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
            except Exception as read_err:
                logger.warning(f"Skipping unreadable chunk in retrieval: {read_err}")
                continue

        if not valid_chunks:
            return QueryResponse(
                answer="No relevant local files were found.",
                routing=RoutingInfo(mode="RETRIEVAL"),
                sources=[],
                moss=MossInfo(used=True, passages=0, latencyMs=moss_lat),
                localAI=LocalAIInfo(used=False, provider=provider, model=model, latencyMs=0.0),
                accessedFiles=[],
                query_id=query_id
            )

        # Pass retrieved context to Gemini for strictly grounded reasoning
        answer, ai_latency, provider, model = await self._safe_reason(
            question=q_clean,
            context_chunks=valid_chunks,
            mode="RETRIEVAL"
        )

        # Log file access events in SQLite
        for fid, item in accessed_map.items():
            log_access_event(
                file_id=fid,
                action="RETRIEVED",
                query_id=query_id,
                chunks_retrieved=item.chunksRetrieved
            )

        save_query(
            query_id=query_id,
            question=q_clean,
            answer=answer,
            routing_mode="RETRIEVAL",
            moss_used=True,
            moss_passages=len(valid_chunks),
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
            moss=MossInfo(used=True, passages=len(valid_chunks), latencyMs=moss_lat),
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
        """Classifies query intent into: DIRECT, RETRIEVAL, ANALYSIS, COMPARISON."""
        if mode == "COMPARE":
            return "COMPARISON"
        if mode == "FILES":
            return "RETRIEVAL"

        q_lower = query.lower()

        # Check for search or retrieval keywords
        if any(term in q_lower for term in [
            "find my", "search my", "find notes", "find file", "notes",
            "in my file", "in my notes", "with my notes", "from my notes", "uploaded",
            "my document", "my documents", "my research", "my files", "my folder",
            "my report", "summarize", "summary of", "what does my", "what do my",
            "the pdf", "this pdf", "my pdf", "the document", "this document",
            "project folder", "inside my", "page ", "page 1", "page 2",
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

        return "DIRECT"

query_orchestrator = QueryOrchestrator()
