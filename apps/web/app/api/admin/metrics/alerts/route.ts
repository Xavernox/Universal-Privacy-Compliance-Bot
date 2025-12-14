import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/middleware';
import { alertingService, getQueueStats } from '@/lib/alerting';

export const GET = withAdmin(async () => {
  try {
    const metrics = alertingService.getMetricsSummary();
    const queueStats = await getQueueStats();

    const slaStatus =
      metrics.slaCompliance >= 95
        ? 'healthy'
        : metrics.slaCompliance >= 80
          ? 'degraded'
          : 'critical';

    return NextResponse.json({
      alertDelivery: {
        ...metrics,
        slaThreshold: parseInt(process.env.ALERT_SLA_THRESHOLD || '2000'),
        status: slaStatus,
      },
      queue: queueStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Metrics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
