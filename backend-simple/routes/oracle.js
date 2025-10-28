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
      : null;

    const thresholdResult = await db.query(
      "SELECT value FROM oracle_config WHERE key = 'flood_threshold'"
    );

    const threshold = thresholdResult.rows.length > 0 
      ? parseInt(thresholdResult.rows[0].value) 
      : 1500;

    const gaugeId = req.params.gaugeId || '01646500';

    res.json({
      location: gaugeId,
      level: floodLevel,
      timestamp: new Date().toISOString(),
      dataSource: 'USGS Water Services',
      station: 'POTOMAC RIVER NEAR WASH, DC LITTLE FALLS PUMP STA',
      stationId: gaugeId,
      usgsLink: `https://waterdata.usgs.gov/monitoring-location/${gaugeId}`,
      updateFrequency: '15-60 minutes',
      unit: 'feet x 100',
      threshold: threshold,
      status: floodLevel && floodLevel >= threshold ? 'FLOOD' : 'NORMAL'
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
