import sgMail from '@sendgrid/mail';
import pino from 'pino';

const logger = pino();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.warn('SendGrid API key not configured, skipping email send');
        return { success: true, messageId: 'mock-id' };
      }

      const response = await sgMail.send({
        to: options.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@paramify.io',
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info(`Email sent to ${options.to}, messageId: ${response[0].headers['x-message-id']}`);
      return { success: true, messageId: response[0].headers['x-message-id'] as string };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to send email to ${options.to}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }
}

export const emailService = new EmailService();
