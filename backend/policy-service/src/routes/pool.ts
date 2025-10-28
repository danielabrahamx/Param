import { Router } from 'express';
import {
  Client,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  PrivateKey,
  AccountId,
} from '@hashgraph/sdk';
import { db } from '../db';
import { poolReserve, claimsPool } from '../db/schema';
import { z } from 'zod';

import { syncPolicies } from '../sync-policies';

const router = Router();

const depositSchema = z.object({
  amount: z.number().positive(),
});

// GET /api/v1/pool - get claims pool data (for Pool page)
router.get('/', async (req, res) => {
  try {
    const pool = await db.select().from(claimsPool).limit(1);
    
    if (pool.length === 0) {
      res.setHeader('Content-Type', 'application/json');
      return res.send(JSON.stringify({
        tvl: 0,
        reserveRatio: 0,
        totalCapacity: '0',
        availableBalance: '0',
        totalClaimsProcessed: '0',
      }));
    }

    const totalCapacity = parseFloat(pool[0].totalCapacity.toString());
    const totalReserves = totalCapacity; // Total reserves equals total capacity in claims pool
    const reserveRatio = totalCapacity > 0 ? (totalReserves / totalCapacity) * 100 : 0;

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      tvl: totalCapacity,
      reserveRatio: Math.round(reserveRatio * 100) / 100,
      totalCapacity: pool[0].totalCapacity.toString(),
      availableBalance: pool[0].availableBalance.toString(),
      totalClaimsProcessed: pool[0].totalClaimsProcessed.toString(),
    }));
  } catch (error) {
    console.error('Error fetching pool data:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({
      error: 'Failed to fetch pool data',
      tvl: 0,
      reserveRatio: 0,
    }));
  }
});

router.get('/stats', async (req, res) => {
  try {
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(process.env.OPERATOR_ID!),
      PrivateKey.fromString(process.env.OPERATOR_KEY!)
    );

    const contractId = process.env.POOL_ADDRESS!;

    const contractQuery = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100000)
      .setFunction('getBalance')
      .execute(client);

    const record = await contractQuery.getRecord(client);
    const balance = record.contractFunctionResult!.getUint256(0);

    const tvl = Number(balance) / 1e8; // Convert from tinybar to HBAR

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      success: true,
      data: {
        tvl,
        // Add other stats as needed
      },
    }));
  } catch (error) {
    console.error('Error fetching pool data:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({ success: false, error: 'Failed to fetch pool stats' }));
  }
});

// Admin deposit into pool
router.post('/deposit', async (req, res) => {
  try {
    const { amount } = depositSchema.parse(req.body);

    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(process.env.OPERATOR_ID!),
      PrivateKey.fromString(process.env.OPERATOR_KEY!)
    );

    const contractId = process.env.POOL_ADDRESS!;

    const tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(100000)
      .setFunction('deposit')
      .setPayableAmount(amount)
      .execute(client);

    const receipt = await tx.getReceipt(client);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      success: true,
      txId: tx.transactionId.toString(),
      amount,
      message: `Successfully deposited ${amount} HBAR into pool`,
    }));
  } catch (error) {
    console.error('Error depositing to pool:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({
      success: false,
      error: 'Failed to deposit to pool',
      details: error instanceof Error ? error.message : String(error),
    }));
  }
});

router.post('/sync', async (req, res) => {
  try {
    await syncPolicies();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({ success: true, message: 'Sync completed' }));
  } catch (error) {
    console.error('Error syncing policies:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({ success: false, error: 'Failed to sync policies' }));
  }
});

export { router as poolRouter };