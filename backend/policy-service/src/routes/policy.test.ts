import request from 'supertest';
import express from 'express';
import { policyRouter } from '../routes/policies';
import { poolRouter } from '../routes/pool';
import { syncPolicies } from '../sync-policies';

jest.mock('../sync-policies');

const app = express();
app.use(express.json());
app.use('/api/v1/policies', policyRouter);
app.use('/api/v1/pool', poolRouter);

describe('Policy Service Routes', () => {
  describe('GET /api/v1/policies', () => {
    it('should return a list of policies', async () => {
      const res = await request(app).get('/api/v1/policies');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/pool/stats', () => {
    it('should return pool statistics', async () => {
      const res = await request(app).get('/api/v1/pool/stats');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('POST /api/v1/pool/sync', () => {
    it('should trigger a policy sync', async () => {
      const res = await request(app).post('/api/v1/pool/sync');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(syncPolicies).toHaveBeenCalled();
    });
  });
});
