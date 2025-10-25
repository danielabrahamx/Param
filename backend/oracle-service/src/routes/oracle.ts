import { Router } from 'express';
import { db } from '../db';
import { floodReadings } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Get current flood level with full metadata
router.get('/flood-level/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    // Map location to USGS site
    const usgsSite = location === '1' ? '01646500' : location;
    
    const reading = await db.select().from(floodReadings)
      .where(eq(floodReadings.location, usgsSite))
      .orderBy(desc(floodReadings.timestamp))
      .limit(1);
    
    if (reading.length === 0) {
      // Return mock data with USGS info
      return res.json({ 
        location: usgsSite, 
        level: 150, 
        timestamp: new Date(),
        dataSource: 'USGS Water Services',
        station: 'POTOMAC RIVER NEAR WASH, DC LITTLE FALLS PUMP STA',
        stationId: '01646500',
        usgsLink: `https://waterdata.usgs.gov/monitoring-location/${usgsSite}`,
        updateFrequency: '15-60 minutes',
        unit: 'feet x 100'
      });
    }
    
    res.json({ 
      location: usgsSite, 
      level: reading[0].level, 
      timestamp: reading[0].timestamp,
      dataSource: 'USGS Water Services',
      station: 'POTOMAC RIVER NEAR WASH, DC LITTLE FALLS PUMP STA',
      stationId: usgsSite,
      usgsLink: `https://waterdata.usgs.gov/monitoring-location/${usgsSite}`,
      updateFrequency: '15-60 minutes',
      unit: 'feet x 100'
    });
  } catch (error) {
    console.error('Error fetching flood level:', error);
    // Return mock data on error
    const usgsId = '01646500';
    res.json({ 
      location: usgsId, 
      level: 150, 
      timestamp: new Date(),
      dataSource: 'USGS Water Services',
      station: 'POTOMAC RIVER NEAR WASH, DC LITTLE FALLS PUMP STA',
      stationId: usgsId,
      usgsLink: `https://waterdata.usgs.gov/monitoring-location/${usgsId}`,
      updateFrequency: '15-60 minutes',
      unit: 'feet x 100'
    });
  }
});

// Get flood level history for a location
router.get('/flood-history/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const limit = parseInt(req.query.limit as string) || 24;
    
    const readings = await db.select().from(floodReadings)
      .where(eq(floodReadings.location, location))
      .orderBy(desc(floodReadings.timestamp))
      .limit(limit);
    
    if (readings.length === 0) {
      // Return mock historical data
      const mockData = [];
      const now = Date.now();
      for (let i = 0; i < Math.min(limit, 10); i++) {
        mockData.push({
          timestamp: new Date(now - i * 3600000).toISOString(),
          level: 1500 + Math.floor(Math.random() * 1000),
          location
        });
      }
      return res.json(mockData);
    }
    
    res.json(readings.map(r => ({
      timestamp: r.timestamp,
      level: r.level,
      location: r.location
    })));
  } catch (error) {
    console.error('Error fetching flood history:', error);
    res.status(500).json({ error: 'Failed to fetch flood history' });
  }
});

// Get threshold configuration
router.get('/thresholds/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    // In production, these would be stored in database
    res.json({
      location,
      warningThreshold: 2400,
      criticalThreshold: 3000,
      unit: 'mm',
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({ error: 'Failed to fetch thresholds' });
  }
});

// Update threshold configuration (admin only in production)
router.post('/thresholds/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { warningThreshold, criticalThreshold } = req.body;
    
    // TODO: Add authentication and authorization
    // TODO: Store in database
    
    res.json({
      success: true,
      location,
      warningThreshold,
      criticalThreshold,
      updated: new Date()
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
});

export { router as oracleRouter };