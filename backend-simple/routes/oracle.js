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
      : 18100;  // Lake Nasser critical threshold: 181m = 18100cm

    const gaugeId = req.params.gaugeId || 'ASWAN-001';
    const stationId = gaugeId === '1' ? 'ASWAN-001' : gaugeId;

    res.json({
      location: stationId,
      level: floodLevel,
      timestamp: new Date().toISOString(),
      dataSource: 'Nile Basin Initiative / Egypt Ministry of Water Resources',
      station: 'NILE RIVER AT ASWAN HIGH DAM, LAKE NASSER',
      stationId: stationId,
      country: 'Egypt',
      river: 'Nile River',
      infoLink: 'https://nilebasin.org',
      updateFrequency: 'Daily',
      unit: 'centimeters above MSL',
      description: 'Lake Nasser water level monitoring at Aswan High Dam',
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
