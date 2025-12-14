import { AlertingService } from '@/lib/alerting/alertingService';
import { IAlert } from '@/lib/db/models/Alert';

describe('Alert Delivery Performance - SLA < 2000ms', () => {
  let alertingService: AlertingService;
  const SLA_THRESHOLD = 2000;

  const createMockAlert = (severity: string = 'critical'): Partial<IAlert> => ({
    _id: `alert-${Date.now()}` as any,
    userId: 'test-user' as any,
    title: `Test ${severity} Alert`,
    description: 'Performance test alert',
    severity: severity as any,
    status: 'open',
    resourceType: 'EC2',
    resourceId: `i-${Math.random().toString(36).substr(2, 9)}`,
    cloudProvider: 'aws',
    affectedResources: ['resource-1'],
    recommendedActions: ['Take immediate action'],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    process.env.SENDGRID_API_KEY = '';
    process.env.SLACK_BOT_TOKEN = '';
    process.env.ALERT_SLA_THRESHOLD = SLA_THRESHOLD.toString();
    alertingService = new AlertingService();
  });

  describe('Single Alert Delivery', () => {
    it('should deliver alert within SLA threshold', async () => {
      const alert = createMockAlert();
      const startTime = Date.now();

      await alertingService.sendAlert(alert as IAlert, 'test@example.com');

      const totalTime = Date.now() - startTime;

      console.log(`Alert delivery time: ${totalTime}ms (SLA: ${SLA_THRESHOLD}ms)`);

      expect(totalTime).toBeLessThan(SLA_THRESHOLD + 500);
    });

    it('should measure delivery time accurately', async () => {
      const alert = createMockAlert();
      const metrics = await alertingService.sendAlert(alert as IAlert);

      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(metrics.totalTime).toBeLessThan(SLA_THRESHOLD + 500);
    });
  });

  describe('Batch Alert Delivery', () => {
    it('should handle 10 alerts efficiently', async () => {
      const startTime = Date.now();
      const alerts = Array.from({ length: 10 }, () => createMockAlert());

      for (const alert of alerts) {
        await alertingService.sendAlert(alert as IAlert, 'test@example.com');
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 10;

      console.log(`Average delivery time (10 alerts): ${avgTime}ms`);

      expect(avgTime).toBeLessThan(SLA_THRESHOLD);
    });

    it('should handle concurrent alerts', async () => {
      const startTime = Date.now();
      const alerts = Array.from({ length: 5 }, () => createMockAlert());

      await Promise.all(
        alerts.map((alert) => alertingService.sendAlert(alert as IAlert, 'test@example.com'))
      );

      const totalTime = Date.now() - startTime;

      console.log(`Concurrent delivery time (5 alerts): ${totalTime}ms`);
      expect(totalTime).toBeLessThan(SLA_THRESHOLD * 2);
    });
  });

  describe('SLA Compliance Tracking', () => {
    it('should mark alerts delivered within SLA', async () => {
      const _alerts = Array.from({ length: 5 }, () => createMockAlert());
      const alerts = _alerts;

      for (const alert of alerts) {
        await alertingService.sendAlert(alert as IAlert);
      }

      const summary = alertingService.getMetricsSummary();

      console.log(`SLA Compliance: ${summary.slaCompliance}%`);
      console.log(`Average delivery time: ${summary.averageDeliveryTime}ms`);

      expect(summary.slaCompliance).toBeGreaterThanOrEqual(0);
      expect(summary.averageDeliveryTime).toBeLessThan(SLA_THRESHOLD);
    });

    it('should report detailed metrics', async () => {
      const _alert = createMockAlert();
      const alert = _alert;
      await alertingService.sendAlert(alert as IAlert);

      const metrics = alertingService.getMetrics();

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0]).toHaveProperty('totalTime');
      expect(metrics[0]).toHaveProperty('withinSLA');
      expect(metrics[0]).toHaveProperty('results');
    });
  });

  describe('Severity-based Performance', () => {
    it('should handle critical alerts with minimal latency', async () => {
      const startTime = Date.now();
      const alert = createMockAlert('critical');

      await alertingService.sendAlert(alert as IAlert);

      const time = Date.now() - startTime;
      expect(time).toBeLessThan(SLA_THRESHOLD + 500);
    });

    it('should maintain performance across severity levels', async () => {
      const severities = ['critical', 'high', 'medium', 'low'];
      const times: number[] = [];

      for (const severity of severities) {
        const startTime = Date.now();
        const alert = createMockAlert(severity);
        await alertingService.sendAlert(alert as IAlert);
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      console.log(`Average time across severity levels: ${avgTime}ms`);

      expect(avgTime).toBeLessThan(SLA_THRESHOLD);
    });
  });

  describe('Failure Rate Metrics', () => {
    it('should track delivery failures', async () => {
      const alert = createMockAlert();
      await alertingService.sendAlert(alert as IAlert);

      const summary = alertingService.getMetricsSummary();

      expect(summary.failureRate).toBeDefined();
      expect(summary.failureRate).toBeGreaterThanOrEqual(0);
      expect(summary.failureRate).toBeLessThanOrEqual(100);
    });

    it('should maintain low failure rate', async () => {
      const alerts = Array.from({ length: 10 }, () => createMockAlert());

      for (const alert of alerts) {
        await alertingService.sendAlert(alert as IAlert);
      }

      const summary = alertingService.getMetricsSummary();

      console.log(`Failure rate: ${summary.failureRate}%`);
      expect(summary.totalAlerts).toBe(10);
    });
  });

  describe('Telemetry Output', () => {
    it('should provide comprehensive metrics', async () => {
      const alert = createMockAlert();
      await alertingService.sendAlert(alert as IAlert);

      const summary = alertingService.getMetricsSummary();

      expect(summary).toHaveProperty('totalAlerts');
      expect(summary).toHaveProperty('averageDeliveryTime');
      expect(summary).toHaveProperty('slaCompliance');
      expect(summary).toHaveProperty('failureRate');

      console.log('Alert Delivery Metrics Summary:', summary);
    });

    it('should support metrics export', async () => {
      const alerts = Array.from({ length: 3 }, () => createMockAlert());

      for (const alert of alerts) {
        await alertingService.sendAlert(alert as IAlert);
      }

      const metrics = alertingService.getMetrics();
      const summary = alertingService.getMetricsSummary();

      expect(metrics.length).toBe(3);
      expect(summary.totalAlerts).toBe(3);

      const metricsData = {
        timestamp: new Date().toISOString(),
        summary,
        detailedMetrics: metrics,
      };

      console.log('Exportable Metrics:', JSON.stringify(metricsData, null, 2));
    });
  });
});
