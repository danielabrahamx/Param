import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { oracleRouter } from './routes/oracle';
import { startOracleJob } from './jobs/oracleJob';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/oracle', oracleRouter);

startOracleJob();

app.listen(port, () => {
  console.log(`Oracle service listening on port ${port}`);
});