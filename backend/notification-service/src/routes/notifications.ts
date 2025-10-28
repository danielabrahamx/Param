import express from 'express';
import { notificationService } from '../services/notificationService';
import { enqueueNotification } from '../jobs/notificationWorker';
import { enqueueTrigger } from '../jobs/triggerWorker';
import pino from 'pino';
import { z } from 'zod';

const logger = pino();
const router = express.Router();

// Validation schemas
const NotificationRequestSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(['email', 'sms', 'push', 'in-app']),
  recipient: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const TriggerEventSchema = z.object({
  eventType: z.string().min(1),
  userId: z.string().min(1),
  data: z.record(z.any()),
});

// POST /api/v1/notifications/send - Send a notification
router.post('/send', async (req, res) => {
  try {
    const validatedData = NotificationRequestSchema.parse(req.body);

    const job = await enqueueNotification({
      ...validatedData,
      type: validatedData.type,
    });

    res.status(202).json({
      success: true,
      message: 'Notification queued',
      jobId: job.id,
    });
  } catch (error) {
    logger.error(`Failed to send notification: ${error}`);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid request',
    });
  }
});

// POST /api/v1/notifications/trigger - Trigger event-based notifications
router.post('/trigger', async (req, res) => {
  try {
    const validatedData = TriggerEventSchema.parse(req.body);

    const job = await enqueueTrigger(validatedData);

    res.status(202).json({
      success: true,
      message: 'Trigger event queued',
      jobId: job.id,
    });
  } catch (error) {
    logger.error(`Failed to trigger notifications: ${error}`);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : 'Invalid request',
    });
  }
});

// GET /api/v1/notifications/logs/:userId - Get notification logs
router.get('/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await notificationService.getNotificationLogs(
      userId,
      parseInt(String(limit)),
      parseInt(String(offset))
    );

    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    logger.error(`Failed to get notification logs: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/v1/notifications/in-app/:userId - Get in-app notifications
router.get('/in-app/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { unreadOnly = false, limit = 20 } = req.query;

    const notifications = await notificationService.getInAppNotifications(
      userId,
      Boolean(unreadOnly),
      parseInt(String(limit))
    );

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    logger.error(`Failed to get in-app notifications: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// PUT /api/v1/notifications/in-app/:id/read - Mark in-app notification as read
router.put('/in-app/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body; // require userId for authorization

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const success = await notificationService.markInAppAsRead(id, userId);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Notification not found or not authorized' });
    }
  } catch (error) {
    logger.error(`Failed to mark notification as read: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
