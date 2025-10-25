import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pino from 'pino';
import notificationRoutes from './routes/notifications';
import healthRoutes from './routes/health';
import metricsRoutes from './routes/metrics';
import { notificationWorker } from './jobs/notificationWorker';
import { triggerWorker } from './jobs/triggerWorker';

dotenv.config();

const app = express();
const port = process.env.PORT || 3004;
const logger = pino();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.use('/health', healthRoutes);

// Metrics
app.use('/metrics', metricsRoutes);

// Notification routes
app.use('/api/v1/notifications', notificationRoutes);

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Notification Service listening on port ${port}`);
  logger.info('Notification Worker initialized');
  logger.info('Trigger Worker initialized');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await notificationWorker.close();
  await triggerWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await notificationWorker.close();
  await triggerWorker.close();
  process.exit(0);
});

export default app;
