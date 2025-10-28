const express = require('express');
const router = express.Router();
const db = require('../db/connection');

const attoToHbar = (atto) => {
  if (!atto) return '0.00';
  const attoBigInt = BigInt(atto);
  const isNegative = attoBigInt < 0n;
  const absValue = isNegative ? -attoBigInt : attoBigInt;
  const hbarBigInt = absValue / BigInt(1e18);
  const remainder = absValue % BigInt(1e18);
  const decimal = Number(remainder) / 1e18;
  const result = Number(hbarBigInt) + decimal;
  return (isNegative ? -result : result).toFixed(2);
};

router.get('/', async (req, res) => {
  try {
    const policiesResult = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(coverage), 0) as total_coverage FROM policies WHERE active = true'
    );

    const claimsResult = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_paid FROM claims WHERE status = $1',
      ['completed']
    );

    const premiumsResult = await db.query(
      'SELECT COALESCE(SUM(premium), 0) as total_premiums FROM policies'
    );

    const totalPolicies = parseInt(policiesResult.rows[0].count);
    const totalCoverage = policiesResult.rows[0].total_coverage;
    const totalClaimsCount = parseInt(claimsResult.rows[0].count);
    const totalPaid = claimsResult.rows[0].total_paid;
    const totalPremiums = premiumsResult.rows[0].total_premiums;

    const poolBalance = BigInt(totalPremiums) - BigInt(totalPaid);

    res.json({
      totalPolicies,
      activePolicies: totalPolicies,
      totalCoverage: attoToHbar(totalCoverage),
      totalClaims: totalClaimsCount,
      claimsPaid: attoToHbar(totalPaid),
      poolBalance: attoToHbar(poolBalance.toString()),
      totalPremiums: attoToHbar(totalPremiums),
      systemStatus: 'Operational'
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      message: error.message 
    });
  }
});

module.exports = router;
