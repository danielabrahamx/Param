import { Worker, Queue } from 'bullmq';
import pino from 'pino';
import { db } from '../db';
import { notificationPreferences, notificationTemplates } from '../db/schema';
import { enqueueNotification } from './notificationWorker';
import { eq } from 'drizzle-orm';

const logger = pino();

const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export interface TriggerEvent {
  eventType: string; // 'policy_created', 'premium_paid', 'flood_alert', 'claim_triggered', 'policy_expiring'
  userId: string;
  data: Record<string, any>;
  timestamp?: number;
}

export const triggerQueue = new Queue('triggers', {
  connection: redis,
});

export const triggerWorker = new Worker(
  'triggers',
  async (job) => {
    logger.info(`Processing trigger job: ${job.id}`);

    const event: TriggerEvent = job.data;

    try {
      // Get notification preferences for user
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, event.userId))
        .limit(1);

      const userPrefs = prefs[0];
      if (!userPrefs) {
        logger.warn(`No preferences found for user ${event.userId}`);
        return;
      }

      // Get notification template for event
      const templates = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.eventType, event.eventType))
        .limit(1);

      const template = templates[0];
      if (!template) {
        logger.warn(`No template found for event ${event.eventType}`);
        return;
      }

      // Send notifications based on preferences and template
      if (userPrefs.enableEmail && template.emailTemplate && userPrefs.emailAddress) {
        await enqueueNotification({
          userId: event.userId,
          type: 'email',
          recipient: userPrefs.emailAddress,
          subject: template.emailSubject || 'Notification',
          content: renderTemplate(template.emailTemplate, event.data),
          metadata: { eventType: event.eventType, ...event.data },
        });
      }

      if (userPrefs.enableSms && template.smsTemplate && userPrefs.phoneNumber) {
        await enqueueNotification({
          userId: event.userId,
          type: 'sms',
          recipient: userPrefs.phoneNumber,
          content: renderTemplate(template.smsTemplate, event.data),
          metadata: { eventType: event.eventType },
        });
      }

      if (userPrefs.enableInApp && template.inAppContent) {
        await enqueueNotification({
          userId: event.userId,
          type: 'in-app',
          subject: template.inAppTitle || 'Notification',
          content: renderTemplate(template.inAppContent, event.data),
          metadata: {
            eventType: event.eventType,
            notificationType: 'info',
            relatedId: event.data.policyId || event.data.claimId,
          },
        });
      }

      logger.info(`Trigger job ${job.id} completed successfully`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Trigger job ${job.id} failed: ${errorMessage}`);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

export async function enqueueTrigger(event: TriggerEvent) {
  try {
    const job = await triggerQueue.add(`trigger-${event.eventType}-${Date.now()}`, event, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 500,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });

    logger.info(`Trigger enqueued with job id: ${job.id}`);
    return job;
  } catch (err) {
    logger.error(`Failed to enqueue trigger: ${err}`);
    throw err;
  }
}

function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  Object.keys(data).forEach((key) => {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key]));
  });
  return rendered;
}
