from fastapi.testclient import TestClient

from main import app


def test_generate_endpoint_serializes_response():
    client = TestClient(app)

    resp = client.post(
        "/generate",
        json={
            "framework": "gdpr",
            "companyName": "Acme",
            "scan": {
                "cloudProvider": "aws",
                "status": "completed",
                "resourcesScanned": 1,
                "issuesFound": 0,
                "criticalIssues": 0,
                "highIssues": 0,
                "mediumIssues": 0,
                "lowIssues": 0,
                "metadata": {},
            },
        },
    )

    assert resp.status_code == 200
    data = resp.json()

    assert data["framework"] == "gdpr"
    assert isinstance(data["markdown"], str) and data["markdown"]
    assert isinstance(data["html"], str) and data["html"].startswith("<h1")
    assert data["complianceScore"] == 100.0

    assert "template" in data["metadata"]
    assert data["metadata"]["llm"]["used"] is False


def test_generate_policy_alias_route():
    client = TestClient(app)

    resp = client.post(
        "/policy/generate",
        json={
            "framework": "ccpa",
            "companyName": "Acme",
            "scan": {"criticalIssues": 0, "highIssues": 1, "mediumIssues": 0, "lowIssues": 0},
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["framework"] == "ccpa"
    assert data["complianceScore"] == 95.0
