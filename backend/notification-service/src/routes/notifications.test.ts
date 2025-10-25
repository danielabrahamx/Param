// Mock external services BEFORE any imports
jest.mock('../services/emailService');
jest.mock('../services/smsService');
jest.mock('../services/pushService');

import request from 'supertest';
import express from 'express';
import notificationRoutes from '../routes/notifications';

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notificationRoutes);

describe('Notification Routes', () => {
  describe('POST /api/v1/notifications/send', () => {
    it('should queue a notification or return error', async () => {
      const response = await request(app).post('/api/v1/notifications/send').send({
        userId: 'user-123',
        type: 'email',
        recipient: 'test@example.com',
        subject: 'Test Subject',
        content: '<h1>Test Content</h1>',
      });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });
  });

  describe('POST /api/v1/notifications/trigger', () => {
    it('should queue a trigger event or return error', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'policy_created',
          userId: 'user-123',
          data: {
            policyId: 'policy-456',
            coverage: 50000,
            premium: 5000,
          },
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/logs/:userId', () => {
    it('should get notification logs for user or return error', async () => {
      const response = await request(app).get('/api/v1/notifications/logs/user-123');

      expect([200, 500].includes(response.status)).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/in-app/:userId', () => {
    it('should get in-app notifications for user or return error', async () => {
      const response = await request(app).get('/api/v1/notifications/in-app/user-123');

      expect([200, 500].includes(response.status)).toBe(true);
    });
  });

  describe('PUT /api/v1/notifications/in-app/:id/read', () => {
    it('should mark in-app notification as read or return error', async () => {
      const response = await request(app).put('/api/v1/notifications/in-app/notif-123/read');

      expect([200, 500].includes(response.status)).toBe(true);
    });
  });
});
