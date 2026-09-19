import time
import json
import logging
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from app.config import settings
from app.llm.prompts import VEIL_SYSTEM_PROMPT, format_grounded_prompt

logger = logging.getLogger("veil.llm.provider")

class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Executes generation grounded on context.
        Returns: { 'answer': str, 'llm_time_ms': float, 'provider': str, 'model': str }
        """
        pass

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model or "gemini-1.5-flash"

    async def generate(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        start = time.perf_counter()
        prompt_text = format_grounded_prompt(question, context_chunks)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        payload = {
            "system_instruction": {
                "parts": [{"text": VEIL_SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt_text}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API error ({resp.status_code}): {resp.text}")
            data = resp.json()
            try:
                candidate = data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as e:
                raise RuntimeError(f"Unexpected response format from Gemini: {data}")

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "answer": candidate.strip(),
            "llm_time_ms": elapsed_ms,
            "provider": "gemini",
            "model": self.model
        }

class GroqProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "llama-3.1-8b-instant"):
        self.api_key = api_key
        self.model = model or "llama-3.1-8b-instant"

    async def generate(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        start = time.perf_counter()
        prompt_text = format_grounded_prompt(question, context_chunks)
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": VEIL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_text}
            ],
            "temperature": 0.2,
            "max_tokens": 800
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Groq API error ({resp.status_code}): {resp.text}")
            data = resp.json()
            answer = data["choices"][0]["message"]["content"]

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "answer": answer.strip(),
            "llm_time_ms": elapsed_ms,
            "provider": "groq",
            "model": self.model
        }

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model or "gpt-4o-mini"

    async def generate(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        start = time.perf_counter()
        prompt_text = format_grounded_prompt(question, context_chunks)
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": VEIL_SYSTEM_PROMPT},
                {"role": "user", "content": prompt_text}
            ],
            "temperature": 0.2,
            "max_tokens": 800
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"OpenAI API error ({resp.status_code}): {resp.text}")
            data = resp.json()
            answer = data["choices"][0]["message"]["content"]

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "answer": answer.strip(),
            "llm_time_ms": elapsed_ms,
            "provider": "openai",
            "model": self.model
        }

class GroundedFallbackProvider(LLMProvider):
    """
    In-process grounded synthesizer for offline development and initial testing.
    Synthesizes the answer strictly from retrieved passage statements.
    """
    def __init__(self, model: str = "veil-grounded-local"):
        self.model = model

    async def generate(self, question: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        start = time.perf_counter()
        if not context_chunks:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "answer": "Based on your currently indexed documents, there is not enough information to answer this question.",
                "llm_time_ms": elapsed_ms,
                "provider": "local",
                "model": self.model
            }

        # Synthesize top matched sentences from context
        matched_sentences = []
        q_words = set(question.lower().split())
        
        for c in context_chunks:
            text = c.get("text", "")
            source = c.get("source", "Knowledge Base")
            sentences = [s.strip() for s in text.split("\n") if s.strip()]
            for s in sentences:
                if len(s) > 15:
                    overlap = len(set(s.lower().split()).intersection(q_words))
                    matched_sentences.append((overlap, s, source))

        matched_sentences.sort(key=lambda x: x[0], reverse=True)
        top_sentences = [item[1] for item in matched_sentences[:4]]

        if top_sentences:
            synthesis = "According to your indexed knowledge:\n\n"
            seen = set()
            for s in top_sentences:
                clean = s.lstrip("#-•* ").strip()
                if clean and clean not in seen:
                    seen.add(clean)
                    synthesis += f"- {clean}\n"
            answer = synthesis.strip()
        else:
            answer = f"Retrieved {len(context_chunks)} relevant sections from your documents, but found no direct factual match for '{question}'."

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        elapsed_ms = max(elapsed_ms, 12.0)

        return {
            "answer": answer,
            "llm_time_ms": elapsed_ms,
            "provider": "local",
            "model": self.model
        }


def get_llm_provider() -> LLMProvider:
    """Factory function returning the configured LLM provider."""
    provider_name = (settings.LLM_PROVIDER or "local").lower()
    api_key = settings.LLM_API_KEY

    if not api_key:
        logger.info("No LLM_API_KEY configured. Using GroundedFallbackProvider.")
        return GroundedFallbackProvider()

    if provider_name == "gemini":
        return GeminiProvider(api_key=api_key, model=settings.LLM_MODEL)
    elif provider_name == "groq":
        return GroqProvider(api_key=api_key, model=settings.LLM_MODEL)
    elif provider_name == "openai":
        return OpenAIProvider(api_key=api_key, model=settings.LLM_MODEL)
    else:
        return GroundedFallbackProvider()
