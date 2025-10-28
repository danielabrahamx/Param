const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Convert HBAR to atto-HBAR (wei) - 1 HBAR = 10^18 atto-HBAR
// Handle decimal inputs safely
const hbarToAtto = (hbar) => {
  const hbarStr = String(hbar);
  const [whole = '0', decimal = ''] = hbarStr.split('.');
  const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
  return BigInt(whole + paddedDecimal).toString();
};

router.post('/', async (req, res) => {
  try {
    const { 
      policyAddress, 
      amount, 
      txHash,
      floodLevel 
    } = req.body;

    if (!policyAddress || !amount || !txHash) {
      return res.status(400).json({ 
        error: 'Missing required fields: policyAddress, amount, txHash' 
      });
    }

    const policyResult = await db.query(
      'SELECT id, policy_address, claimed, coverage FROM policies WHERE policy_address = $1',
      [policyAddress]
    );

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Policy not found' 
      });
    }

    const policy = policyResult.rows[0];

    if (policy.claimed) {
      return res.status(409).json({ 
        error: 'Policy already claimed',
        message: 'This policy has already submitted a claim'
      });
    }

    const existingClaim = await db.query(
      'SELECT id FROM claims WHERE tx_hash = $1',
      [txHash]
    );

    if (existingClaim.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Duplicate transaction',
        message: 'A claim with this transaction hash already exists'
      });
    }

    const amountAtto = hbarToAtto(amount);

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
    console.log('✅ Claim created:', claim.id, 'for tx:', txHash);

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

router.post('/create', async (req, res) => {
  try {
    const { 
      policyId,
      policyAddress,
      policyholder,
      amount, 
      txHash,
      floodLevel 
    } = req.body;

    if (!policyAddress && !policyId) {
      return res.status(400).json({ 
        error: 'Missing required field: policyAddress or policyId' 
      });
    }

    if (!txHash) {
      return res.status(400).json({ 
        error: 'Missing required field: txHash (blockchain transaction hash)' 
      });
    }

    let policy;
    if (policyAddress) {
      const policyResult = await db.query(
        'SELECT id, policy_address, coverage, claimed FROM policies WHERE policy_address = $1',
        [policyAddress]
      );
      if (policyResult.rows.length > 0) {
        policy = policyResult.rows[0];
      }
    } else if (policyId) {
      const policyResult = await db.query(
        'SELECT id, policy_address, coverage, claimed FROM policies WHERE id = $1',
        [policyId]
      );
      if (policyResult.rows.length > 0) {
        policy = policyResult.rows[0];
      }
    }

    if (!policy) {
      return res.status(404).json({ 
        error: 'Policy not found' 
      });
    }

    if (policy.claimed) {
      return res.status(409).json({ 
        error: 'Policy already claimed',
        message: 'This policy has already submitted a claim'
      });
    }

    const existingClaim = await db.query(
      'SELECT id FROM claims WHERE tx_hash = $1',
      [txHash]
    );

    if (existingClaim.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Duplicate transaction',
        message: 'A claim with this transaction hash already exists'
      });
    }

    const amountAtto = amount ? hbarToAtto(amount) : policy.coverage;

    const result = await db.query(
      `INSERT INTO claims (policy_id, policy_address, amount, tx_hash, flood_level, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [policy.id, policy.policy_address, amountAtto, txHash, floodLevel, 'completed']
    );

    await db.query(
      'UPDATE policies SET claimed = true WHERE id = $1',
      [policy.id]
    );

    const claim = result.rows[0];
    console.log('✅ Claim created:', claim.id, 'for tx:', txHash);

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

router.get('/pool/status', async (req, res) => {
  try {
    const totalPoliciesResult = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(coverage), 0) as total_coverage FROM policies WHERE active = true'
    );

    const totalClaimsResult = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_paid FROM claims WHERE status = $1',
      ['completed']
    );

    const premiumsResult = await db.query(
      'SELECT COALESCE(SUM(premium), 0) as total_premiums FROM policies'
    );

    const totalPolicies = parseInt(totalPoliciesResult.rows[0].count);
    const totalCoverage = totalPoliciesResult.rows[0].total_coverage;
    const totalClaims = parseInt(totalClaimsResult.rows[0].count);
    const totalPaid = totalClaimsResult.rows[0].total_paid;
    const totalPremiums = premiumsResult.rows[0].total_premiums;

    let onChainBalance = '0';
    try {
      const poolAddress = '0x190e9ed37547edf2ebf3c828966f3708a5c3605f';
      const response = await fetch('https://testnet.hashio.io/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [poolAddress, 'latest'],
          id: 1
        })
      });
      const data = await response.json();
      if (data.result) {
        onChainBalance = BigInt(data.result).toString();
        console.log('🔗 Fetched on-chain pool balance:', onChainBalance, 'atto-HBAR');
      }
    } catch (error) {
      console.warn('⚠️  Failed to fetch on-chain balance, using database fallback:', error.message);
      onChainBalance = totalPremiums;
    }

    const poolBalance = BigInt(onChainBalance) - BigInt(totalPaid);

    res.json({
      success: true,
      data: {
        totalPolicies,
        totalClaims,
        poolBalance: poolBalance.toString(),
        onChainBalance: onChainBalance,
        totalCoverage: totalCoverage.toString(),
        totalPaid: totalPaid.toString(),
        totalPremiums: totalPremiums.toString(),
        utilizationRate: totalPolicies > 0 ? (totalClaims / totalPolicies * 100).toFixed(2) : 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching pool status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pool status',
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
