const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/flood-level/:gaugeId?', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT value FROM oracle_config WHERE key = 'current_flood_level'"
    );

    const floodLevel = result.rows.length > 0 
      ? parseInt(result.rows[0].value) 
      : 5;

    const thresholdResult = await db.query(
      "SELECT value FROM oracle_config WHERE key = 'flood_threshold'"
    );

    const threshold = thresholdResult.rows.length > 0 
      ? parseInt(thresholdResult.rows[0].value) 
      : 10;

    res.json({
      success: true,
      data: {
        currentLevel: floodLevel,
        threshold: threshold,
        status: floodLevel >= threshold ? 'FLOOD' : 'NORMAL',
        lastUpdated: new Date().toISOString(),
        gaugeId: req.params.gaugeId || 'default'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching flood level:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flood level',
      message: error.message 
    });
  }
});

module.exports = router;
