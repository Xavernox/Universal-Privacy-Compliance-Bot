import { IAlert } from '@/lib/db/models/Alert';

interface AlertSubscriber {
  userId: string;
  sendUpdate: (alert: IAlert) => void;
}

interface RealtimeOptions {
  maxSubscribers?: number;
}

export class RealtimeAlertService {
  private subscribers: Map<string, AlertSubscriber[]> = new Map();

  constructor(_options: RealtimeOptions = {}) {}

  subscribe(userId: string, callback: (alert: IAlert) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, []);
    }

    const subscribers = this.subscribers.get(userId)!;
    const subscriber: AlertSubscriber = {
      userId,
      sendUpdate: callback,
    };

    subscribers.push(subscriber);

    return () => {
      const index = subscribers.indexOf(subscriber);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
      if (subscribers.length === 0) {
        this.subscribers.delete(userId);
      }
    };
  }

  publishAlert(alert: IAlert): void {
    const userId = alert.userId.toString();
    const subscribers = this.subscribers.get(userId);

    if (subscribers) {
      subscribers.forEach((subscriber) => {
        try {
          subscriber.sendUpdate(alert);
        } catch (error: any) {
          console.error('Error sending alert update:', error.message);
        }
      });
    }

    this.broadcastToAdmins(alert);
  }

  private broadcastToAdmins(alert: IAlert): void {
    const adminKey = '__admin__';
    const adminSubscribers = this.subscribers.get(adminKey);

    if (adminSubscribers) {
      adminSubscribers.forEach((subscriber) => {
        try {
          subscriber.sendUpdate(alert);
        } catch (error: any) {
          console.error('Error sending admin alert update:', error.message);
        }
      });
    }
  }

  getSubscriberCount(userId: string): number {
    const subscribers = this.subscribers.get(userId);
    return subscribers ? subscribers.length : 0;
  }

  getTotalSubscribers(): number {
    let total = 0;
    this.subscribers.forEach((subscribers) => {
      total += subscribers.length;
    });
    return total;
  }

  getStats() {
    return {
      totalSubscribers: this.getTotalSubscribers(),
      uniqueUsers: this.subscribers.size,
      subscriptions: Array.from(this.subscribers.entries()).map(([userId, subs]) => ({
        userId,
        count: subs.length,
      })),
    };
  }
}

export const realtimeAlertService = new RealtimeAlertService();
