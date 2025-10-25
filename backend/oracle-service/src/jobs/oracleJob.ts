import { Queue, Worker } from 'bullmq';
import axios from 'axios';
import { ethers } from 'ethers';
import { db } from '../db';
import { floodReadings } from '../db/schema';

const queue = new Queue('oracle', { connection: { host: process.env.REDIS_HOST || 'localhost' } });

export const startOracleJob = () => {
  // Add job every 5 minutes
  setInterval(() => {
    queue.add('fetch-flood-data', {});
  }, 5 * 60 * 1000);

  const worker = new Worker('oracle', async (job) => {
    if (job.name === 'fetch-flood-data') {
      await fetchAndUpdateFloodData();
    }
  }, { connection: { host: process.env.REDIS_HOST || 'localhost' } });
};

const fetchAndUpdateFloodData = async () => {
  const regions = process.env.REGIONS ? process.env.REGIONS.split(',') : ['01646500']; // example USGS site

  for (const region of regions) {
    try {
      const response = await axios.get(`https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${region}&parameterCd=00065`);
      const data = response.data.value.timeSeries[0].values[0].value[0];
      const level = Math.floor(parseFloat(data.value) * 100); // convert to int, e.g. feet * 100

      // Store in DB
      await db.insert(floodReadings).values({
        location: region,
        level,
      });

      // Update on-chain
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

      const oracleAbi = [
        "function updateFloodLevel(uint256 regionId, uint256 level) external"
      ];
      const oracle = new ethers.Contract(process.env.ORACLE_REGISTRY_ADDRESS!, oracleAbi, signer);

      const regionId = parseInt(region); // assume region is id
      await oracle.updateFloodLevel(regionId, level);
    } catch (error) {
      console.error(`Error updating region ${region}:`, error);
    }
  }
};