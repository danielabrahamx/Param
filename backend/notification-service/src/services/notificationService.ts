import { db } from '../db';
import { notificationLogs, inAppNotifications } from '../db/schema';
import { emailService } from './emailService';
import { smsService } from './smsService';
import { pushService } from './pushService';
import pino from 'pino';
import { eq } from 'drizzle-orm';

const logger = pino();

export interface NotificationRequest {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  recipient?: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  async sendNotification(req: NotificationRequest): Promise<{ success: boolean; logId: string; error?: string }> {
    const logId = crypto.randomUUID();

    try {
      // Create log entry
      await db.insert(notificationLogs).values({
        id: logId,
        userId: req.userId,
        type: req.type,
        channel: this.getChannel(req.type),
        recipient: req.recipient || '',
        subject: req.subject,
        content: req.content,
        metadata: req.metadata,
        status: 'pending',
      });

      let success = false;
      let error: string | undefined;

      switch (req.type) {
        case 'email':
          if (!req.recipient) throw new Error('Email recipient required');
          const emailResult = await emailService.send({
            to: req.recipient,
            subject: req.subject || 'Notification',
            html: req.content,
          });
          success = emailResult.success;
          error = emailResult.error;
          break;

        case 'sms':
          if (!req.recipient) throw new Error('SMS recipient required');
          const smsResult = await smsService.send({
            to: req.recipient,
            body: req.content,
          });
          success = smsResult.success;
          error = smsResult.error;
          break;

        case 'push':
          if (!req.metadata?.subscription) throw new Error('Push subscription required');
          const pushResult = await pushService.send({
            subscription: req.metadata.subscription,
            title: req.subject || 'Notification',
            body: req.content,
            data: req.metadata.data,
          });
          success = pushResult.success;
          error = pushResult.error;
          break;

        case 'in-app':
          success = await this.createInAppNotification(req);
          break;

        default:
          throw new Error(`Unknown notification type: ${req.type}`);
      }

      // Update log status
      await db
        .update(notificationLogs)
        .set({
          status: success ? 'sent' : 'failed',
          failureReason: error,
        })
        .where(eq(notificationLogs.id, logId));

      return { success, logId, error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`Failed to send notification: ${errorMessage}`);

      // Update log with error
      await db
        .update(notificationLogs)
        .set({
          status: 'failed',
          failureReason: errorMessage,
        })
        .where(eq(notificationLogs.id, logId))
        .catch(() => {
          // Ignore error during update
        });

      return { success: false, logId, error: errorMessage };
    }
  }

  private getChannel(type: string): string {
    const channelMap: Record<string, string> = {
      email: 'sendgrid',
      sms: 'twilio',
      push: 'web-push',
      'in-app': 'in-app-db',
    };
    return channelMap[type] || 'unknown';
  }

  private async createInAppNotification(req: NotificationRequest): Promise<boolean> {
    try {
      await db.insert(inAppNotifications).values({
        userId: req.userId,
        title: req.subject || 'Notification',
        content: req.content,
        type: req.metadata?.notificationType || 'info',
        relatedId: req.metadata?.relatedId,
      });
      return true;
    } catch (err) {
      logger.error(`Failed to create in-app notification: ${err}`);
      return false;
    }
  }

  async getNotificationLogs(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const logs = await db
        .select()
        .from(notificationLogs)
        .where(eq(notificationLogs.userId, userId))
        .limit(limit)
        .offset(offset);

      return logs;
    } catch (err) {
      logger.error(`Failed to get notification logs: ${err}`);
      throw err;
    }
  }

  async getInAppNotifications(userId: string, unreadOnly: boolean = false, limit: number = 20) {
    try {
      let query = db
        .select()
        .from(inAppNotifications)
        .where(eq(inAppNotifications.userId, userId))
        .orderBy(inAppNotifications.createdAt)
        .limit(limit);

      if (unreadOnly) {
        // Drizzle's `where` can't be chained like that. We need to build the query differently.
        // This is a simplified example. For complex queries, you might need to construct the where clause dynamically.
        const notifications = await db
          .select()
          .from(inAppNotifications)
          .where(eq(inAppNotifications.userId, userId) && eq(inAppNotifications.isRead, false))
          .orderBy(inAppNotifications.createdAt)
          .limit(limit);
        return notifications;
      }

      const notifications = await query;
      return notifications;
    } catch (err) {
      logger.error(`Failed to get in-app notifications: ${err}`);
      throw err;
    }
  }

  async markInAppAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .update(inAppNotifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(inAppNotifications.id, notificationId) && eq(inAppNotifications.userId, userId));

      return (result.rowCount || 0) > 0;
    } catch (err) {
      logger.error(`Failed to mark notification as read: ${err}`);
      return false;
    }
  }
}

export const notificationService = new NotificationService();

// Add crypto import
import crypto from 'crypto';
