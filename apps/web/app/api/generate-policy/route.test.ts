import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/db/models/Scan', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/lib/db/models/GeneratedPolicy', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

describe('/api/generate-policy', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'test-secret';
    process.env.POLICY_SERVICE_URL = 'http://policy-service:3002';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.POLICY_SERVICE_URL;
    jest.restoreAllMocks();
  });

  function makeRequest(body: any) {
    const token = jwt.sign(
      { userId: '507f1f77bcf86cd799439011', email: 'test@example.com', role: 'user' },
      'test-secret',
      { issuer: 'upcb-mvp', audience: 'upcb-web' }
    );

    const req = new NextRequest(
      new Request('http://localhost/api/generate-policy', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    );

    return req;
  }

  it('returns deterministic mock output and stores record', async () => {
    const Scan = (await import('@/lib/db/models/Scan')).default as any;
    const GeneratedPolicy = (await import('@/lib/db/models/GeneratedPolicy')).default as any;

    const mockScan = {
      _id: '64b64c3a2f2f2f2f2f2f2f2f',
      userId: '507f1f77bcf86cd799439011',
      status: 'completed',
      cloudProvider: 'aws',
      resourcesScanned: 1,
      issuesFound: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      metadata: {},
    };

    const lean = jest.fn().mockResolvedValue(mockScan);
    const sort = jest.fn().mockReturnValue({ lean });
    (Scan.findOne as jest.Mock).mockReturnValue({ sort });

    (GeneratedPolicy.create as jest.Mock).mockResolvedValue({
      _id: 'policy-id-1',
    });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        framework: 'gdpr',
        markdown: '# GDPR Policy',
        html: '<h1>GDPR Policy</h1>',
        complianceScore: 100,
        metadata: { template: { source: 'seed' }, llm: { used: false, provider: 'none' } },
      }),
    } as any);

    const { POST } = await import('./route');

    const res = await POST(makeRequest({ framework: 'gdpr' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.policy.markdown).toBe('# GDPR Policy');
    expect(data.policy.html).toBe('<h1>GDPR Policy</h1>');
    expect(data.policy.complianceScore).toBe(100);

    expect(GeneratedPolicy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: 'gdpr',
        markdown: '# GDPR Policy',
        html: '<h1>GDPR Policy</h1>',
      })
    );
  });

  it('returns 404 when no completed scan exists', async () => {
    const Scan = (await import('@/lib/db/models/Scan')).default as any;

    const lean = jest.fn().mockResolvedValue(null);
    const sort = jest.fn().mockReturnValue({ lean });
    (Scan.findOne as jest.Mock).mockReturnValue({ sort });

    const { POST } = await import('./route');

    const res = await POST(makeRequest({ framework: 'gdpr' }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('No completed scan found');
  });
});
