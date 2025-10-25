import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { policyRouter } from './routes/policies';
import { poolRouter } from './routes/pool';
import { syncPolicies } from './sync-policies';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/policies', policyRouter);
app.use('/api/v1/pool', poolRouter);

// Start periodic policy sync (every 2 minutes)
const SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes
setInterval(async () => {
  try {
    console.log('[Policy Service] Running periodic sync...');
    await syncPolicies();
    console.log('[Policy Service] Periodic sync completed');
  } catch (error) {
    console.error('[Policy Service] Periodic sync error:', error);
  }
}, SYNC_INTERVAL);

// Run initial sync on startup
syncPolicies()
  .then(() => console.log('[Policy Service] Initial sync completed on startup'))
  .catch(err => console.error('[Policy Service] Initial sync failed:', err));

app.listen(port, () => {
  console.log(`Policy service listening on port ${port}`);
});