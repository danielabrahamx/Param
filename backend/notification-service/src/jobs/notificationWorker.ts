import { Worker, Queue } from 'bullmq';
import pino from 'pino';
import { notificationService } from '../services/notificationService';
import { webhookService } from '../services/webhookService';

const logger = pino();

const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export interface NotificationJob {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app' | 'webhook';
  recipient?: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
  retryCount?: number;
}

export const notificationQueue = new Queue('notifications', {
  connection: redis,
});

export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    logger.info(`Processing notification job: ${job.id}`);

    const data: NotificationJob = job.data;

    try {
      if (data.type === 'webhook') {
        const result = await webhookService.sendWebhook(
          data.recipient || '',
          data.metadata?.secret || '',
          {
            event: data.metadata?.event || '',
            timestamp: Date.now(),
            data: data.metadata?.data || {},
          }
        );

        if (!result.success && (data.retryCount || 0) < 3) {
          // Retry webhook on failure
          throw new Error(result.error || 'Webhook delivery failed');
        }
      } else {
        const result = await notificationService.sendNotification({
          userId: data.userId,
          type: data.type,
          recipient: data.recipient,
          subject: data.subject,
          content: data.content,
          metadata: data.metadata,
        });

        if (!result.success && (data.retryCount || 0) < 3) {
          throw new Error(result.error || 'Notification delivery failed');
        }
      }

      logger.info(`Notification job ${job.id} completed successfully`);
      return { success: true, jobId: job.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Notification job ${job.id} failed: ${errorMessage}`);

      const retryCount = (data.retryCount || 0) + 1;
      if (retryCount < 3) {
        // Re-queue with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000;
        await notificationQueue.add(
          `${data.type}-retry-${retryCount}`,
          { ...data, retryCount },
          { delay }
        );
        logger.info(`Notification job ${job.id} queued for retry #${retryCount} in ${delay}ms`);
      } else {
        // Move to dead-letter queue after max retries
        logger.error(`Notification job ${job.id} exhausted retries, moving to DLQ`);
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  }
);

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed: ${err.message}`);
});

notificationWorker.on('error', (err) => {
  logger.error(`Notification worker error: ${err.message}`);
});

export async function enqueueNotification(notification: NotificationJob) {
  try {
    const job = await notificationQueue.add(`${notification.type}-${Date.now()}`, notification, {
      attempts: 1,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    logger.info(`Notification enqueued with job id: ${job.id}`);
    return job;
  } catch (err) {
    logger.error(`Failed to enqueue notification: ${err}`);
    throw err;
  }
}
