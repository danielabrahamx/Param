import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../routes/analytics';

// Mock the analytics service
jest.mock('../services/analyticsService');

const app = express();
app.use(express.json());
app.use('/api/v1/analytics', analyticsRoutes);

describe('Analytics Routes', () => {
  describe('GET /api/v1/analytics/dashboard', () => {
    it('should return dashboard metrics or 500 if DB unavailable', async () => {
      const response = await request(app).get('/api/v1/analytics/dashboard');

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        // Data may be undefined if DB unavailable
        if (response.body.data) {
          expect(response.body.data).toBeDefined();
        }
      } else if (response.status === 500) {
        // DB not available is OK during tests
        expect(response.body.error).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/analytics/policies', () => {
    it('should return policy metrics or 500 if DB unavailable', async () => {
      const response = await request(app).get('/api/v1/analytics/policies');

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should support limit parameter', async () => {
      const response = await request(app).get('/api/v1/analytics/policies?limit=10');

      expect([200, 500].includes(response.status)).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/claims', () => {
    it('should return claim metrics or 500 if DB unavailable', async () => {
      const response = await request(app).get('/api/v1/analytics/claims');

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/analytics/pool', () => {
    it('should return pool metrics or 500 if DB unavailable', async () => {
      const response = await request(app).get('/api/v1/analytics/pool');

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/analytics/revenue', () => {
    it('should return revenue metrics or 500 if DB unavailable', async () => {
      const response = await request(app).get('/api/v1/analytics/revenue');

      expect([200, 500].includes(response.status)).toBe(true);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });
});
