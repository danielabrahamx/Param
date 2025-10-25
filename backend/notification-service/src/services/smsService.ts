import twilio from 'twilio';
import pino from 'pino';

const logger = pino();

export interface SmsOptions {
  to: string;
  body: string;
}

export class SmsService {
  private client: ReturnType<typeof twilio> | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Only initialize Twilio client if credentials are properly configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      try {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN || '';
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
      } catch (error) {
        logger.warn('Failed to initialize Twilio client, will use mock responses');
        this.isConfigured = false;
      }
    } else {
      logger.warn('Twilio credentials not configured, using mock responses');
      this.isConfigured = false;
    }
  }

  async send(options: SmsOptions): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      if (!this.isConfigured || !this.client) {
        logger.info(`SMS mock send to ${options.to}: ${options.body}`);
        return { success: true, sid: `mock-sid-${Date.now()}` };
      }

      const message = await this.client.messages.create({
        body: options.body,
        from: process.env.TWILIO_PHONE_NUMBER || '',
        to: options.to,
      });

      logger.info(`SMS sent to ${options.to}, sid: ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send SMS to ${options.to}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}

export const smsService = new SmsService();
