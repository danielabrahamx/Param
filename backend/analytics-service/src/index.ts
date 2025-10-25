import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pino from 'pino';
import analyticsRoutes from './routes/analytics';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';
import { cacheService } from './services/cacheService';
import { aggregationWorker, scheduleAggregation } from './jobs/aggregationWorker';

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;
const logger = pino();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize cache
cacheService.connect().catch((err) => {
  logger.error(`Failed to connect to Redis: ${err}`);
});

// Health check
app.use('/health', healthRoutes);

// Metrics
app.use('/metrics', metricsRoutes);

// Analytics routes
app.use('/api/v1/analytics', analyticsRoutes);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(port, async () => {
  logger.info(`Analytics Service listening on port ${port}`);
  logger.info('Aggregation Worker initialized');

  // Schedule aggregation jobs
  await scheduleAggregation();
  logger.info('Aggregation jobs scheduled');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await aggregationWorker.close();
  await cacheService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await aggregationWorker.close();
  await cacheService.disconnect();
  process.exit(0);
});

export default app;
