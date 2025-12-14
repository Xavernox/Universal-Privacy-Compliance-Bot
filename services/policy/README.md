# Policy Service (FastAPI)

Container-based **policy generation** service for the U-PCB MVP.

This service:
- Loads editable **GDPR/CCPA** Markdown templates from MongoDB (falls back to seeded Markdown files)
- Merges templates with the latest scan findings/issue counts
- Optionally enriches wording with an **LLM provider** (pluggable driver)

## Endpoints

### Health

`GET /health`

### Generate

`POST /generate`

Alias (for ALB path routing): `POST /policy/generate`

Example request:

```json
{
  "framework": "gdpr",
  "companyName": "Acme Inc.",
  "websiteUrl": "https://example.com",
  "useLlm": false,
  "scan": {
    "cloudProvider": "aws",
    "status": "completed",
    "resourcesScanned": 42,
    "issuesFound": 3,
    "criticalIssues": 0,
    "highIssues": 1,
    "mediumIssues": 2,
    "lowIssues": 0,
    "metadata": {
      "findings": [
        { "title": "S3 bucket is public", "severity": "high" }
      ]
    }
  }
}
```

Response:

```json
{
  "framework": "gdpr",
  "markdown": "...",
  "html": "...",
  "complianceScore": 95,
  "metadata": {
    "template": { "source": "seed" },
    "llm": { "used": false, "provider": "none" }
  }
}
```

## MongoDB Templates

Templates are loaded from the `policy_templates` collection in `MONGODB_DB_NAME`.

Example document:

```json
{
  "framework": "gdpr",
  "markdown": "# {{ framework_title }} Privacy Policy\n...",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

## Environment Variables

- `PORT` (default `3002`)
- `MONGODB_URI` (optional; if not provided, only seeded templates are used)
- `MONGODB_DB_NAME` (default `upcb-mvp`)
- `LLM_PROVIDER` (`none` | `mock` | `openai`)
- `LLM_API_KEY` (required if `LLM_PROVIDER=openai`)

## Local Docker

```bash
cd services/policy
docker build -t upcb-policy:latest .
docker run --rm -p 3002:3002 upcb-policy:latest
```
