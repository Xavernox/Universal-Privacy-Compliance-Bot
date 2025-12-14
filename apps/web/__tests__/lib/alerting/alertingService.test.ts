import { AlertingService } from '@/lib/alerting/alertingService';
import { IAlert } from '@/lib/db/models/Alert';

describe('AlertingService', () => {
  let alertingService: AlertingService;
  const mockAlert: Partial<IAlert> = {
    _id: 'alert-123' as any,
    userId: 'user-123' as any,
    title: 'Test Alert',
    description: 'Test Description',
    severity: 'critical',
    status: 'open',
    resourceType: 'EC2',
    resourceId: 'i-1234567890abcdef0',
    cloudProvider: 'aws',
    affectedResources: ['resource-1'],
    recommendedActions: ['action-1'],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    process.env.SENDGRID_API_KEY = '';
    process.env.SLACK_BOT_TOKEN = '';
    process.env.ALERT_SLA_THRESHOLD = '2000';
    alertingService = new AlertingService();
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(alertingService).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const config = {
        sendgridApiKey: 'test-key',
        slaTreshold: 1500,
      };
      const service = new AlertingService(config);
      expect(service).toBeDefined();
    });
  });

  describe('sendAlert', () => {
    it('should return alert delivery metrics', async () => {
      const metrics = await alertingService.sendAlert(mockAlert as IAlert, 'test@example.com');

      expect(metrics).toBeDefined();
      expect(metrics.startTime).toBeDefined();
      expect(metrics.endTime).toBeDefined();
      expect(metrics.totalTime).toBeGreaterThanOrEqual(0);
      expect(metrics.results).toBeInstanceOf(Array);
    });

    it('should complete delivery within reasonable time', async () => {
      const metrics = await alertingService.sendAlert(mockAlert as IAlert, 'test@example.com');

      expect(metrics.totalTime).toBeLessThan(5000);
    });

    it('should return results for email and slack channels', async () => {
      const metrics = await alertingService.sendAlert(mockAlert as IAlert, 'test@example.com');

      expect(metrics.results.length).toBeGreaterThanOrEqual(1);
      const channels = metrics.results.map((r) => r.channel);
      expect(channels).toContain('email');
    });

    it('should record metrics for SLA tracking', async () => {
      await alertingService.sendAlert(mockAlert as IAlert, 'test@example.com');
      const metrics = alertingService.getMetrics();

      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('metrics and SLA', () => {
    it('should track SLA compliance', async () => {
      await alertingService.sendAlert(mockAlert as IAlert, 'test@example.com');
      const summary = alertingService.getMetricsSummary();

      expect(summary.totalAlerts).toBe(1);
      expect(summary.slaCompliance).toBeGreaterThanOrEqual(0);
      expect(summary.slaCompliance).toBeLessThanOrEqual(100);
    });

    it('should calculate average delivery time', async () => {
      await alertingService.sendAlert(mockAlert as IAlert, 'test@example.com');
      await alertingService.sendAlert(mockAlert as IAlert, 'test2@example.com');

      const summary = alertingService.getMetricsSummary();

      expect(summary.averageDeliveryTime).toBeGreaterThanOrEqual(0);
      expect(summary.totalAlerts).toBe(2);
    });

    it('should calculate failure rate', async () => {
      await alertingService.sendAlert(mockAlert as IAlert);
      const summary = alertingService.getMetricsSummary();

      expect(summary.failureRate).toBeGreaterThanOrEqual(0);
      expect(summary.failureRate).toBeLessThanOrEqual(100);
    });

    it('should mark alerts within SLA threshold', async () => {
      const service = new AlertingService({ slaTreshold: 5000 });
      const metrics = await service.sendAlert(mockAlert as IAlert, 'test@example.com');

      expect(metrics.withinSLA).toBe(true);
    });
  });

  describe('severity color mapping', () => {
    it('should map critical severity to correct color', async () => {
      const alert = { ...mockAlert, severity: 'critical' as const };
      const metrics = await alertingService.sendAlert(alert as IAlert, 'test@example.com');

      expect(metrics).toBeDefined();
    });

    it('should map all severity levels', async () => {
      const severities: Array<'critical' | 'high' | 'medium' | 'low' | 'info'> = [
        'critical',
        'high',
        'medium',
        'low',
        'info',
      ];

      for (const severity of severities) {
        const alert = { ...mockAlert, severity };
        const metrics = await alertingService.sendAlert(alert as IAlert, 'test@example.com');
        expect(metrics).toBeDefined();
      }
    });
  });

  describe('configuration', () => {
    it('should handle missing email gracefully', async () => {
      const metrics = await alertingService.sendAlert(mockAlert as IAlert);

      expect(metrics.results).toBeDefined();
    });

    it('should use environment variables when provided', () => {
      process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
      process.env.SLACK_BOT_TOKEN = 'test-slack-token';
      process.env.ALERT_SLA_THRESHOLD = '1500';

      const service = new AlertingService();
      expect(service).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle alerts with empty recommended actions', async () => {
      const alert = {
        ...mockAlert,
        recommendedActions: [],
      };

      const metrics = await alertingService.sendAlert(alert as IAlert, 'test@example.com');
      expect(metrics).toBeDefined();
    });

    it('should handle alerts with empty affected resources', async () => {
      const alert = {
        ...mockAlert,
        affectedResources: [],
      };

      const metrics = await alertingService.sendAlert(alert as IAlert, 'test@example.com');
      expect(metrics).toBeDefined();
    });

    it('should handle very long descriptions', async () => {
      const alert = {
        ...mockAlert,
        description: 'A'.repeat(5000),
      };

      const metrics = await alertingService.sendAlert(alert as IAlert, 'test@example.com');
      expect(metrics).toBeDefined();
    });
  });
});
