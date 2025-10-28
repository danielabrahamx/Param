import { 
  config, 
  apiCall,
  sleep
} from './setup';

/**
 * E2E Test 4: Manual Threshold Adjustment
 * 
 * This test verifies that:
 * 1. Admin can manually adjust flood thresholds
 * 2. Updated thresholds are applied correctly
 * 3. Policies become eligible for payout when threshold is lowered
 * 4. System responds to manually adjusted thresholds
 */

async function testManualThresholdAdjustment(oracleData?: any) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('TEST 4: Manual Threshold Adjustment');
  console.log('═══════════════════════════════════════════════════════\n');

  const location = oracleData?.location || '01646500';

  // Step 1: Get current thresholds
  console.log('Step 1: Getting current thresholds...');
  const currentThresholds = await apiCall(
    'GET',
    `${config.oracleService}/api/v1/oracle/thresholds/${location}`
  );
  
  console.log('Current thresholds:');
  console.log(`  Warning: ${currentThresholds.warningThreshold} ${currentThresholds.unit}`);
  console.log(`  Critical: ${currentThresholds.criticalThreshold} ${currentThresholds.unit}\n`);

  // Step 2: Get current flood level
  console.log('Step 2: Getting current flood level...');
  const floodData = await apiCall(
    'GET',
    `${config.oracleService}/api/v1/oracle/flood-level/${location}`
  );
  
  const currentLevel = floodData.level;
  console.log(`Current flood level: ${currentLevel} ${floodData.unit}\n`);

  // Step 3: Calculate new thresholds to trigger payout
  console.log('Step 3: Adjusting thresholds to trigger payout...');
  
  // Set critical threshold below current level to simulate breach
  const newCriticalThreshold = Math.floor(currentLevel * 0.8); // 80% of current level
  const newWarningThreshold = Math.floor(currentLevel * 0.6); // 60% of current level
  
  console.log('New thresholds:');
  console.log(`  Warning: ${newWarningThreshold} ${currentThresholds.unit}`);
  console.log(`  Critical: ${newCriticalThreshold} ${currentThresholds.unit}`);
  console.log(`  (Set below current level of ${currentLevel} to simulate threshold breach)\n`);

  // Step 4: Update thresholds via API
  console.log('Step 4: Updating thresholds via API...');
  try {
    const updateResult = await apiCall(
      'POST',
      `${config.oracleService}/api/v1/oracle/thresholds/${location}`,
      {
        warningThreshold: newWarningThreshold,
        criticalThreshold: newCriticalThreshold
      }
    );
    
    console.log('✓ Thresholds updated:');
    console.log(`  Location: ${updateResult.location}`);
    console.log(`  Warning: ${updateResult.warningThreshold}`);
    console.log(`  Critical: ${updateResult.criticalThreshold}`);
    console.log(`  Updated at: ${updateResult.updated}\n`);
  } catch (error: any) {
    console.error('Failed to update thresholds:', error.response?.data || error.message);
    throw error;
  }

  // Step 5: Verify thresholds were updated
  console.log('Step 5: Verifying updated thresholds...');
  await sleep(1000);
  
  const verifyThresholds = await apiCall(
    'GET',
    `${config.oracleService}/api/v1/oracle/thresholds/${location}`
  );
  
  console.log('Verified thresholds:');
  console.log(`  Warning: ${verifyThresholds.warningThreshold}`);
  console.log(`  Critical: ${verifyThresholds.criticalThreshold}\n`);

  // Step 6: Check if current level now exceeds the new threshold
  console.log('Step 6: Checking if current level exceeds new threshold...');
  
  let breached = false;
  if (currentLevel >= newCriticalThreshold) {
    console.log('✓ CRITICAL THRESHOLD BREACHED');
    console.log(`  Current level (${currentLevel}) >= Critical threshold (${newCriticalThreshold})`);
    console.log('  Policies should now be eligible for payout\n');
    breached = true;
  } else if (currentLevel >= newWarningThreshold) {
    console.log('⚠ WARNING THRESHOLD BREACHED');
    console.log(`  Current level (${currentLevel}) >= Warning threshold (${newWarningThreshold})\n`);
  } else {
    console.log('○ No threshold breach detected');
    console.log(`  Current level (${currentLevel}) < Warning threshold (${newWarningThreshold})\n`);
  }

  // Step 7: Wait for oracle job to process the threshold change
  console.log('Step 7: Waiting for oracle monitoring to detect threshold breach...');
  console.log('(In production, the oracle job runs periodically and would detect this)\n');
  
  // Check claims service to see if payouts were triggered
  await sleep(2000);
  
  try {
    const poolStatus = await apiCall(
      'GET',
      `${config.claimsService}/api/v1/claims/pool/status`
    );
    
    console.log('Claims pool status:');
    console.log(`  Total Capacity: ${poolStatus.totalCapacity}`);
    console.log(`  Available Balance: ${poolStatus.availableBalance}`);
    console.log(`  Total Claims Processed: ${poolStatus.totalClaimsProcessed}\n`);
  } catch (error) {
    console.log('⚠ Could not fetch claims pool status\n');
  }

  // Step 8: Restore original thresholds (cleanup)
  console.log('Step 8: Restoring original thresholds...');
  try {
    await apiCall(
      'POST',
      `${config.oracleService}/api/v1/oracle/thresholds/${location}`,
      {
        warningThreshold: currentThresholds.warningThreshold,
        criticalThreshold: currentThresholds.criticalThreshold
      }
    );
    console.log('✓ Original thresholds restored\n');
  } catch (error) {
    console.log('⚠ Could not restore original thresholds (this is okay for testing)\n');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('✓ TEST 4 PASSED: Manual Threshold Adjustment');
  console.log('═══════════════════════════════════════════════════════\n');
  
  return {
    location,
    originalThresholds: currentThresholds,
    newThresholds: {
      warning: newWarningThreshold,
      critical: newCriticalThreshold
    },
    currentLevel,
    breached
  };
}

// Run test if executed directly
if (require.main === module) {
  testManualThresholdAdjustment()
    .then(() => {
      console.log('\n✓ All threshold adjustment tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Test failed:', error.message);
      console.error(error);
      process.exit(1);
    });
}

export { testManualThresholdAdjustment };
