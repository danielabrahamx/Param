const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.post('/', async (req, res) => {
  try {
    const { 
      policyAddress, 
      amount, 
      txHash,
      floodLevel 
    } = req.body;

    if (!policyAddress || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: policyAddress, amount' 
      });
    }

    const amountAtto = BigInt(amount).toString();

    const policyResult = await db.query(
      'SELECT id, policy_address FROM policies WHERE policy_address = $1',
      [policyAddress]
    );

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Policy not found' 
      });
    }

    const policy = policyResult.rows[0];

    const result = await db.query(
      `INSERT INTO claims (policy_id, policy_address, amount, tx_hash, flood_level, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [policy.id, policyAddress, amountAtto, txHash, floodLevel, 'completed']
    );

    await db.query(
      'UPDATE policies SET claimed = true WHERE id = $1',
      [policy.id]
    );

    const claim = result.rows[0];
    console.log('✅ Claim created:', claim.id);

    res.status(201).json({
      success: true,
      claim: {
        ...claim,
        amount: claim.amount
      }
    });
  } catch (error) {
    console.error('❌ Error creating claim:', error);
    res.status(500).json({ 
      error: 'Failed to create claim',
      message: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, p.policyholder, p.coverage
       FROM claims c
       JOIN policies p ON c.policy_id = p.id
       ORDER BY c.created_at DESC`
    );

    const claims = result.rows.map(claim => ({
      ...claim,
      amount: claim.amount,
      coverage: claim.coverage
    }));

    res.json({ 
      success: true, 
      claims,
      count: claims.length
    });
  } catch (error) {
    console.error('❌ Error fetching claims:', error);
    res.status(500).json({ 
      error: 'Failed to fetch claims',
      message: error.message 
    });
  }
});

router.get('/policy/:policyAddress', async (req, res) => {
  try {
    const { policyAddress } = req.params;
    
    const result = await db.query(
      `SELECT c.*, p.policyholder, p.coverage
       FROM claims c
       JOIN policies p ON c.policy_id = p.id
       WHERE c.policy_address = $1
       ORDER BY c.created_at DESC`,
      [policyAddress]
    );

    const claims = result.rows.map(claim => ({
      ...claim,
      amount: claim.amount,
      coverage: claim.coverage
    }));

    res.json({
      success: true,
      claims,
      count: claims.length
    });
  } catch (error) {
    console.error('❌ Error fetching claims:', error);
    res.status(500).json({ 
      error: 'Failed to fetch claims',
      message: error.message 
    });
  }
});

module.exports = router;
