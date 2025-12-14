from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import markdown2
from jinja2 import BaseLoader, Environment


def compute_compliance_score(scan: dict[str, Any]) -> float:
    critical = int(scan.get("criticalIssues") or 0)
    high = int(scan.get("highIssues") or 0)
    medium = int(scan.get("mediumIssues") or 0)
    low = int(scan.get("lowIssues") or 0)

    penalty = critical * 10 + high * 5 + medium * 2 + low * 1
    return float(max(0, 100 - penalty))


def build_scan_summary_markdown(scan: dict[str, Any]) -> str:
    resources_scanned = int(scan.get("resourcesScanned") or 0)
    issues_found = int(scan.get("issuesFound") or 0)
    status = scan.get("status") or "unknown"
    cloud_provider = scan.get("cloudProvider") or "unknown"

    return (
        "| Field | Value |\n"
        "|---|---|\n"
        f"| Cloud provider | {cloud_provider} |\n"
        f"| Status | {status} |\n"
        f"| Resources scanned | {resources_scanned} |\n"
        f"| Issues found | {issues_found} |\n"
        f"| Critical | {int(scan.get('criticalIssues') or 0)} |\n"
        f"| High | {int(scan.get('highIssues') or 0)} |\n"
        f"| Medium | {int(scan.get('mediumIssues') or 0)} |\n"
        f"| Low | {int(scan.get('lowIssues') or 0)} |\n"
    )


def build_findings_summary_markdown(scan: dict[str, Any]) -> str:
    metadata = scan.get("metadata") or {}
    findings = metadata.get("findings") or metadata.get("issues")

    if isinstance(findings, list) and findings:
        lines: list[str] = []
        for item in findings[:20]:
            if not isinstance(item, dict):
                lines.append(f"- {str(item)}")
                continue

            title = item.get("title") or item.get("name") or item.get("id") or "Finding"
            severity = (item.get("severity") or item.get("risk") or "unknown").upper()
            lines.append(f"- **{severity}**: {title}")

        if len(findings) > 20:
            lines.append(f"- ...and {len(findings) - 20} more")

        return "\n".join(lines)

    return (
        "No itemized findings were provided by the scan metadata. The policy was generated using the aggregated issue counts."
    )


def render_policy_markdown(
    template_markdown: str,
    *,
    framework: str,
    company_name: str,
    website_url: str | None,
    scan: dict[str, Any],
    compliance_score: float,
) -> str:
    env = Environment(loader=BaseLoader(), autoescape=False)
    template = env.from_string(template_markdown)

    framework_title = {
        "gdpr": "GDPR",
        "ccpa": "CCPA/CPRA",
    }.get(framework.lower(), framework.upper())

    return template.render(
        framework=framework.lower(),
        framework_title=framework_title,
        company_name=company_name,
        website_url=website_url,
        scan=scan,
        scan_summary=build_scan_summary_markdown(scan),
        findings_summary=build_findings_summary_markdown(scan),
        compliance_score=int(round(compliance_score)),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def markdown_to_html(markdown: str) -> str:
    return markdown2.markdown(markdown, extras=["tables", "fenced-code-blocks"])
