from __future__ import annotations

from pathlib import Path
from typing import Any

import structlog
from motor.motor_asyncio import AsyncIOMotorClient

from .config import Settings

logger = structlog.get_logger(__name__)


class TemplateNotFoundError(RuntimeError):
    pass


async def load_template_markdown(framework: str, settings: Settings) -> tuple[str, dict[str, Any]]:
    framework = framework.lower()

    if settings.mongodb_uri:
        try:
            client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=2000)
            db = client[settings.mongodb_db_name]
            col = db[settings.templates_collection]

            doc = await col.find_one(
                {"framework": framework},
                sort=[("updatedAt", -1), ("_id", -1)],
            )

            if doc and isinstance(doc.get("markdown"), str) and doc["markdown"].strip():
                return doc["markdown"], {
                    "source": "mongo",
                    "templateId": str(doc.get("_id")),
                    "framework": framework,
                }
        except Exception as exc:
            logger.warning("template_load_mongo_failed", framework=framework, error=str(exc))

    seed_path = Path(settings.seed_templates_dir) / f"{framework}.md"
    if not seed_path.exists():
        raise TemplateNotFoundError(f"No template found for framework '{framework}'")

    return seed_path.read_text(encoding="utf-8"), {
        "source": "seed",
        "path": str(seed_path),
        "framework": framework,
    }
