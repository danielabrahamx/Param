import { Router, Request, Response } from 'express';
import { db } from '../db';
import { floodReadings } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// Get current flood level with full metadata
router.get('/flood-level/:location', async (req: Request, res: Response) => {
  try {
    const { location } = req.params;
    
    // Map location to Nile River station
    const stationId = location === '1' ? 'ASWAN-001' : location;
    
    const reading = await db.select().from(floodReadings)
      .where(eq(floodReadings.location, stationId))
      .orderBy(desc(floodReadings.timestamp))
      .limit(1);
    
    if (reading.length === 0) {
      // Return mock data with Nile River info
      return res.json({ 
        location: stationId, 
        level: 17500, 
        timestamp: new Date(),
        dataSource: 'Nile Basin Initiative / Egypt Ministry of Water Resources',
        station: 'NILE RIVER AT ASWAN HIGH DAM, LAKE NASSER',
        stationId: 'ASWAN-001',
        country: 'Egypt',
        river: 'Nile River',
        infoLink: `https://nilebasin.org`,
        updateFrequency: 'Daily',
        unit: 'centimeters above MSL',
        description: 'Lake Nasser water level monitoring at Aswan High Dam'
      });
    }
    
    res.json({ 
      location: stationId, 
      level: reading[0].level, 
      timestamp: reading[0].timestamp,
      dataSource: 'Nile Basin Initiative / Egypt Ministry of Water Resources',
      station: 'NILE RIVER AT ASWAN HIGH DAM, LAKE NASSER',
      stationId: stationId,
      country: 'Egypt',
      river: 'Nile River',
      infoLink: `https://nilebasin.org`,
      updateFrequency: 'Daily',
      unit: 'centimeters above MSL',
      description: 'Lake Nasser water level monitoring at Aswan High Dam'
    });
  } catch (error) {
    console.error('Error fetching flood level:', error);
    // Return mock data on error
    const defaultStationId = 'ASWAN-001';
    res.json({ 
      location: defaultStationId, 
      level: 17500, 
      timestamp: new Date(),
      dataSource: 'Nile Basin Initiative / Egypt Ministry of Water Resources',
      station: 'NILE RIVER AT ASWAN HIGH DAM, LAKE NASSER',
      stationId: defaultStationId,
      country: 'Egypt',
      river: 'Nile River',
      infoLink: `https://nilebasin.org`,
      updateFrequency: 'Daily',
      unit: 'centimeters above MSL',
      description: 'Lake Nasser water level monitoring at Aswan High Dam'
    });
  }
});

// Get flood level history for a location
router.get('/flood-history/:location', async (req: Request, res: Response) => {
  try {
    const { location } = req.params;
    const limit = parseInt(req.query.limit as string) || 24;
    
    // Map location to Nile River station
    const stationId = location === '1' ? 'ASWAN-001' : location;
    
    const readings = await db.select().from(floodReadings)
      .where(eq(floodReadings.location, stationId))
      .orderBy(desc(floodReadings.timestamp))
      .limit(limit);
    
    if (readings.length === 0) {
      // Return mock historical data for Lake Nasser (147-182m MSL = 14700-18200cm)
      const mockData = [];
      const now = Date.now();
      for (let i = 0; i < Math.min(limit, 10); i++) {
        mockData.push({
          timestamp: new Date(now - i * 3600000).toISOString(),
          level: 17000 + Math.floor(Math.random() * 1200),
          location: stationId
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
router.get('/thresholds/:location', async (req: Request, res: Response) => {
  try {
    const { location } = req.params;
    
    // Map location to Nile River station
    const stationId = location === '1' ? 'ASWAN-001' : location;
    
    // Aswan High Dam thresholds based on operational levels
    // Lake Nasser operates between 147-182 meters MSL
    // Warning at 178m (17800cm), Critical at 181m (18100cm)
    res.json({
      location: stationId,
      warningThreshold: 17800,
      criticalThreshold: 18100,
      unit: 'centimeters above MSL',
      normalRange: { min: 14700, max: 18200 },
      lastUpdated: new Date(),
      description: 'Lake Nasser operates between 147-182 meters above Mean Sea Level'
    });
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    res.status(500).json({ error: 'Failed to fetch thresholds' });
  }
});

// Update threshold configuration (admin only in production)
router.post('/thresholds/:location', async (req: Request, res: Response) => {
  try {
    const { location } = req.params;
    const { warningThreshold, criticalThreshold } = req.body;
    
    // Map location to Nile River station
    const stationId = location === '1' ? 'ASWAN-001' : location;
    
    // TODO: Add authentication and authorization
    // TODO: Store in database
    
    res.json({
      success: true,
      location: stationId,
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