import os
import time
import json
import logging
import asyncio
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
from app.config import settings

logger = logging.getLogger("veil.llm.provider")

SYSTEM_PROMPT = """You are the reasoning layer of VEIL.

Answer the user's question using the retrieved local context whenever the question concerns the user's local files.

Do not invent local files, filenames, paths, passages, or facts.

If the retrieved context does not contain enough information, clearly say that the available local files do not contain enough information.

Distinguish between information found in the retrieved files and general knowledge.

Keep answers concise but useful.

Never claim that you searched the Windows filesystem yourself. The local retrieval layer is MOSS."""

class BaseLLMProvider(ABC):
    """Abstract interface for all LLM providers."""

    @abstractmethod
    async def generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        """Returns (answer_text, latency_ms, provider_name, model_name)"""
        pass

    @abstractmethod
    async def chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        """Returns (answer_text, latency_ms, provider_name, model_name)"""
        pass

    @abstractmethod
    async def stream_generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        """Yields text tokens as they are generated."""
        pass

    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Returns provider connectivity, active model, and latency."""
        pass

    @abstractmethod
    async def get_available_models(self) -> List[str]:
        """Lists available models from the provider."""
        pass

    @abstractmethod
    def set_model(self, model_name: str) -> str:
        """Sets active model at runtime."""
        pass


class GeminiProvider(BaseLLMProvider):
    """
    Primary AI reasoning & generation engine powered by Google Gemini API.
    Handles natural language queries, question answering, summarization,
    reasoning, and deep document/context understanding.
    Never searches the Windows filesystem directly — reasons strictly over MOSS retrieved context.
    """

    def __init__(self):
        raw_key = (
            getattr(settings, "GEMINI_API_KEY", None)
            or os.environ.get("GEMINI_API_KEY")
            or ""
        ).strip()
        # Ensure placeholder keys are treated as unconfigured
        if raw_key == "YOUR_GEMINI_API_KEY_HERE":
            raw_key = ""
        # Handle accidental double-paste if key was concatenated twice
        if len(raw_key) > 40 and len(raw_key) % 2 == 0 and raw_key[:len(raw_key)//2] == raw_key[len(raw_key)//2:]:
            raw_key = raw_key[:len(raw_key)//2]
        self.api_key = raw_key
        self.model = (getattr(settings, "GEMINI_MODEL", None) or "gemini-3.6-flash").strip()
        self._health_cache: Optional[Dict[str, Any]] = None
        self._last_health_check_time: float = 0.0
        self.fallback_models = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview"]
        logger.info(f"GeminiProvider initialized: model={self.model}, configured={bool(self.api_key)}")

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key != "YOUR_GEMINI_API_KEY_HERE")

    def set_model(self, model_name: str) -> str:
        self.model = model_name.strip()
        self._health_cache = None
        return self.model

    async def get_available_models(self) -> List[str]:
        models = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash"]
        if self.model not in models:
            models.append(self.model)
        return models

    async def check_health(self) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "connected": False,
                "provider": "GEMINI",
                "model": self.model,
                "available_models": await self.get_available_models(),
                "configured": False,
                "status": "unconfigured",
                "error": "Gemini API key is not configured."
            }

        # Cache health check for 60 seconds to protect free-tier API quotas
        now = time.time()
        if self._health_cache and (now - self._last_health_check_time < 60.0):
            return self._health_cache

        start = time.perf_counter()
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}?key={self.api_key}"
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    result = {
                        "connected": True,
                        "provider": "GEMINI",
                        "model": self.model,
                        "available_models": await self.get_available_models(),
                        "configured": True,
                        "status": "connected",
                        "latencyMs": elapsed_ms
                    }
                    self._health_cache = result
                    self._last_health_check_time = now
                    return result
                elif res.status_code in (400, 403):
                    return {
                        "connected": False,
                        "provider": "GEMINI",
                        "model": self.model,
                        "available_models": [self.model],
                        "configured": True,
                        "status": "auth_error",
                        "latencyMs": elapsed_ms,
                        "error": "Gemini API key is not configured."
                    }
                else:
                    return {
                        "connected": False,
                        "provider": "GEMINI",
                        "model": self.model,
                        "available_models": [self.model],
                        "configured": True,
                        "status": "unavailable",
                        "latencyMs": elapsed_ms,
                        "error": "Gemini is currently unavailable."
                    }
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "connected": False,
                "provider": "GEMINI",
                "model": self.model,
                "available_models": [self.model],
                "configured": True,
                "status": "unavailable",
                "latencyMs": elapsed_ms,
                "error": "Gemini is currently unavailable."
            }

    async def generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        if not self.is_configured():
            raise RuntimeError("Gemini API key is not configured.")

        start = time.perf_counter()
        sys = system or SYSTEM_PROMPT
        # Responsive per-candidate timeout (6s max) to prevent frontend proxy aborts
        timeout_sec = min(getattr(settings, "LLM_TIMEOUT", 6.0), 6.0)

        # Build candidate models starting with active model and fallbacks
        candidates = [self.model]
        for fb in self.fallback_models:
            if fb not in candidates:
                candidates.append(fb)

        for model_name in candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            payload: Dict[str, Any] = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": settings.LLM_MAX_TOKENS
                }
            }
            if sys:
                payload["systemInstruction"] = {
                    "parts": [{"text": sys}]
                }

            try:
                async with httpx.AsyncClient(timeout=timeout_sec) as client:
                    res = await client.post(url, json=payload)
                    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

                    if res.status_code == 200:
                        data = res.json()
                        cand_list = data.get("candidates", [])
                        if cand_list and "content" in cand_list[0]:
                            parts = cand_list[0]["content"].get("parts", [])
                            text = "".join(p.get("text", "") for p in parts).strip()
                            return text, elapsed_ms, "GEMINI", model_name
                        return "No response generated by Gemini model.", elapsed_ms, "GEMINI", model_name
                    elif res.status_code in (400, 401, 403):
                        err_body = res.text.lower()
                        if "api key" in err_body or "credential" in err_body or "unregistered" in err_body:
                            raise RuntimeError("Gemini API key is not configured.")
                        logger.warning(f"Model '{model_name}' returned HTTP {res.status_code}: {res.text[:100]}. Fast fallback...")
                        continue
                    elif res.status_code == 429:
                        logger.warning(f"Model '{model_name}' rate limited (HTTP 429). Fast fallback to next candidate...")
                        continue
                    elif res.status_code in (500, 502, 503, 504):
                        logger.warning(f"Model '{model_name}' service error (HTTP {res.status_code}). Fast fallback to next candidate...")
                        continue
                    elif res.status_code == 404:
                        logger.warning(f"Model '{model_name}' unavailable/not found (HTTP 404). Fast fallback...")
                        continue
                    else:
                        continue
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as net_err:
                logger.warning(f"Network error on '{model_name}': {net_err}. Fast fallback to next candidate...")
                continue
            except RuntimeError:
                raise
            except Exception as e:
                logger.warning(f"Gemini call exception on '{model_name}': {e}. Fast fallback...")
                continue

        raise RuntimeError("Gemini is currently unavailable.")

    async def chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        if not self.is_configured():
            raise RuntimeError("Gemini API key is not configured.")

        start = time.perf_counter()
        timeout_sec = min(getattr(settings, "LLM_TIMEOUT", 6.0), 6.0)

        contents = []
        sys_text = ""
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                sys_text = content
            else:
                gemini_role = "model" if role == "assistant" else "user"
                contents.append({"role": gemini_role, "parts": [{"text": content}]})

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": settings.LLM_MAX_TOKENS
            }
        }
        if sys_text or SYSTEM_PROMPT:
            payload["systemInstruction"] = {
                "parts": [{"text": sys_text or SYSTEM_PROMPT}]
            }

        candidates = [self.model]
        for fb in self.fallback_models:
            if fb not in candidates:
                candidates.append(fb)

        for model_name in candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            try:
                async with httpx.AsyncClient(timeout=timeout_sec) as client:
                    res = await client.post(url, json=payload)
                    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

                    if res.status_code == 200:
                        data = res.json()
                        cand_list = data.get("candidates", [])
                        if cand_list and "content" in cand_list[0]:
                            parts = cand_list[0]["content"].get("parts", [])
                            text = "".join(p.get("text", "") for p in parts).strip()
                            return text, elapsed_ms, "GEMINI", model_name
                        return "No response generated by Gemini model.", elapsed_ms, "GEMINI", model_name
                    elif res.status_code in (400, 401, 403):
                        err_body = res.text.lower()
                        if "api key" in err_body or "credential" in err_body or "unregistered" in err_body:
                            raise RuntimeError("Gemini API key is not configured.")
                        logger.warning(f"Model '{model_name}' returned HTTP {res.status_code}: {res.text[:100]}. Fast fallback...")
                        continue
                    elif res.status_code == 429:
                        logger.warning(f"Model '{model_name}' rate limited (HTTP 429). Fast fallback to next candidate...")
                        continue
                    elif res.status_code in (500, 502, 503, 504):
                        logger.warning(f"Model '{model_name}' service error (HTTP {res.status_code}). Fast fallback to next candidate...")
                        continue
                    elif res.status_code == 404:
                        logger.warning(f"Model '{model_name}' unavailable/not found (HTTP 404). Fast fallback...")
                        continue
                    else:
                        continue
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as net_err:
                logger.warning(f"Network error on '{model_name}': {net_err}. Fast fallback...")
                continue
            except RuntimeError:
                raise
            except Exception as e:
                logger.warning(f"Gemini chat exception on '{model_name}': {e}. Fast fallback...")
                continue

        raise RuntimeError("Gemini is currently unavailable.")

    async def stream_generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        if not self.is_configured():
            yield "[Gemini API key is not configured.]"
            return

        sys = system or SYSTEM_PROMPT
        payload: Dict[str, Any] = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": settings.LLM_MAX_TOKENS
            }
        }
        if sys:
            payload["systemInstruction"] = {"parts": [{"text": sys}]}

        timeout_sec = min(getattr(settings, "LLM_TIMEOUT", 6.0), 6.0)
        candidates = [self.model]
        for fb in self.fallback_models:
            if fb not in candidates:
                candidates.append(fb)

        for model_name in candidates:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:streamGenerateContent?key={self.api_key}&alt=sse"
            try:
                async with httpx.AsyncClient(timeout=timeout_sec) as client:
                    async with client.stream("POST", url, json=payload) as response:
                        if response.status_code != 200:
                            continue
                        streamed_any = False
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                raw = line[6:].strip()
                                if raw:
                                    try:
                                        chunk = json.loads(raw)
                                        cand = chunk.get("candidates", [])
                                        if cand and "content" in cand[0]:
                                            parts = cand[0]["content"].get("parts", [])
                                            for p in parts:
                                                txt = p.get("text", "")
                                                if txt:
                                                    streamed_any = True
                                                    yield txt
                                    except Exception:
                                        continue
                        if streamed_any:
                            return
            except Exception as e:
                logger.warning(f"Stream error on '{model_name}': {e}. Trying fallback...")
                continue

        yield "Gemini is currently unavailable."


class CloudAPIProvider(BaseLLMProvider):
    """
    Connects to standard OpenAI-compatible cloud endpoints (Groq, Together, OpenAI).
    Optional fallback if configured.
    """

    def __init__(self):
        self.base_url = settings.LLM_BASE_URL.rstrip("/")
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY
        logger.info(f"CloudAPIProvider initialized: model={self.model}, base_url={self.base_url}")

    def set_model(self, model_name: str) -> str:
        self.model = model_name.strip()
        return self.model

    async def get_available_models(self) -> List[str]:
        return [self.model]

    async def check_health(self) -> Dict[str, Any]:
        return {
            "connected": bool(self.api_key),
            "provider": "API",
            "model": self.model,
            "available_models": [self.model],
            "base_url": self.base_url,
            "configured": bool(self.api_key)
        }

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        if not self.api_key:
            raise RuntimeError("API key is not configured.")
        start = time.perf_counter()
        sys = system or SYSTEM_PROMPT
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": sys},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": settings.LLM_MAX_TOKENS
        }
        url = f"{self.base_url}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, json=payload, headers=self._headers())
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    answer = res.json()["choices"][0]["message"]["content"].strip()
                    return answer, elapsed_ms, "API", self.model
                else:
                    raise RuntimeError(f"Cloud API returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            raise RuntimeError(f"Cloud API generation failed: {str(e)}")

    async def chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        if not self.api_key:
            raise RuntimeError("API key is not configured.")
        start = time.perf_counter()
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": settings.LLM_MAX_TOKENS
        }
        url = f"{self.base_url}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, json=payload, headers=self._headers())
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    answer = res.json()["choices"][0]["message"]["content"].strip()
                    return answer, elapsed_ms, "API", self.model
                else:
                    raise RuntimeError(f"Cloud API chat returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            raise RuntimeError(f"Cloud API chat failed: {str(e)}")

    async def stream_generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "[API key is not configured.]"
            return
        sys = system or SYSTEM_PROMPT
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": sys},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "stream": True
        }
        url = f"{self.base_url}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", url, json=payload, headers=self._headers()) as response:
                    if response.status_code != 200:
                        yield f"Cloud API error: HTTP {response.status_code}"
                        return
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            raw = line[6:].strip()
                            if raw == "[DONE]":
                                break
                            try:
                                chunk = json.loads(raw)
                                delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if delta:
                                    yield delta
                            except Exception:
                                continue
        except Exception as e:
            yield f"[API streaming error: {str(e)}]"


def get_llm_provider() -> BaseLLMProvider:
    """Factory function returning the active primary LLM provider (defaults to GeminiProvider)."""
    prov = (getattr(settings, "LLM_PROVIDER", "GEMINI") or "GEMINI").upper().strip()
    if prov in ["API", "GROQ", "OPENAI", "OPENROUTER"]:
        return CloudAPIProvider()
    # Default to GeminiProvider
    return GeminiProvider()
