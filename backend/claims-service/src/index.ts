import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from './db';
import claimsRouter from './routes/claims';
import { monitorOracle } from './jobs/claimsJob';
import { claimsPool } from './db/schema';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const pool = await db.select().from(claimsPool).limit(1);
    res.json({ 
      status: 'ok', 
      pool: pool.length > 0 ? pool[0] : 'not initialized'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

app.use('/api/v1/claims', claimsRouter);

// Initialize claims pool if it doesn't exist
async function initializePool() {
  try {
    const pool = await db.select().from(claimsPool).limit(1);
    if (pool.length === 0) {
      console.log('Initializing claims pool...');
      await db.insert(claimsPool).values({
        totalCapacity: '1000000000000000000', // 1e18
        availableBalance: '1000000000000000000',
        totalClaimsProcessed: '0',
      });
      console.log('Claims pool initialized');
    } else {
      console.log('Claims pool already exists:', pool[0]);
    }
  } catch (error) {
    console.error('Error initializing claims pool:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Claims service listening on port ${PORT}`);
  await initializePool();
  monitorOracle(); // Start monitoring job
});