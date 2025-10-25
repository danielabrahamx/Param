import axios from 'axios';
import crypto from 'crypto';
import pino from 'pino';

const logger = pino();

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: Record<string, any>;
}

export class WebhookService {
  async sendWebhook(
    webhookUrl: string,
    secret: string,
    payload: WebhookPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const message = `${timestamp}.${JSON.stringify(payload)}`;
      const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');

      await axios.post(webhookUrl, payload, {
        headers: {
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp.toString(),
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logger.info(`Webhook sent to ${webhookUrl} for event ${payload.event}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send webhook to ${webhookUrl}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}

export const webhookService = new WebhookService();
