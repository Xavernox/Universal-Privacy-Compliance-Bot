from policy_service.merge import compute_compliance_score, render_policy_markdown


def test_compute_compliance_score_is_deterministic():
    scan = {
        "criticalIssues": 1,
        "highIssues": 2,
        "mediumIssues": 3,
        "lowIssues": 4,
    }

    # 1*10 + 2*5 + 3*2 + 4*1 = 30
    assert compute_compliance_score(scan) == 70.0


def test_template_merge_renders_expected_fields():
    template = """# {{ framework_title }} Policy\n\nCompany: {{ company_name }}\n\n{{ scan_summary }}\n\nScore: {{ compliance_score }}\n\n{{ findings_summary }}\n"""

    scan = {
        "cloudProvider": "aws",
        "status": "completed",
        "resourcesScanned": 10,
        "issuesFound": 2,
        "criticalIssues": 1,
        "highIssues": 0,
        "mediumIssues": 1,
        "lowIssues": 0,
        "metadata": {"findings": [{"title": "S3 bucket is public", "severity": "high"}]},
    }

    md = render_policy_markdown(
        template,
        framework="gdpr",
        company_name="Acme",
        website_url=None,
        scan=scan,
        compliance_score=compute_compliance_score(scan),
    )

    assert "# GDPR Policy" in md
    assert "Company: Acme" in md
    assert "| Cloud provider | aws |" in md
    assert "- **HIGH**: S3 bucket is public" in md
