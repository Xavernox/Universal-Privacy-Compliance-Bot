import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import Scan from '@/lib/db/models/Scan';
import GeneratedPolicy from '@/lib/db/models/GeneratedPolicy';
import { withAuth } from '@/lib/auth/middleware';

type GeneratePolicyFramework = 'gdpr' | 'ccpa';

interface PolicyServiceResponse {
  framework: GeneratePolicyFramework;
  markdown: string;
  html: string;
  complianceScore: number;
  metadata?: Record<string, any>;
}

export const POST = withAuth(async (request, user) => {
  try {
    await connectToDatabase();

    const body = (await request.json().catch(() => ({}))) as {
      framework?: GeneratePolicyFramework;
      companyName?: string;
      websiteUrl?: string;
      useLlm?: boolean;
    };

    const framework: GeneratePolicyFramework = body.framework || 'gdpr';

    if (framework !== 'gdpr' && framework !== 'ccpa') {
      return NextResponse.json({ error: 'Invalid framework' }, { status: 400 });
    }

    const latestScan = await Scan.findOne({ userId: user.userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestScan) {
      return NextResponse.json({ error: 'No completed scan found' }, { status: 404 });
    }

    const policyServiceUrl = process.env.POLICY_SERVICE_URL;
    if (!policyServiceUrl) {
      return NextResponse.json({ error: 'Policy service not configured' }, { status: 500 });
    }

    const url = `${policyServiceUrl.replace(/\/$/, '')}/generate`;

    const policyResponse = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        framework,
        scan: latestScan,
        companyName: body.companyName,
        websiteUrl: body.websiteUrl,
        useLlm: Boolean(body.useLlm),
      }),
    });

    if (!policyResponse.ok) {
      const details = await policyResponse.text().catch(() => '');
      console.error('Policy service error:', policyResponse.status, details);
      return NextResponse.json({ error: 'Failed to generate policy' }, { status: 502 });
    }

    const generated = (await policyResponse.json()) as PolicyServiceResponse;

    if (!generated?.markdown || !generated?.html) {
      return NextResponse.json({ error: 'Invalid policy service response' }, { status: 502 });
    }

    const record = await GeneratedPolicy.create({
      userId: user.userId,
      scanId: (latestScan as any)._id,
      framework,
      markdown: generated.markdown,
      html: generated.html,
      complianceScore: generated.complianceScore,
      metadata: generated.metadata || {},
    });

    return NextResponse.json({
      policy: {
        id: record._id.toString(),
        framework,
        markdown: generated.markdown,
        html: generated.html,
        complianceScore: generated.complianceScore,
      },
      scanId: (latestScan as any)._id.toString(),
      metadata: generated.metadata || {},
    });
  } catch (error: any) {
    console.error('Generate policy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
