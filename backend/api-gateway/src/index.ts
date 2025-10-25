import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Debug endpoint - needs json parsing
app.use('/debug', express.json());
app.post('/debug/echo', (req, res) => {
  res.json({ received: req.body, headers: req.headers });
});

// Proxy to policy-service
app.use('/api/v1/policies', createProxyMiddleware({ target: 'http://policy-service:3001', changeOrigin: true }));

// Proxy to oracle-service
app.use('/api/v1/oracle', createProxyMiddleware({ target: 'http://oracle-service:3002', changeOrigin: true }));

// Proxy to claims-service - DO NOT parse body, let the target service do it
app.use('/api/v1/claims', createProxyMiddleware({ 
  target: 'http://claims-service:3003', 
  changeOrigin: true,
  logLevel: 'debug'
}));

// Proxy to notification-service
app.use('/api/v1/notifications', createProxyMiddleware({ target: 'http://notification-service:3004', changeOrigin: true }));

// Proxy to analytics-service
app.use('/api/v1/analytics', createProxyMiddleware({ target: 'http://analytics-service:3005', changeOrigin: true }));

// Proxy to pool endpoint in policy-service
app.use('/api/v1/pool', createProxyMiddleware({ target: 'http://policy-service:3001', changeOrigin: true }));

app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
