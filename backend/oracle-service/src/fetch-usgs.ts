import axios from 'axios';
import { db } from './db';
import { floodReadings } from './db/schema';
import dotenv from 'dotenv';

dotenv.config();

async function fetchUSGSData() {
  console.log('🌊 Fetching current USGS Potomac River data...\n');

  const site = '01646500'; // Potomac River at Little Falls
  
  try {
    const url = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site}&parameterCd=00065`;
    console.log(`📡 Requesting: ${url}\n`);
    
    const response = await axios.get(url);
    const timeSeries = response.data.value.timeSeries[0];
    const latestValue = timeSeries.values[0].value[0];
    
    const feetValue = parseFloat(latestValue.value);
    const level = Math.floor(feetValue * 100); // Store as feet x 100
    const timestamp = new Date(latestValue.dateTime);
    
    console.log('📊 USGS Data Retrieved:');
    console.log(`   Site: ${site}`);
    console.log(`   Site Name: ${timeSeries.sourceInfo.siteName}`);
    console.log(`   Gage Height: ${feetValue} feet`);
    console.log(`   Stored Value: ${level} (feet x 100)`);
    console.log(`   Timestamp: ${timestamp.toLocaleString()}\n`);
    
    // Store in database
    await db.insert(floodReadings).values({
      location: site,
      level,
    });
    
    console.log('✅ Data stored successfully in database!');
    
  } catch (error) {
    console.error('❌ Error fetching USGS data:', error);
    throw error;
  }
}

fetchUSGSData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
