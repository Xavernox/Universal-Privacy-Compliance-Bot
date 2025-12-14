import { RealtimeAlertService } from '@/lib/alerting/realtimeService';
import { IAlert } from '@/lib/db/models/Alert';

describe('RealtimeAlertService', () => {
  let service: RealtimeAlertService;
  const mockAlert: Partial<IAlert> = {
    _id: 'alert-123' as any,
    userId: 'user-123' as any,
    title: 'Test Alert',
    description: 'Test',
    severity: 'critical',
    status: 'open',
    resourceType: 'EC2',
    resourceId: 'i-123',
    cloudProvider: 'aws',
    affectedResources: [],
    recommendedActions: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = new RealtimeAlertService();
  });

  describe('subscription', () => {
    it('should allow subscribing to alerts', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe('user-123', callback);

      expect(unsubscribe).toBeInstanceOf(Function);
      expect(service.getSubscriberCount('user-123')).toBe(1);
    });

    it('should allow multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.subscribe('user-123', callback1);
      service.subscribe('user-123', callback2);

      expect(service.getSubscriberCount('user-123')).toBe(2);
    });

    it('should allow unsubscribing', () => {
      const callback = jest.fn();
      const unsubscribe = service.subscribe('user-123', callback);

      expect(service.getSubscriberCount('user-123')).toBe(1);

      unsubscribe();

      expect(service.getSubscriberCount('user-123')).toBe(0);
    });
  });

  describe('publishing', () => {
    it('should publish alert to subscribed users', (done) => {
      const callback = jest.fn();
      service.subscribe('user-123', callback);

      service.publishAlert(mockAlert as IAlert);

      setImmediate(() => {
        expect(callback).toHaveBeenCalledWith(mockAlert);
        done();
      });
    });

    it('should not publish to unrelated users', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      service.subscribe('user-123', callback1);
      service.subscribe('user-456', callback2);

      mockAlert.userId = 'user-123' as any;
      service.publishAlert(mockAlert as IAlert);

      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should broadcast to admin subscribers', (done) => {
      const adminCallback = jest.fn();
      service.subscribe('__admin__', adminCallback);

      service.publishAlert(mockAlert as IAlert);

      setImmediate(() => {
        expect(adminCallback).toHaveBeenCalledWith(mockAlert);
        done();
      });
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      service.subscribe('user-123', errorCallback);
      service.subscribe('user-123', normalCallback);

      expect(() => service.publishAlert(mockAlert as IAlert)).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should return subscriber count for user', () => {
      service.subscribe('user-123', jest.fn());
      service.subscribe('user-123', jest.fn());

      expect(service.getSubscriberCount('user-123')).toBe(2);
    });

    it('should return total subscriber count', () => {
      service.subscribe('user-123', jest.fn());
      service.subscribe('user-456', jest.fn());
      service.subscribe('user-456', jest.fn());

      expect(service.getTotalSubscribers()).toBe(3);
    });

    it('should return statistics', () => {
      service.subscribe('user-123', jest.fn());
      service.subscribe('user-456', jest.fn());

      const stats = service.getStats();

      expect(stats.totalSubscribers).toBe(2);
      expect(stats.uniqueUsers).toBe(2);
      expect(stats.subscriptions.length).toBe(2);
    });

    it('should handle no subscribers', () => {
      const stats = service.getStats();

      expect(stats.totalSubscribers).toBe(0);
      expect(stats.uniqueUsers).toBe(0);
    });
  });

  describe('alert delivery', () => {
    it('should handle multiple alerts in sequence', (done) => {
      const callback = jest.fn();
      service.subscribe('user-123', callback);

      service.publishAlert(mockAlert as IAlert);
      const alert2 = { ...mockAlert, _id: 'alert-456' as any };
      service.publishAlert(alert2 as IAlert);

      setImmediate(() => {
        expect(callback).toHaveBeenCalledTimes(2);
        done();
      });
    });

    it('should maintain subscription after alert delivery', (done) => {
      const callback = jest.fn();
      service.subscribe('user-123', callback);

      service.publishAlert(mockAlert as IAlert);

      setImmediate(() => {
        expect(service.getSubscriberCount('user-123')).toBe(1);
        done();
      });
    });
  });

  describe('configuration', () => {
    it('should accept max subscribers configuration', () => {
      const service2 = new RealtimeAlertService({ maxSubscribers: 500 });
      expect(service2).toBeDefined();
    });
  });
});
