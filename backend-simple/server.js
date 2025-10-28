require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/connection');

const policiesRouter = require('./routes/policies');
const claimsRouter = require('./routes/claims');
const oracleRouter = require('./routes/oracle');
const adminRouter = require('./routes/admin');
const analyticsRouter = require('./routes/analytics');
const { adminAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Paramify Backend'
  });
});

app.use('/api/v1/policies', policiesRouter);
app.use('/api/v1/claims', claimsRouter);
app.use('/api/v1/oracle', oracleRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/admin', adminAuth, adminRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

async function startServer() {
  try {
    console.log('🔄 Initializing database...');
    await db.initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n✅ Paramify Backend Server Started');
      console.log(`📡 Server running on http://0.0.0.0:${PORT}`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
      console.log('\n📋 API Endpoints:');
      console.log(`  POST   /api/policies - Create policy`);
      console.log(`  GET    /api/policies - List all policies`);
      console.log(`  GET    /api/policies/:address - Get policy by address`);
      console.log(`  POST   /api/claims - Create claim`);
      console.log(`  GET    /api/claims - List all claims`);
      console.log(`  GET    /api/claims/policy/:address - Get claims by policy`);
      console.log(`  GET    /api/oracle/flood-level - Get current flood level`);
      console.log(`  PUT    /api/admin/threshold - Update flood threshold`);
      console.log(`  PUT    /api/admin/flood-level - Update current flood level`);
      console.log(`  GET    /api/admin/threshold - Get current threshold\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
