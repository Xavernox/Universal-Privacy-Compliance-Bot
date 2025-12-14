from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    mongodb_uri: str | None = os.getenv("MONGODB_URI")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "upcb-mvp")
    templates_collection: str = os.getenv("POLICY_TEMPLATES_COLLECTION", "policy_templates")

    llm_provider: str = os.getenv("LLM_PROVIDER", "none")
    llm_api_key: str | None = os.getenv("LLM_API_KEY")

    seed_templates_dir: Path = Path(__file__).resolve().parents[1] / "seed_templates"
