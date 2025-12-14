#!/usr/bin/env python3
"""Policy Generator Service (FastAPI)

Loads editable GDPR/CCPA templates from MongoDB (fallback to seeded Markdown files),
merges them with scan findings, and optionally enriches wording via an LLM provider.
"""

from __future__ import annotations

from typing import Any, Literal

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from policy_service.config import Settings
from policy_service.llm import get_llm_provider
from policy_service.merge import compute_compliance_score, markdown_to_html, render_policy_markdown
from policy_service.template_store import load_template_markdown

settings = Settings()

app = FastAPI(
    title="Policy Generator Service",
    description="Generate privacy policies (GDPR/CCPA) based on scan findings",
    version="1.0.0",
)


class GeneratePolicyRequest(BaseModel):
    framework: Literal["gdpr", "ccpa"] = "gdpr"
    scan: dict[str, Any] = Field(default_factory=dict)

    companyName: str = "Your Company"
    websiteUrl: str | None = None

    useLlm: bool = False


class GeneratePolicyResponse(BaseModel):
    framework: str
    markdown: str
    html: str
    complianceScore: float
    metadata: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "policy",
        "version": "1.0.0",
    }


async def _generate(request: GeneratePolicyRequest) -> GeneratePolicyResponse:
    template_markdown, template_meta = await load_template_markdown(request.framework, settings)

    compliance_score = compute_compliance_score(request.scan)

    rendered_markdown = render_policy_markdown(
        template_markdown,
        framework=request.framework,
        company_name=request.companyName,
        website_url=request.websiteUrl,
        scan=request.scan,
        compliance_score=compliance_score,
    )

    llm_provider = get_llm_provider(settings)
    llm_used = False

    if request.useLlm and llm_provider.name != "none":
        rendered_markdown = await llm_provider.enrich(rendered_markdown, context={"framework": request.framework})
        llm_used = True

    html = markdown_to_html(rendered_markdown)

    return GeneratePolicyResponse(
        framework=request.framework,
        markdown=rendered_markdown,
        html=html,
        complianceScore=compliance_score,
        metadata={
            "template": template_meta,
            "llm": {
                "used": llm_used,
                "provider": llm_provider.name,
            },
        },
    )


@app.post("/generate", response_model=GeneratePolicyResponse)
async def generate_policy(request: GeneratePolicyRequest):
    try:
        result = await _generate(request)
        return JSONResponse(status_code=200, content=result.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Policy generation failed: {exc}")


@app.post("/policy/generate", response_model=GeneratePolicyResponse)
async def generate_policy_alias(request: GeneratePolicyRequest):
    return await generate_policy(request)


if __name__ == "__main__":
    port = int(__import__("os").getenv("PORT", "3002"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
    )
