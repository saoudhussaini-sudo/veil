import time
import uuid
import logging
from typing import Dict, Any, List
from app.config import settings
from app.storage import db
from app.moss.client import moss_client
from app.llm.provider import get_llm_provider

logger = logging.getLogger("veil.services.query")

class QueryService:
    def __init__(self):
        self.index_name = settings.MOSS_DEFAULT_INDEX

    async def execute_query(self, question: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Executes end-to-end grounded query pipeline:
        1. Moss semantic retrieval on hot path
        2. Real latency measurement
        3. LLM generation with retrieved context
        4. Structured source formatting and persistence
        """
        if not question or not question.strip():
            raise ValueError("Question cannot be empty.")

        clean_question = question.strip()
        query_id = str(uuid.uuid4())

        # 1. Moss Retrieval
        moss_res = await moss_client.query(
            index_name=self.index_name,
            query_text=clean_question,
            top_k=top_k
        )

        retrieval_latency = moss_res.time_taken_ms

        # 2. Context assembly
        context_chunks = []
        sources_map = {}

        for doc in moss_res.docs:
            meta = doc.metadata or {}
            source_file = meta.get("source", "Document")
            doc_id = meta.get("doc_id", "")
            chunk_idx = meta.get("chunk_index", 0)

            chunk_info = {
                "id": doc.id,
                "doc_id": doc_id,
                "chunk_index": chunk_idx,
                "source": source_file,
                "score": round(doc.score, 3),
                "text": doc.text
            }
            context_chunks.append(chunk_info)

            # Group for clean source list
            if source_file not in sources_map:
                sources_map[source_file] = {
                    "doc_id": doc_id,
                    "filename": source_file,
                    "max_score": round(doc.score, 3),
                    "matched_chunks": 1,
                    "preview": doc.text[:180] + ("..." if len(doc.text) > 180 else "")
                }
            else:
                sources_map[source_file]["matched_chunks"] += 1
                if doc.score > sources_map[source_file]["max_score"]:
                    sources_map[source_file]["max_score"] = round(doc.score, 3)

        sources_list = sorted(sources_map.values(), key=lambda s: s["max_score"], reverse=True)

        # 3. LLM Generation
        llm = get_llm_provider()
        llm_output = await llm.generate(clean_question, context_chunks)
        answer = llm_output["answer"]
        llm_latency = llm_output["llm_time_ms"]

        # 4. Save query log
        db.save_query_log(
            query_id=query_id,
            question=clean_question,
            answer=answer,
            sources=sources_list,
            retrieval_time_ms=retrieval_latency,
            llm_time_ms=llm_latency
        )

        return {
            "query_id": query_id,
            "question": clean_question,
            "answer": answer,
            "sources": sources_list,
            "retrievalLatency": retrieval_latency,
            "llmLatency": llm_latency,
            "retrievedCount": len(context_chunks),
            "retrievalDetails": {
                "query": clean_question,
                "time_taken_ms": retrieval_latency,
                "index_name": moss_res.index_name,
                "model_id": moss_res.model_id,
                "mode": moss_res.mode,
                "chunks": [
                    {
                        "id": c["id"],
                        "source": c["source"],
                        "score": c["score"],
                        "snippet": c["text"][:220] + ("..." if len(c["text"]) > 220 else "")
                    }
                    for c in context_chunks
                ]
            }
        }

query_service = QueryService()
