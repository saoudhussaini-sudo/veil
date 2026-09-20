import time
import json
import logging
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
from app.config import settings

logger = logging.getLogger("veil.llm.provider")

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

You operate reliably and privately."""

class BaseLLMProvider(ABC):
    """Abstract interface for all LLM providers (OLLAMA_LOCAL, OLLAMA_CLOUD, API)."""

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


class OllamaLocalProvider(BaseLLMProvider):
    """
    Connects to a local Ollama instance (default: http://localhost:11434).
    Standard development mode on user laptop.
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self._cached_models: List[str] = []
        self._cached_at: float = 0.0
        logger.info(f"OllamaLocalProvider initialized: model={self.model}, base_url={self.base_url}")

    def set_model(self, model_name: str) -> str:
        self.model = model_name.strip()
        return self.model

    async def get_available_models(self) -> List[str]:
        now = time.time()
        if self._cached_models and (now - self._cached_at < 30.0):
            return self._cached_models
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", []) if m.get("name")]
                    self._cached_models = models
                    self._cached_at = now
                    return models
        except Exception as e:
            logger.warning(f"Failed to query Ollama models at {self.base_url}: {e}")
        return self._cached_models

    async def check_health(self) -> Dict[str, Any]:
        start = time.perf_counter()
        try:
            models = await self.get_available_models()
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            if models:
                if self.model not in models:
                    match = next((m for m in models if m.startswith(self.model) or self.model.startswith(m)), None)
                    if match:
                        self.model = match
                    else:
                        self.model = models[0]
                return {
                    "connected": True,
                    "provider": "OLLAMA_LOCAL",
                    "model": self.model,
                    "available_models": models,
                    "base_url": self.base_url,
                    "latencyMs": elapsed_ms
                }
            return {
                "connected": False,
                "provider": "OLLAMA_LOCAL",
                "model": self.model,
                "available_models": [],
                "base_url": self.base_url,
                "latencyMs": elapsed_ms,
                "error": "No models installed in Ollama. Pull a model via `ollama pull qwen2.5:0.5b`."
            }
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "connected": False,
                "provider": "OLLAMA_LOCAL",
                "model": self.model,
                "available_models": [],
                "base_url": self.base_url,
                "latencyMs": elapsed_ms,
                "error": f"Ollama unreachable at {self.base_url}: {str(e)}"
            }

    async def generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        start = time.perf_counter()
        sys = system or SYSTEM_PROMPT
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": sys,
            "stream": False,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    answer = res.json().get("response", "").strip()
                    return answer, elapsed_ms, "OLLAMA_LOCAL", self.model
                else:
                    raise RuntimeError(f"Ollama returned HTTP {res.status_code}: {res.text}")
        except httpx.ConnectError:
            raise RuntimeError(f"Local Ollama daemon unreachable at {self.base_url}. Please start Ollama ('ollama serve') or check connectivity.")
        except httpx.TimeoutException:
            raise RuntimeError(f"Ollama generation timed out after 90 seconds on model {self.model}.")
        except Exception as e:
            raise RuntimeError(f"Ollama generation failed: {str(e)}")

    async def chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        start = time.perf_counter()
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                res = await client.post(f"{self.base_url}/api/chat", json=payload)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    answer = res.json().get("message", {}).get("content", "").strip()
                    return answer, elapsed_ms, "OLLAMA_LOCAL", self.model
                else:
                    raise RuntimeError(f"Ollama chat returned HTTP {res.status_code}: {res.text}")
        except httpx.ConnectError:
            raise RuntimeError(f"Local Ollama daemon unreachable at {self.base_url}. Please start Ollama ('ollama serve').")
        except httpx.TimeoutException:
            raise RuntimeError(f"Ollama chat timed out after 90 seconds.")
        except Exception as e:
            raise RuntimeError(f"Ollama chat failed: {str(e)}")

    async def stream_generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        sys = system or SYSTEM_PROMPT
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": sys,
            "stream": True,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                async with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as response:
                    if response.status_code != 200:
                        yield f"Ollama error: HTTP {response.status_code}"
                        return
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    yield token
                            except Exception:
                                continue
        except Exception as e:
            yield f"[Generation error: {str(e)}]"


class OllamaCloudProvider(BaseLLMProvider):
    """
    Connects to a remote or cloud-hosted Ollama server.
    Supports optional Bearer token authentication via OLLAMA_API_KEY.
    """

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.api_key = settings.OLLAMA_API_KEY
        self._cached_models: List[str] = []
        self._cached_at: float = 0.0
        logger.info(f"OllamaCloudProvider initialized: model={self.model}, base_url={self.base_url}")

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def set_model(self, model_name: str) -> str:
        self.model = model_name.strip()
        return self.model

    async def get_available_models(self) -> List[str]:
        now = time.time()
        if self._cached_models and (now - self._cached_at < 30.0):
            return self._cached_models
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/api/tags", headers=self._headers())
                if res.status_code == 200:
                    models = [m.get("name") for m in res.json().get("models", []) if m.get("name")]
                    self._cached_models = models
                    self._cached_at = now
                    return models
        except Exception as e:
            logger.warning(f"Failed to query remote Ollama at {self.base_url}: {e}")
        return self._cached_models or [self.model]

    async def check_health(self) -> Dict[str, Any]:
        start = time.perf_counter()
        try:
            models = await self.get_available_models()
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "connected": bool(models),
                "provider": "OLLAMA_CLOUD",
                "model": self.model,
                "available_models": models,
                "base_url": self.base_url,
                "latencyMs": elapsed_ms
            }
        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "connected": False,
                "provider": "OLLAMA_CLOUD",
                "model": self.model,
                "available_models": [],
                "base_url": self.base_url,
                "latencyMs": elapsed_ms,
                "error": f"Remote Ollama unreachable at {self.base_url}: {str(e)}"
            }

    async def generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        start = time.perf_counter()
        sys = system or SYSTEM_PROMPT
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": sys,
            "stream": False,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload, headers=self._headers())
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    answer = res.json().get("response", "").strip()
                    return answer, elapsed_ms, "OLLAMA_CLOUD", self.model
                else:
                    raise RuntimeError(f"Remote Ollama returned HTTP {res.status_code}: {res.text}")
        except httpx.ConnectError:
            raise RuntimeError(f"Remote Ollama unreachable at {self.base_url}.")
        except httpx.TimeoutException:
            raise RuntimeError(f"Remote Ollama timed out after 90 seconds.")
        except Exception as e:
            raise RuntimeError(f"Remote Ollama generation failed: {str(e)}")

    async def chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        start = time.perf_counter()
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                res = await client.post(f"{self.base_url}/api/chat", json=payload, headers=self._headers())
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    answer = res.json().get("message", {}).get("content", "").strip()
                    return answer, elapsed_ms, "OLLAMA_CLOUD", self.model
                else:
                    raise RuntimeError(f"Remote Ollama chat returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            raise RuntimeError(f"Remote Ollama chat failed: {str(e)}")

    async def stream_generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        sys = system or SYSTEM_PROMPT
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": sys,
            "stream": True,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                async with client.stream("POST", f"{self.base_url}/api/generate", json=payload, headers=self._headers()) as response:
                    if response.status_code != 200:
                        yield f"Remote Ollama error: HTTP {response.status_code}"
                        return
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk = json.loads(line)
                                token = chunk.get("response", "")
                                if token:
                                    yield token
                            except Exception:
                                continue
        except Exception as e:
            yield f"[Generation error: {str(e)}]"


class CloudAPIProvider(BaseLLMProvider):
    """
    Connects to standard OpenAI-compatible cloud endpoints (Groq, Gemini OpenAI endpoint, OpenAI, OpenRouter, Together).
    Used in production mode without requiring a local GPU.
    """

    def __init__(self):
        self.base_url = settings.LLM_BASE_URL.rstrip("/")
        self.model = settings.LLM_MODEL
        self.api_key = settings.LLM_API_KEY or settings.OLLAMA_API_KEY
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
            return (
                "Cloud LLM API Key is not configured. Please set LLM_API_KEY in your production environment.",
                0.0,
                "API",
                self.model
            )

        start = time.perf_counter()
        sys = system or SYSTEM_PROMPT
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": sys},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": 1000
        }

        url = f"{self.base_url}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(url, json=payload, headers=self._headers())
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                if res.status_code == 200:
                    data = res.json()
                    answer = data["choices"][0]["message"]["content"].strip()
                    return answer, elapsed_ms, "API", self.model
                else:
                    raise RuntimeError(f"Cloud LLM API error ({res.status_code}): {res.text}")
        except httpx.TimeoutException:
            raise RuntimeError(f"Cloud LLM API request timed out after 45 seconds.")
        except Exception as e:
            raise RuntimeError(f"Cloud LLM API call failed: {str(e)}")

    async def chat(
        self, messages: List[Dict[str, str]], temperature: float = 0.2
    ) -> Tuple[str, float, str, str]:
        if not self.api_key:
            return (
                "Cloud LLM API Key is not configured. Please set LLM_API_KEY in your production environment.",
                0.0,
                "API",
                self.model
            )

        start = time.perf_counter()
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1000
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
                    raise RuntimeError(f"Cloud LLM API error ({res.status_code}): {res.text}")
        except Exception as e:
            raise RuntimeError(f"Cloud LLM API call failed: {str(e)}")

    async def stream_generate(
        self, prompt: str, system: Optional[str] = None, temperature: float = 0.2
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "Cloud LLM API Key is not configured. Please set LLM_API_KEY in your production environment."
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
                        yield f"Cloud LLM error: HTTP {response.status_code}"
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
    """Factory function returning the active LLM provider based on LLM_PROVIDER setting."""
    prov = (settings.LLM_PROVIDER or "OLLAMA_LOCAL").upper().strip()
    if prov in ["OLLAMA_LOCAL", "OLLAMA", "LOCAL"]:
        return OllamaLocalProvider()
    elif prov in ["OLLAMA_CLOUD", "CLOUD_OLLAMA", "REMOTE_OLLAMA"]:
        return OllamaCloudProvider()
    elif prov in ["API", "CLOUD", "GROQ", "GEMINI", "OPENAI"]:
        return CloudAPIProvider()
    else:
        logger.warning(f"Unrecognized LLM_PROVIDER '{prov}'. Defaulting to OLLAMA_LOCAL.")
        return OllamaLocalProvider()
