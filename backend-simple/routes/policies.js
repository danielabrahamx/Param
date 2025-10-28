const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.post('/', async (req, res) => {
  try {
    const { 
      policyAddress, 
      policyholder, 
      coverage, 
      premium, 
      threshold = 10,
      gaugeStationId 
    } = req.body;

    if (!policyAddress || !policyholder || !coverage || !premium) {
      return res.status(400).json({ 
        error: 'Missing required fields: policyAddress, policyholder, coverage, premium' 
      });
    }

    // Convert HBAR to atto-HBAR (wei) - 1 HBAR = 10^18 atto-HBAR
    // Handle decimal inputs safely
    const hbarToAtto = (hbar) => {
      const hbarStr = String(hbar);
      const [whole = '0', decimal = ''] = hbarStr.split('.');
      const paddedDecimal = decimal.padEnd(18, '0').slice(0, 18);
      return BigInt(whole + paddedDecimal).toString();
    };

    const coverageAtto = hbarToAtto(coverage);
    const premiumAtto = hbarToAtto(premium);

    const result = await db.query(
      `INSERT INTO policies (policy_address, policyholder, coverage, premium, threshold, gauge_station_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (policy_address) 
       DO UPDATE SET 
         coverage = EXCLUDED.coverage,
         premium = EXCLUDED.premium,
         threshold = EXCLUDED.threshold,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [policyAddress, policyholder, coverageAtto, premiumAtto, threshold, gaugeStationId]
    );

    const policy = result.rows[0];
    console.log('✅ Policy saved:', policy.policy_address);

    res.status(201).json({
      success: true,
      policy: {
        ...policy,
        coverage: policy.coverage,
        premium: policy.premium
      }
    });
  } catch (error) {
    console.error('❌ Error saving policy:', error);
    res.status(500).json({ 
      error: 'Failed to save policy',
      message: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM policies ORDER BY created_at DESC'
    );

    // Convert atto-HBAR back to HBAR for display
    const attoToHbar = (atto) => {
      if (!atto) return 0;
      const attoStr = String(atto);
      const whole = attoStr.slice(0, -18) || '0';
      const decimal = attoStr.slice(-18).padStart(18, '0');
      // Trim trailing zeros for cleaner display
      const trimmedDecimal = decimal.replace(/0+$/, '').slice(0, 4);
      return parseFloat(whole + (trimmedDecimal ? '.' + trimmedDecimal : ''));
    };

    const policies = result.rows.map(policy => ({
      id: policy.id,
      policyAddress: policy.policy_address,
      policyholder: policy.policyholder,
      coverage: attoToHbar(policy.coverage),
      premium: attoToHbar(policy.premium),
      threshold: policy.threshold,
      gaugeStationId: policy.gauge_station_id,
      active: policy.active,
      payoutTriggered: policy.claimed,
      createdAt: policy.created_at,
      updatedAt: policy.updated_at
    }));

    res.json({ 
      success: true, 
      policies,
      count: policies.length
    });
  } catch (error) {
    console.error('❌ Error fetching policies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch policies',
      message: error.message 
    });
  }
});

router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const result = await db.query(
      'SELECT * FROM policies WHERE policy_address = $1',
      [address]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Policy not found' 
      });
    }

    // Convert atto-HBAR back to HBAR for display
    const attoToHbar = (atto) => {
      if (!atto) return 0;
      const attoStr = String(atto);
      const whole = attoStr.slice(0, -18) || '0';
      const decimal = attoStr.slice(-18).padStart(18, '0');
      const trimmedDecimal = decimal.replace(/0+$/, '').slice(0, 4);
      return parseFloat(whole + (trimmedDecimal ? '.' + trimmedDecimal : ''));
    };

    const policy = result.rows[0];
    res.json({
      success: true,
      policy: {
        id: policy.id,
        policyAddress: policy.policy_address,
        policyholder: policy.policyholder,
        coverage: attoToHbar(policy.coverage),
        premium: attoToHbar(policy.premium),
        threshold: policy.threshold,
        gaugeStationId: policy.gauge_station_id,
        active: policy.active,
        payoutTriggered: policy.claimed,
        createdAt: policy.created_at,
        updatedAt: policy.updated_at
      }
    });
  } catch (error) {
    console.error('❌ Error fetching policy:', error);
    res.status(500).json({ 
      error: 'Failed to fetch policy',
      message: error.message 
    });
  }
});

module.exports = router;
