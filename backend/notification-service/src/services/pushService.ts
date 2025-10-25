import webpush from 'web-push';
import pino from 'pino';

const logger = pino();

export interface PushOptions {
  subscription: any; // PushSubscription from browser
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export class PushService {
  constructor() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@paramify.io',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  async send(options: PushOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (!process.env.VAPID_PUBLIC_KEY) {
        logger.warn('Web Push credentials not configured, skipping push notification');
        return { success: true };
      }

      const payload = JSON.stringify({
        title: options.title,
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag || 'notification',
        data: options.data || {},
      });

      await webpush.sendNotification(options.subscription, payload);

      logger.info(`Push notification sent to user`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send push notification: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}

export const pushService = new PushService();
