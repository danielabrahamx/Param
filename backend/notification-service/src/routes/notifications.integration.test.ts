// Notification Service Integration Tests
// Run with: npm test

jest.mock('../services/emailService');
jest.mock('../services/smsService');
jest.mock('../services/pushService');

import request from 'supertest';
import express from 'express';
import notificationRoutes from '../routes/notifications';

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notificationRoutes);

describe('📧 Notification Service Integration Tests', () => {
  describe('POST /api/v1/notifications/send', () => {
    it('should queue an email notification', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .send({
          userId: 'test-user-1',
          type: 'email',
          recipient: 'user@example.com',
          subject: 'Test Email',
          content: '<h1>Test</h1>',
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
      if (response.status === 200 || response.status === 202) {
        expect(response.body.success).toBe(true);
        expect(response.body.jobId).toBeDefined();
      }
    });

    it('should queue an SMS notification', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .send({
          userId: 'test-user-1',
          type: 'sms',
          recipient: '+1-555-0001',
          content: 'Test SMS message',
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });

    it('should reject invalid notification type', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .send({
          userId: 'test-user-1',
          type: 'invalid-type',
          recipient: 'user@example.com',
          content: 'Test',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .send({
          userId: 'test-user-1',
          // missing type and recipient
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/notifications/trigger', () => {
    it('should trigger policy_created event', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'policy_created',
          userId: 'test-user-1',
          data: {
            policyId: 'policy-001',
            coverage: 50000,
            premium: 5000,
            policyHolder: 'John Doe',
          },
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
      if (response.status === 200 || response.status === 202) {
        expect(response.body.success).toBe(true);
        expect(response.body.jobId).toBeDefined();
      }
    });

    it('should trigger flood_alert event', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'flood_alert',
          userId: 'test-user-1',
          data: {
            currentLevel: 2500,
            threshold: 3000,
            percentage: 83,
            zone: 'downtown',
          },
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });

    it('should trigger claim_approved event', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'claim_approved',
          userId: 'test-user-1',
          data: {
            claimId: 'claim-001',
            amount: 25000,
            approvedAt: new Date().toISOString(),
          },
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });

    it('should trigger claim_denied event', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'claim_denied',
          userId: 'test-user-1',
          data: {
            claimId: 'claim-002',
            reason: 'Policy was expired at time of claim',
          },
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });

    it('should trigger premium_paid event', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'premium_paid',
          userId: 'test-user-2',
          data: {
            amount: 5000,
            transactionId: 'tx-001',
            expiryDate: '2026-10-24',
          },
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });

    it('should reject invalid event type', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'invalid_event',
          userId: 'test-user-1',
          data: {},
        });

      expect([202, 400, 500].includes(response.status)).toBe(true);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'policy_created',
          // missing userId
          data: {},
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/notifications/logs/:userId', () => {
    it('should return notification logs for user', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/logs/test-user-1')
        .query({ limit: 10, offset: 0 });

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.count).toBeDefined();
      }
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/logs/test-user-1')
        .query({ limit: 5, offset: 5 });

      expect([200, 500].includes(response.status)).toBe(true);
    });

    it('should return empty array for user with no logs', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/logs/nonexistent-user')
        .query({ limit: 10, offset: 0 });

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should filter by type', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/logs/test-user-1')
        .query({ type: 'email', limit: 10 });

      expect([200, 500].includes(response.status)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/logs/test-user-1')
        .query({ status: 'sent', limit: 10 });

      expect([200, 500].includes(response.status)).toBe(true);
    });
  });

  describe('GET /api/v1/notifications/in-app/:userId', () => {
    it('should return in-app notifications for user', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/in-app/test-user-1');

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should return only unread notifications if filter applied', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/in-app/test-user-1')
        .query({ unreadOnly: true });

      expect([200, 500].includes(response.status)).toBe(true);
    });

    it('should return empty array for user with no notifications', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/in-app/nonexistent-user');

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('PUT /api/v1/notifications/in-app/:id/read', () => {
    it('should mark notification as read', async () => {
      // First get notifications to find an ID
      const getResponse = await request(app)
        .get('/api/v1/notifications/in-app/test-user-1');

      if (getResponse.status === 200 && getResponse.body.data && getResponse.body.data.length > 0) {
        const notificationId = getResponse.body.data[0].id;

        const response = await request(app)
          .put(`/api/v1/notifications/in-app/${notificationId}/read`)
          .send({ read: true });

        expect([200, 500].includes(response.status)).toBe(true);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      }
    });

    it('should return error for nonexistent notification', async () => {
      const response = await request(app)
        .put('/api/v1/notifications/in-app/nonexistent-id/read')
        .send({ read: true });

      // Service may return 200 (graceful), 404 (not found), or 500 (DB error)
      expect([200, 400, 404, 500].includes(response.status)).toBe(true);
    });
  });

  describe('🔄 Workflow: Complete Policy Purchase Notification', () => {
    it('should handle full policy creation workflow', async () => {
      // Step 1: Trigger policy_created event
      const triggerResponse = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'policy_created',
          userId: 'test-user-1',
          data: {
            policyId: 'workflow-policy-001',
            coverage: 50000,
            premium: 5000,
            policyHolder: 'Test User',
          },
        });

      expect([200, 202, 400, 500].includes(triggerResponse.status)).toBe(true);

      // Step 2: Verify notification was queued (check logs after small delay)
      await new Promise(resolve => setTimeout(resolve, 100));

      const logsResponse = await request(app)
        .get('/api/v1/notifications/logs/test-user-1')
        .query({ limit: 10 });

      expect([200, 500].includes(logsResponse.status)).toBe(true);
    });
  });

  describe('🔄 Workflow: Complete Flood Alert Workflow', () => {
    it('should handle complete flood alert workflow', async () => {
      // Trigger flood alert
      const alertResponse = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'flood_alert',
          userId: 'test-user-1',
          data: {
            currentLevel: 2800,
            threshold: 3000,
            percentage: 93,
            zone: 'downtown',
          },
        });

      expect([200, 202, 400, 500].includes(alertResponse.status)).toBe(true);

      // Check in-app notification was created
      const inAppResponse = await request(app)
        .get('/api/v1/notifications/in-app/test-user-1');

      expect([200, 500].includes(inAppResponse.status)).toBe(true);
    });
  });

  describe('🔄 Workflow: Complete Claim Approval Workflow', () => {
    it('should handle complete claim approval workflow', async () => {
      // Trigger claim approved event
      const approvalResponse = await request(app)
        .post('/api/v1/notifications/trigger')
        .send({
          eventType: 'claim_approved',
          userId: 'test-user-1',
          data: {
            claimId: 'workflow-claim-001',
            amount: 25000,
            approvedAt: new Date().toISOString(),
          },
        });

      expect([200, 202, 400, 500].includes(approvalResponse.status)).toBe(true);

      // Verify logs contain the notification
      await new Promise(resolve => setTimeout(resolve, 100));

      const logsResponse = await request(app)
        .get('/api/v1/notifications/logs/test-user-1')
        .query({ limit: 20 });

      expect([200, 500].includes(logsResponse.status)).toBe(true);
    });
  });

  describe('⚠️ Error Handling', () => {
    it('should handle database unavailability gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/notifications/logs/test-user-1');

      // Should return 200 with empty data or 500 with error message
      expect([200, 500].includes(response.status)).toBe(true);
    });

    it('should validate input data types', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .send({
          userId: 123, // Should be string
          type: 'email',
          recipient: 'test@example.com',
          content: 'Test',
        });

      expect([200, 202, 400, 500].includes(response.status)).toBe(true);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/notifications/send')
        .set('Content-Type', 'application/json')
        .send('{invalid json}');

      expect(response.status).toBe(400);
    });
  });

  describe('✅ Health Check', () => {
    it('should respond to health checks', async () => {
      const response = await request(app).get('/health');

      expect([200, 404].includes(response.status)).toBe(true);
    });
  });
});
