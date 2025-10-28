const express = require('express');
const router = express.Router();
const db = require('../db/connection');

async function fetchUSGSFloodData(stationId) {
  try {
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${stationId}&parameterCd=00065&siteStatus=all`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USGS API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.value || !data.value.timeSeries || data.value.timeSeries.length === 0) {
      throw new Error('No data available from USGS for this station');
    }
    
    const timeSeries = data.value.timeSeries[0];
    const siteInfo = timeSeries.sourceInfo;
    const values = timeSeries.values[0].value;
    
    if (!values || values.length === 0) {
      throw new Error('No current readings available');
    }
    
    const latestReading = values[values.length - 1];
    const gageHeightFeet = parseFloat(latestReading.value);
    const timestamp = latestReading.dateTime;
    
    const gageHeightScaled = Math.round(gageHeightFeet * 100);
    
    return {
      siteName: siteInfo.siteName,
      siteCode: siteInfo.siteCode[0].value,
      gageHeight: gageHeightScaled,
      timestamp: timestamp,
      rawValue: gageHeightFeet
    };
  } catch (error) {
    console.error('❌ Error fetching USGS data:', error.message);
    throw error;
  }
}

router.get('/flood-level/:gaugeId?', async (req, res) => {
  try {
    const gaugeId = req.params.gaugeId || '01646500';
    const stationId = gaugeId === '1' ? '01646500' : gaugeId;
    
    let floodLevel;
    let timestamp;
    let dataSourceStatus = 'LIVE';
    
    try {
      console.log(`📡 Fetching real-time data from USGS for station ${stationId}...`);
      const usgsData = await fetchUSGSFloodData(stationId);
      floodLevel = usgsData.gageHeight;
      timestamp = usgsData.timestamp;
      console.log(`✅ USGS data received: ${usgsData.rawValue} feet (${floodLevel} in scaled units)`);
    } catch (usgsError) {
      console.warn(`⚠️ Failed to fetch USGS data, falling back to database: ${usgsError.message}`);
      
      const result = await db.query(
        "SELECT value FROM oracle_config WHERE key = 'current_flood_level'"
      );
      floodLevel = result.rows.length > 0 ? parseInt(result.rows[0].value) : null;
      timestamp = new Date().toISOString();
      dataSourceStatus = 'FALLBACK';
    }

    const thresholdResult = await db.query(
      "SELECT value FROM oracle_config WHERE key = 'flood_threshold'"
    );
    const threshold = thresholdResult.rows.length > 0 
      ? parseInt(thresholdResult.rows[0].value) 
      : 1500;

    const unitResult = await db.query(
      "SELECT value FROM oracle_config WHERE key = 'measurement_unit'"
    );
    const unit = unitResult.rows.length > 0 
      ? unitResult.rows[0].value 
      : 'feet x 100';

    res.json({
      location: stationId,
      level: floodLevel,
      timestamp: timestamp,
      dataSource: `USGS ${dataSourceStatus === 'LIVE' ? '(Real-time)' : '(Cached)'}`,
      station: 'POTOMAC RIVER NEAR WASHINGTON, DC',
      stationId: stationId,
      usgsLink: `https://waterdata.usgs.gov/monitoring-location/${stationId}`,
      updateFrequency: '15 minutes',
      unit: unit,
      threshold: threshold,
      status: floodLevel && floodLevel >= threshold ? 'FLOOD' : 'NORMAL'
    });
  } catch (error) {
    console.error('❌ Error in oracle endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch flood level',
      message: error.message 
    });
  }
});

module.exports = router;
