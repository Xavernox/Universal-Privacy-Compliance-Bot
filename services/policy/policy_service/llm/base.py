from __future__ import annotations

from typing import Any, Protocol


class LLMProvider(Protocol):
    name: str

    async def enrich(self, markdown: str, *, context: dict[str, Any]) -> str:
        ...
