from __future__ import annotations

from typing import Any


class NoopLLMProvider:
    name = "none"

    async def enrich(self, markdown: str, *, context: dict[str, Any]) -> str:
        return markdown
