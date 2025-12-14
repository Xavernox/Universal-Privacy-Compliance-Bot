import Queue from 'bull';
import { alertingService } from './alertingService';
import Alert from '@/lib/db/models/Alert';
import User from '@/lib/db/models/User';

interface AlertQueueData {
  alertId: string;
  userId: string;
}

interface AlertMetadata {
  queuedAt: number;
  processedAt?: number;
  processingTime?: number;
  deliveryMetrics?: any;
}

let alertQueue: Queue.Queue<AlertQueueData> | null = null;

export async function initializeAlertQueue(
  redisUrl?: string
): Promise<Queue.Queue<AlertQueueData>> {
  if (alertQueue) {
    return alertQueue;
  }

  const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

  alertQueue = new Queue('alerts', url, {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600,
      },
    },
  });

  alertQueue.process(async (job) => {
    return processAlert(job.data);
  });

  alertQueue.on('completed', (job) => {
    console.log(`Alert job ${job.id} completed`);
  });

  alertQueue.on('failed', (job, err) => {
    console.error(`Alert job ${job.id} failed:`, err.message);
  });

  return alertQueue;
}

async function processAlert(data: AlertQueueData): Promise<AlertMetadata> {
  const startTime = Date.now();

  try {
    const alert = await Alert.findById(data.alertId).exec();
    if (!alert) {
      throw new Error(`Alert not found: ${data.alertId}`);
    }

    const user = await User.findById(data.userId).exec();
    if (!user) {
      throw new Error(`User not found: ${data.userId}`);
    }

    const metrics = await alertingService.sendAlert(alert, user.email);

    return {
      queuedAt: startTime,
      processedAt: Date.now(),
      processingTime: Date.now() - startTime,
      deliveryMetrics: metrics,
    };
  } catch (error: any) {
    console.error('Error processing alert:', error);
    throw error;
  }
}

export async function queueAlert(
  alertId: string,
  userId: string
): Promise<Queue.Job<AlertQueueData>> {
  const queue = alertQueue || (await initializeAlertQueue());
  return queue.add({ alertId, userId }, { priority: 10 });
}

export async function getAlertQueue(): Promise<Queue.Queue<AlertQueueData> | null> {
  return alertQueue;
}

export async function getQueueStats(): Promise<any> {
  if (!alertQueue) {
    return null;
  }

  const counts = await alertQueue.getJobCounts();
  const failed = await alertQueue.getFailed(0, -1);
  const delayed = await alertQueue.getDelayed(0, -1);

  return {
    counts,
    failedCount: failed.length,
    delayedCount: delayed.length,
  };
}
