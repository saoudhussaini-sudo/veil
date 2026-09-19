import time
import json
import logging
import httpx
from typing import List, Dict, Any, Optional, Tuple, AsyncGenerator
from app.config import settings

logger = logging.getLogger("veil.services.local_ai")

SYSTEM_PROMPT = """You are VEIL, a privacy-first, local-first general-purpose AI assistant.

You can answer general questions, explain concepts, write and analyze code, reason about problems, brainstorm, summarize information, and assist with technical and non-technical tasks.

When local file context is provided:
- Use it to answer the user's specific questions.
- Distinguish local evidence from your general knowledge.
- Do not invent information that is absent from the supplied context.
- Explicitly cite relevant local sources and filenames.

When no local file context is provided:
- Answer normally and comprehensively using your general knowledge.
- Never claim that you cannot answer merely because no retrieved file context exists.

You operate locally and privately."""

class LocalAIService:
    """
    Local AI generative runtime communicating directly with Ollama.
    Never uses remote cloud LLMs (no OpenAI, Gemini, Claude, etc.).
    Auto-discovers installed models and tracks real, measured inference latencies.
    """
    def __init__(self):
        self.provider = settings.LOCAL_AI_PROVIDER
        self.base_url = settings.LOCAL_AI_BASE_URL.rstrip("/")
        self.model = settings.LOCAL_AI_MODEL
        self._cached_models: List[str] = []
        self._models_cached_at: float = 0.0
        logger.info(f"LocalAIService initialized: provider={self.provider}, default_model={self.model}, base_url={self.base_url}")

    async def get_available_models(self) -> List[str]:
        """Queries Ollama /api/tags for installed models with 30s caching."""
        now = time.time()
        if self._cached_models and (now - self._models_cached_at < 30.0):
            return self._cached_models
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", []) if m.get("name")]
                    self._cached_models = models
                    self._models_cached_at = now
                    return models
        except Exception as e:
            logger.warning(f"Failed to query Ollama models at {self.base_url}: {e}")
        return self._cached_models

    async def ensure_active_model(self) -> str:
        """Ensures that self.model is set to an existing model on Ollama."""
        available = await self.get_available_models()
        if not available:
            return self.model

        # Exact or prefix match
        if self.model in available:
            return self.model

        prefix_match = next((m for m in available if m.startswith(self.model) or self.model.startswith(m)), None)
        if prefix_match:
            self.model = prefix_match
            return self.model

        # Fallback to the first installed model
        self.model = available[0]
        return self.model

    def set_model(self, model_name: str) -> str:
        """Switches active model at runtime."""
        self.model = model_name.strip()
        logger.info(f"Local AI model switched to: {self.model}")
        return self.model

    async def check_health(self) -> Dict[str, Any]:
        """Checks connectivity and returns status, active model, and installed models."""
        start = time.perf_counter()
        try:
            models = await self.get_available_models()
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            if models:
                await self.ensure_active_model()
                return {
                    "connected": True,
                    "provider": "ollama",
                    "model": self.model,
                    "available_models": models,
                    "latencyMs": elapsed_ms
                }
            else:
                return {
                    "connected": False,
                    "provider": "ollama",
                    "model": self.model,
                    "available_models": [],
                    "latencyMs": elapsed_ms,
                    "error": "No models installed in Ollama. Pull a model via `ollama pull qwen2.5:0.5b`."
                }
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "connected": False,
                "provider": "ollama",
                "model": self.model,
                "available_models": [],
                "latencyMs": elapsed_ms,
                "error": f"Ollama daemon unreachable at {self.base_url}: {str(e)}"
            }

    async def test_generate(self, prompt: str) -> Dict[str, Any]:
        """
        Executes a real test generation against Ollama with precise latency measurement.
        Used for verification and UI diagnostic checks.
        """
        await self.ensure_active_model()
        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3
                }
            }
            res = await client.post(f"{self.base_url}/api/generate", json=payload)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

            if res.status_code == 200:
                data = res.json()
                answer = data.get("response", "").strip()
                return {
                    "prompt": prompt,
                    "response": answer,
                    "latencyMs": elapsed_ms,
                    "model": self.model,
                    "provider": "ollama",
                    "status": "success",
                    "eval_count": data.get("eval_count"),
                    "eval_duration_ms": round(data.get("eval_duration", 0) / 1e6, 2) if data.get("eval_duration") else None
                }
            else:
                raise RuntimeError(f"Ollama returned HTTP {res.status_code}: {res.text}")

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.3
    ) -> Tuple[str, float, str, str]:
        """
        Executes prompt generation with real Ollama instruct LLM.
        Returns: (answer_text, latency_ms, provider_name, model_name)
        """
        await self.ensure_active_model()
        start = time.perf_counter()
        sys = system or SYSTEM_PROMPT

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "system": sys,
                    "stream": False,
                    "options": {"temperature": temperature}
                }
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

                if res.status_code == 200:
                    data = res.json()
                    answer = data.get("response", "").strip()
                    return answer, elapsed_ms, "ollama", self.model
                else:
                    raise RuntimeError(f"Ollama returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error(f"Local AI generate error: {e}")
            raise RuntimeError(f"Local AI generation failed on {self.model} ({self.base_url}): {str(e)}")

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3
    ) -> Tuple[str, float, str, str]:
        """
        Executes multi-turn chat generation with real Ollama chat endpoint.
        """
        await self.ensure_active_model()
        start = time.perf_counter()

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                payload = {
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": temperature}
                }
                res = await client.post(f"{self.base_url}/api/chat", json=payload)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

                if res.status_code == 200:
                    data = res.json()
                    answer = data.get("message", {}).get("content", "").strip()
                    return answer, elapsed_ms, "ollama", self.model
                else:
                    raise RuntimeError(f"Ollama chat returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error(f"Local AI chat error: {e}")
            raise RuntimeError(f"Local AI chat failed on {self.model}: {str(e)}")

    async def reason_with_context(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        mode: str = "RETRIEVAL"
    ) -> Tuple[str, float, str, str]:
        """
        Executes reasoning over retrieved local file chunks via Ollama.
        """
        await self.ensure_active_model()
        start = time.perf_counter()

        # Build prompt with passages
        ctx_blocks = []
        for i, c in enumerate(context_chunks, 1):
            meta = c.get("metadata", {})
            fname = meta.get("filename") or c.get("file_name") or "Local Document"
            page = meta.get("page")
            page_str = f"Page {page}" if page else f"Chunk {i}"
            txt = c.get("text") or c.get("chunk_text") or c.get("snippet") or ""
            ctx_blocks.append(f"[{fname} — {page_str}]\n{txt.strip()}")

        context_text = "\n\n".join(ctx_blocks)

        prompt = f"""RETRIEVED LOCAL CONTEXT:
{context_text}

USER QUESTION:
{question}

Answer using the retrieved context. Explicitly cite the document and page number when answering from the context."""

        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "system": SYSTEM_PROMPT,
                    "stream": False,
                    "options": {"temperature": 0.2}
                }
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

                if res.status_code == 200:
                    answer = res.json().get("response", "").strip()
                    return answer, elapsed_ms, "ollama", self.model
                else:
                    raise RuntimeError(f"Ollama returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.error(f"Local AI reason_with_context error: {e}")
            raise RuntimeError(f"Local AI context reasoning failed on {self.model}: {str(e)}")

    async def stream_generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        context_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams generated tokens directly from Ollama.
        """
        await self.ensure_active_model()
        sys = system or SYSTEM_PROMPT
        full_prompt = prompt

        if context_chunks:
            ctx_blocks = []
            for i, c in enumerate(context_chunks, 1):
                fname = c.get("metadata", {}).get("filename") or c.get("file_name") or "Local Document"
                txt = c.get("text") or c.get("chunk_text") or c.get("snippet") or ""
                ctx_blocks.append(f"[{fname} - Chunk {i}]\n{txt.strip()}")
            context_text = "\n\n".join(ctx_blocks)
            full_prompt = f"""Retrieved Local File Context:
{context_text}

User Question:
{prompt}

Instructions: Answer the user's question thoroughly based on the context above, citing file names."""

        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": self.model,
                "prompt": full_prompt,
                "system": sys,
                "stream": True,
                "options": {"temperature": 0.3}
            }
            async with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as res:
                async for line in res.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            token = data.get("response", "")
                            if token:
                                yield token
                            if data.get("done", False):
                                break
                        except Exception:
                            continue

local_ai_service = LocalAIService()
