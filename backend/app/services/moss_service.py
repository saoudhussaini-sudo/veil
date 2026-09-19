import time
import re
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from app.config import settings

logger = logging.getLogger("veil.services.moss")

# Check for official Moss SDK
HAS_OFFICIAL_MOSS = False
try:
    import moss
    from moss import MossClient, DocumentInfo, QueryOptions
    HAS_OFFICIAL_MOSS = True
    logger.info("Official Moss SDK detected and ready.")
except ImportError:
    logger.warning("Official Moss SDK not detected in Python path; using local engine.")

STOPWORDS = {
    "what", "does", "the", "a", "an", "is", "are", "was", "were", "and", "or",
    "in", "on", "at", "of", "to", "for", "with", "about", "say", "it", "this",
    "that", "these", "those", "how", "why", "when", "where", "who", "which"
}

class MossService:
    """
    Dedicated Moss semantic retrieval layer.
    Uses the official Moss SDK when configured with MOSS_PROJECT_ID and MOSS_PROJECT_KEY.
    Provides on-device zero-latency local fallback for offline development.
    Always captures genuine measured retrieval latency.
    """
    def __init__(self):
        self.project_id = settings.MOSS_PROJECT_ID
        self.project_key = settings.MOSS_PROJECT_KEY
        self.index_name = settings.MOSS_INDEX_NAME
        self.client: Optional[Any] = None
        self.official_ready = False
        self.local_indexes: Dict[str, List[Dict[str, Any]]] = {self.index_name: []}
        self.loaded_indexes: set = {self.index_name}

        if HAS_OFFICIAL_MOSS and self.project_id and self.project_key:
            try:
                self.client = moss.MossClient(self.project_id, self.project_key)
                self.official_ready = True
                logger.info(f"Connected to official Moss client for index '{self.index_name}'")
            except Exception as e:
                logger.warning(f"Could not connect to official Moss client: {e}")

    async def clear_index(self, index_name: Optional[str] = None):
        """Clears all documents from the specified Moss index."""
        target_index = index_name or self.index_name
        self.local_indexes[target_index] = []

    async def replace_docs(self, docs: List[Dict[str, Any]], index_name: Optional[str] = None) -> float:
        """Atomically replaces all documents in the Moss index with the new docs set."""
        target_index = index_name or self.index_name
        self.local_indexes[target_index] = []
        return await self.add_docs(docs, index_name=target_index)

    async def add_docs(self, docs: List[Dict[str, Any]], index_name: Optional[str] = None) -> float:
        """
        Adds document chunks to the Moss index.
        Each doc has: id, text, metadata { fileId, filename, chunkIndex, sourceType }
        Returns the real elapsed time in milliseconds.
        """
        start = time.perf_counter()
        target_index = index_name or self.index_name

        if self.official_ready and self.client:
            try:
                moss_docs = []
                for d in docs:
                    moss_docs.append(moss.DocumentInfo(
                        id=d["id"],
                        text=d["text"],
                        metadata=d.get("metadata", {})
                    ))
                await self.client.add_docs(target_index, moss_docs)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                return elapsed_ms
            except Exception as e:
                logger.warning(f"Official Moss add_docs error: {e}. Storing in local runtime cache.")

        # Local in-process index
        if target_index not in self.local_indexes:
            self.local_indexes[target_index] = []

        existing_ids = {d["id"] for d in self.local_indexes[target_index]}
        for d in docs:
            if d["id"] not in existing_ids:
                self.local_indexes[target_index].append({
                    "id": d["id"],
                    "text": d["text"],
                    "metadata": d.get("metadata", {}),
                    "tokens": self._tokenize(d["text"])
                })
                existing_ids.add(d["id"])

        self.loaded_indexes.add(target_index)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return elapsed_ms

    async def query(
        self,
        query_text: str,
        index_name: Optional[str] = None,
        top_k: int = 4
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Queries the Moss index.
        Returns: (retrieved_documents, actual_latency_ms)
        """
        start = time.perf_counter()
        target_index = index_name or self.index_name

        if self.official_ready and self.client:
            try:
                opts = moss.QueryOptions(top_k=top_k)
                res = await self.client.query(target_index, query_text, options=opts)
                docs = []
                for hit in getattr(res, "documents", []):
                    docs.append({
                        "id": hit.id,
                        "text": hit.text,
                        "score": getattr(hit, "score", 1.0),
                        "metadata": getattr(hit, "metadata", {})
                    })
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                return docs, elapsed_ms
            except Exception as e:
                logger.warning(f"Official Moss query error: {e}. Using local runtime cache.")

        # Local in-process lexical + semantic proximity scoring
        docs = self.local_indexes.get(target_index, [])
        if not docs:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return [], elapsed_ms

        q_tokens = self._tokenize(query_text)
        total_docs = len(docs)
        avg_len = sum(len(d.get("tokens", [])) for d in docs) / max(total_docs, 1)

        # Precompute document frequencies across index for true BM25 IDF
        doc_freqs: Dict[str, int] = {}
        for d in docs:
            for t in set(d.get("tokens", [])):
                doc_freqs[t] = doc_freqs.get(t, 0) + 1

        scored = []
        for d in docs:
            score = self._compute_bm25_score(q_tokens, query_text, d, total_docs, avg_len, doc_freqs)
            if score > 0.001:
                scored.append((score, d))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored[:top_k]

        results = []
        for score, d in top_matches:
            results.append({
                "id": d["id"],
                "text": d["text"],
                "score": float(round(score, 3)),
                "metadata": d.get("metadata", {})
            })

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return results, elapsed_ms

    def _tokenize(self, text: str) -> List[str]:
        # Splits cleanly into alphanumeric words
        return re.findall(r'[a-zA-Z0-9_\-]+', text.lower())

    def _compute_bm25_score(
        self,
        query_tokens: List[str],
        raw_query: str,
        doc: Dict[str, Any],
        total_docs: int,
        avg_len: float,
        doc_freqs: Dict[str, int]
    ) -> float:
        doc_tokens = doc.get("tokens", [])
        doc_len = len(doc_tokens)
        if doc_len == 0 or not query_tokens:
            return 0.0

        k1 = 1.2
        b = 0.75
        tf_dict: Dict[str, int] = {}
        for t in doc_tokens:
            tf_dict[t] = tf_dict.get(t, 0) + 1

        bm25_score = 0.0
        matched_tokens = 0
        has_non_stop = any(t not in STOPWORDS for t in query_tokens)

        for qt in query_tokens:
            if qt in tf_dict:
                matched_tokens += 1
                tf = tf_dict[qt]
                df = doc_freqs.get(qt, 1)
                idf = math.log(1.0 + (total_docs - df + 0.5) / (df + 0.5))

                weight = 1.0
                if qt in STOPWORDS and has_non_stop:
                    weight = 0.1
                elif qt.isdigit():
                    weight = 2.5

                num = tf * (k1 + 1.0)
                denom = tf + k1 * (1.0 - b + b * (doc_len / max(avg_len, 1.0)))
                bm25_score += weight * idf * (num / denom)

        # Proximity, phrase, and metadata boost
        sub_boost = 0.0
        doc_lower = doc["text"].lower()
        query_lower = raw_query.lower()

        # Full query substring
        if query_lower in doc_lower:
            sub_boost += 3.0

        # Bigram matching for adjacent content tokens
        content_tokens = [t for t in query_tokens if t not in STOPWORDS]
        for i in range(len(content_tokens) - 1):
            bigram = f"{content_tokens[i]} {content_tokens[i+1]}"
            if bigram in doc_lower:
                sub_boost += 2.0

        # Metadata page matching (e.g. user asks for page 7)
        meta = doc.get("metadata", {})
        doc_page = meta.get("page")
        if doc_page is not None:
            page_str = str(doc_page)
            if f"page {page_str}" in query_lower or f"page: {page_str}" in query_lower or f"p.{page_str}" in query_lower:
                sub_boost += 5.0
            elif page_str in query_tokens and "page" in query_tokens:
                sub_boost += 4.0

        coverage = matched_tokens / max(len(query_tokens), 1)
        final_score = bm25_score + (coverage * 2.0) + sub_boost
        return final_score

moss_service = MossService()
