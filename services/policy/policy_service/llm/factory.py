from __future__ import annotations

from .base import LLMProvider
from .mock import MockLLMProvider
from .noop import NoopLLMProvider
from .openai import OpenAIProvider
from ..config import Settings


def get_llm_provider(settings: Settings) -> LLMProvider:
    provider = (settings.llm_provider or "none").lower()

    if provider == "mock":
        return MockLLMProvider()

    if provider == "openai":
        if not settings.llm_api_key:
            return NoopLLMProvider()
        return OpenAIProvider(api_key=settings.llm_api_key)

    return NoopLLMProvider()
