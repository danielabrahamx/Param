import express from 'express';
import { db } from '../db';
import { notificationLogs } from '../db/schema';
import pino from 'pino';
import { gt } from 'drizzle-orm';

const logger = pino();
const router = express.Router();

export interface MetricsData {
  timestamp: number;
  notifications_sent_total: number;
  notifications_failed_total: number;
  notifications_pending_total: number;
  notifications_by_type: Record<string, number>;
  notifications_by_channel: Record<string, number>;
  notifications_by_status: Record<string, number>;
  delivery_success_rate: number;
  average_delivery_time_ms: number;
  queue_lengths: Record<string, number>;
}

// GET /metrics - Prometheus-format metrics
router.get('/', async (_req, res) => {
  try {
    const now = Date.now();
    const hourAgo = new Date(now - 3600000);

    // Fetch metrics from database
    const allNotifications = await db
      .select()
      .from(notificationLogs)
      .where(gt(notificationLogs.createdAt, hourAgo));

    // Calculate metrics
    const sentCount = allNotifications.filter((n) => n.status === 'sent').length;
    const failedCount = allNotifications.filter((n) => n.status === 'failed').length;
    const pendingCount = allNotifications.filter((n) => n.status === 'pending').length;

    const typeGroups = groupBy(allNotifications, 'type');
    const channelGroups = groupBy(allNotifications, 'channel');

    const successRate =
      allNotifications.length > 0 ? ((sentCount / allNotifications.length) * 100).toFixed(2) : '100';    // Calculate average delivery time for sent notifications
    const sentWithTime = allNotifications.filter((n) => n.status === 'sent' && n.deliveredAt);
    const avgDeliveryTime =
      sentWithTime.length > 0
        ? sentWithTime.reduce((sum, n) => {
            const deliveryTime =
              (n.deliveredAt?.getTime() || 0) - (n.createdAt?.getTime() || 0);
            return sum + deliveryTime;
          }, 0) / sentWithTime.length
        : 0;

    // Prometheus format
    let prometheusMetrics = `# HELP notifications_sent_total Total notifications sent\n`;
    prometheusMetrics += `# TYPE notifications_sent_total counter\n`;
    prometheusMetrics += `notifications_sent_total{service="notification-service"} ${sentCount}\n\n`;

    prometheusMetrics += `# HELP notifications_failed_total Total notifications failed\n`;
    prometheusMetrics += `# TYPE notifications_failed_total counter\n`;
    prometheusMetrics += `notifications_failed_total{service="notification-service"} ${failedCount}\n\n`;

    prometheusMetrics += `# HELP notifications_pending_total Total pending notifications\n`;
    prometheusMetrics += `# TYPE notifications_pending_total gauge\n`;
    prometheusMetrics += `notifications_pending_total{service="notification-service"} ${pendingCount}\n\n`;

    prometheusMetrics += `# HELP delivery_success_rate Success rate percentage\n`;
    prometheusMetrics += `# TYPE delivery_success_rate gauge\n`;
    prometheusMetrics += `delivery_success_rate{service="notification-service"} ${successRate}\n\n`;

    prometheusMetrics += `# HELP average_delivery_time_ms Average delivery time in milliseconds\n`;
    prometheusMetrics += `# TYPE average_delivery_time_ms gauge\n`;
    prometheusMetrics += `average_delivery_time_ms{service="notification-service"} ${avgDeliveryTime.toFixed(2)}\n\n`;

    // By type
    Object.entries(typeGroups).forEach(([type, count]) => {
      prometheusMetrics += `notifications_by_type{type="${type}",service="notification-service"} ${count}\n`;
    });
    prometheusMetrics += `\n`;

    // By channel
    Object.entries(channelGroups).forEach(([channel, count]) => {
      prometheusMetrics += `notifications_by_channel{channel="${channel}",service="notification-service"} ${count}\n`;
    });

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(prometheusMetrics);
  } catch (error) {
    logger.error(`Failed to generate metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /metrics/json - JSON format metrics
router.get('/json', async (_req, res) => {
  try {
    const now = Date.now();
    const hourAgo = new Date(now - 3600000);

    const allNotifications = await db
      .select()
      .from(notificationLogs)
      .where(gt(notificationLogs.createdAt, hourAgo));

    const sentCount = allNotifications.filter((n) => n.status === 'sent').length;
    const failedCount = allNotifications.filter((n) => n.status === 'failed').length;
    const pendingCount = allNotifications.filter((n) => n.status === 'pending').length;

    const metrics: MetricsData = {
      timestamp: now,
      notifications_sent_total: sentCount,
      notifications_failed_total: failedCount,
      notifications_pending_total: pendingCount,
      notifications_by_type: groupBy(allNotifications, 'type'),
      notifications_by_channel: groupBy(allNotifications, 'channel'),
      notifications_by_status: groupBy(allNotifications, 'status'),
      delivery_success_rate:
        allNotifications.length > 0 ? (sentCount / allNotifications.length) * 100 : 100,
      average_delivery_time_ms: calculateAverageDeliveryTime(allNotifications),
      queue_lengths: {
        notifications: pendingCount,
      },
    };

    res.status(200).json(metrics);
  } catch (error) {
    logger.error(`Failed to get metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

function groupBy(
  items: any[],
  key: string
): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      const groupKey = item[key] || 'unknown';
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

function calculateAverageDeliveryTime(notifications: any[]): number {
  const sentWithTime = notifications.filter((n) => n.status === 'sent' && n.deliveredAt);
  if (sentWithTime.length === 0) return 0;

  const totalTime = sentWithTime.reduce((sum, n) => {
    const deliveryTime = (n.deliveredAt?.getTime() || 0) - (n.createdAt?.getTime() || 0);
    return sum + deliveryTime;
  }, 0);

  return totalTime / sentWithTime.length;
}

export default router;
