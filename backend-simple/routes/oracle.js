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

router.put('/admin/threshold', async (req, res) => {
  try {
    const { threshold } = req.body;

    if (threshold === undefined || threshold === null) {
      return res.status(400).json({ 
        error: 'Missing required field: threshold' 
      });
    }

    const thresholdInt = parseInt(threshold);
    if (isNaN(thresholdInt) || thresholdInt < 0) {
      return res.status(400).json({ 
        error: 'Threshold must be a positive number' 
      });
    }

    await db.query(
      `INSERT INTO oracle_config (key, value, updated_at)
       VALUES ('flood_threshold', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) 
       DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
      [thresholdInt.toString()]
    );

    console.log('✅ Threshold updated to:', thresholdInt);

    res.json({
      success: true,
      threshold: thresholdInt,
      message: 'Threshold updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating threshold:', error);
    res.status(500).json({ 
      error: 'Failed to update threshold',
      message: error.message 
    });
  }
});

router.put('/admin/flood-level', async (req, res) => {
  try {
    const { level } = req.body;

    if (level === undefined || level === null) {
      return res.status(400).json({ 
        error: 'Missing required field: level' 
      });
    }

    const levelInt = parseInt(level);
    if (isNaN(levelInt) || levelInt < 0) {
      return res.status(400).json({ 
        error: 'Flood level must be a positive number' 
      });
    }

    await db.query(
      `INSERT INTO oracle_config (key, value, updated_at)
       VALUES ('current_flood_level', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) 
       DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP`,
      [levelInt.toString()]
    );

    const thresholdResult = await db.query(
      "SELECT value FROM oracle_config WHERE key = 'flood_threshold'"
    );

    const threshold = thresholdResult.rows.length > 0 
      ? parseInt(thresholdResult.rows[0].value) 
      : 10;

    console.log('✅ Flood level updated to:', levelInt);

    res.json({
      success: true,
      level: levelInt,
      threshold: threshold,
      status: levelInt >= threshold ? 'FLOOD' : 'NORMAL',
      message: 'Flood level updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating flood level:', error);
    res.status(500).json({ 
      error: 'Failed to update flood level',
      message: error.message 
    });
  }
});

router.get('/admin/threshold', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT value FROM oracle_config WHERE key = 'flood_threshold'"
    );

    const threshold = result.rows.length > 0 
      ? parseInt(result.rows[0].value) 
      : 10;

    res.json({
      success: true,
      threshold: threshold
    });
  } catch (error) {
    console.error('❌ Error fetching threshold:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threshold',
      message: error.message 
    });
  }
});

module.exports = router;
