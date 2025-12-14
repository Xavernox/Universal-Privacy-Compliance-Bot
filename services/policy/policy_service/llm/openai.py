from __future__ import annotations

from typing import Any

import httpx


class OpenAIProvider:
    name = "openai"

    def __init__(self, *, api_key: str, model: str = "gpt-4o-mini") -> None:
        self._api_key = api_key
        self._model = model

    async def enrich(self, markdown: str, *, context: dict[str, Any]) -> str:
        prompt = (
            "Rewrite the following privacy policy markdown to improve clarity and legal tone. "
            "Do not remove headings. Keep it concise and deterministic.\n\n"
            f"---\n{markdown}\n---\n"
        )

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self._api_key}"},
                json={
                    "model": self._model,
                    "messages": [
                        {"role": "system", "content": "You are a helpful compliance writer."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0,
                },
            )

            resp.raise_for_status()
            data = resp.json()

        try:
            return data["choices"][0]["message"]["content"]
        except Exception as exc:
            raise RuntimeError(f"Unexpected OpenAI response format: {exc}")
