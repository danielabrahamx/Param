import express from 'express';
import { analyticsService } from '../services/analyticsService';
import pino from 'pino';

const logger = pino();
const router = express.Router();

// GET /api/v1/analytics/dashboard - Get dashboard metrics
router.get('/dashboard', async (_req, res) => {
  try {
    const metrics = await analyticsService.getDashboardMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error(`Failed to get dashboard metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/v1/analytics/policies - Get policy metrics
router.get('/policies', async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit || 30));
    const data = await analyticsService.getPolicyMetrics(limit);

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error(`Failed to get policy metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/v1/analytics/claims - Get claim metrics
router.get('/claims', async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit || 30));
    const data = await analyticsService.getClaimMetrics(limit);

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error(`Failed to get claim metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/v1/analytics/pool - Get pool metrics
router.get('/pool', async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit || 30));
    const data = await analyticsService.getPoolMetrics(limit);

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error(`Failed to get pool metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// GET /api/v1/analytics/revenue - Get revenue metrics
router.get('/revenue', async (req, res) => {
  try {
    const limit = parseInt(String(req.query.limit || 30));
    const data = await analyticsService.getRevenueMetrics(limit);

    res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error(`Failed to get revenue metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
