import express from 'express';

const router = express.Router();

// GET /health - Health check
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'analytics-service',
    version: '1.0.0',
  });
});

// GET /ready - Readiness check
router.get('/ready', (_req, res) => {
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
