import time
import logging
from typing import List, Dict, Any, Optional, Tuple, AsyncGenerator
from app.config import settings
from app.llm.provider import get_llm_provider, BaseLLMProvider, SYSTEM_PROMPT

logger = logging.getLogger("veil.services.local_ai")

class LocalAIService:
    """
    Unified AI generative runtime service.
    Delegates to the configured LLM provider (OLLAMA_LOCAL, OLLAMA_CLOUD, or API).
    Auto-discovers models and tracks real, measured inference latencies.
    """
    def __init__(self):
        self._provider_instance: BaseLLMProvider = get_llm_provider()
        logger.info(f"LocalAIService initialized with provider {settings.LLM_PROVIDER}")

    @property
    def provider(self) -> str:
        return settings.LLM_PROVIDER

    @property
    def base_url(self) -> str:
        if "OLLAMA" in settings.LLM_PROVIDER.upper():
            return settings.OLLAMA_BASE_URL
        return settings.LLM_BASE_URL

    @property
    def model(self) -> str:
        if hasattr(self._provider_instance, "model"):
            return self._provider_instance.model
        return settings.OLLAMA_MODEL

    @model.setter
    def model(self, value: str):
        if hasattr(self._provider_instance, "model"):
            self._provider_instance.model = value

    def set_model(self, model_name: str) -> str:
        """Switches active model at runtime."""
        return self._provider_instance.set_model(model_name)

    async def get_available_models(self) -> List[str]:
        return await self._provider_instance.get_available_models()

    async def ensure_active_model(self) -> str:
        models = await self.get_available_models()
        if models and self.model not in models:
            self.model = models[0]
        return self.model

    async def check_health(self) -> Dict[str, Any]:
        """Checks connectivity and returns status, active model, and installed models."""
        return await self._provider_instance.check_health()

    async def test_generate(self, prompt: str) -> Dict[str, Any]:
        """
        Executes a real test generation with precise latency measurement.
        Used for verification and UI diagnostic checks.
        """
        start = time.perf_counter()
        answer, latency, prov, model_used = await self._provider_instance.generate(prompt=prompt)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "prompt": prompt,
            "response": answer,
            "latencyMs": latency or elapsed_ms,
            "model": model_used,
            "provider": prov,
            "status": "success"
        }

    async def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        """
        Executes prompt generation with configured LLM provider.
        Returns: (answer_text, latency_ms, provider_name, model_name)
        """
        return await self._provider_instance.generate(prompt=prompt, system=system, temperature=temperature)

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        """
        Executes multi-turn chat generation with configured LLM provider.
        """
        return await self._provider_instance.chat(messages=messages, temperature=temperature)

    async def reason_with_context(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        mode: str = "RETRIEVAL"
    ) -> Tuple[str, float, str, str]:
        """
        Executes reasoning over retrieved local file chunks via LLM provider.
        """
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

        return await self.generate(prompt=prompt, system=SYSTEM_PROMPT, temperature=0.2)

    async def stream_generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        context_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams generated tokens directly from active LLM provider.
        """
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

        async for token in self._provider_instance.stream_generate(prompt=full_prompt, system=sys, temperature=0.2):
            yield token

local_ai_service = LocalAIService()
