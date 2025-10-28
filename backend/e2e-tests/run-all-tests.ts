#!/usr/bin/env node

/**
 * E2E Test Suite Runner
 * 
 * This script runs all end-to-end tests for the Param insurance system.
 * It tests the complete workflow:
 * 1. Admin funds the insurance pool
 * 2. User purchases an insurance policy
 * 3. Oracle monitors flood levels and detects threshold breach
 * 4. Admin can manually adjust thresholds
 * 5. User claims payout after threshold breach
 */

import dotenv from 'dotenv';
import path from 'path';
import { waitForServices } from './setup';
import { testAdminPoolFunding } from './test-1-pool-funding';
import { testUserPolicyPurchase } from './test-2-policy-purchase';
import { testThresholdBreach } from './test-3-threshold-breach';
import { testManualThresholdAdjustment } from './test-4-manual-threshold';
import { testUserClaimPayout } from './test-5-claim-payout';

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║        PARAM INSURANCE E2E TEST SUITE                ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('\n');

  const startTime = Date.now();
  let passedTests = 0;
  let failedTests = 0;
  const testResults: any[] = [];

  try {
    // Verify required environment variables
    console.log('Checking environment configuration...');
    const requiredEnvVars = [
      'RPC_URL',
      'POOL_ADDRESS',
      'POLICY_FACTORY_ADDRESS',
      'PRIVATE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    console.log('✓ Environment configured\n');

    // Wait for backend services to be ready
    await waitForServices();

    // Test 1: Admin Pool Funding
    console.log('Running Test 1 of 5...\n');
    try {
      const poolData = await testAdminPoolFunding();
      testResults.push({ test: 'Pool Funding', status: 'PASSED', data: poolData });
      passedTests++;
    } catch (error: any) {
      console.error('✗ Test 1 FAILED:', error.message);
      testResults.push({ test: 'Pool Funding', status: 'FAILED', error: error.message });
      failedTests++;
    }

    // Test 2: User Policy Purchase
    console.log('Running Test 2 of 5...\n');
    let policyData;
    try {
      policyData = await testUserPolicyPurchase();
      testResults.push({ test: 'Policy Purchase', status: 'PASSED', data: policyData });
      passedTests++;
    } catch (error: any) {
      console.error('✗ Test 2 FAILED:', error.message);
      testResults.push({ test: 'Policy Purchase', status: 'FAILED', error: error.message });
      failedTests++;
    }

    // Test 3: Oracle Threshold Breach Detection
    console.log('Running Test 3 of 5...\n');
    let oracleData;
    try {
      oracleData = await testThresholdBreach(policyData);
      testResults.push({ test: 'Threshold Breach', status: 'PASSED', data: oracleData });
      passedTests++;
    } catch (error: any) {
      console.error('✗ Test 3 FAILED:', error.message);
      testResults.push({ test: 'Threshold Breach', status: 'FAILED', error: error.message });
      failedTests++;
    }

    // Test 4: Manual Threshold Adjustment
    console.log('Running Test 4 of 5...\n');
    let thresholdData;
    try {
      thresholdData = await testManualThresholdAdjustment(oracleData);
      testResults.push({ test: 'Manual Threshold', status: 'PASSED', data: thresholdData });
      passedTests++;
    } catch (error: any) {
      console.error('✗ Test 4 FAILED:', error.message);
      testResults.push({ test: 'Manual Threshold', status: 'FAILED', error: error.message });
      failedTests++;
    }

    // Test 5: User Claim Payout
    console.log('Running Test 5 of 5...\n');
    try {
      const claimData = await testUserClaimPayout(policyData, thresholdData);
      testResults.push({ test: 'Claim Payout', status: 'PASSED', data: claimData });
      passedTests++;
    } catch (error: any) {
      console.error('✗ Test 5 FAILED:', error.message);
      testResults.push({ test: 'Claim Payout', status: 'FAILED', error: error.message });
      failedTests++;
    }

  } catch (error: any) {
    console.error('\n✗ Test suite setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }

  // Print summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                   TEST SUMMARY                        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('\n');

  testResults.forEach((result, index) => {
    const status = result.status === 'PASSED' ? '✓' : '✗';
    const statusColor = result.status === 'PASSED' ? '\x1b[32m' : '\x1b[31m';
    console.log(`${statusColor}${status}\x1b[0m Test ${index + 1}: ${result.test} - ${result.status}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log('\n');
  console.log(`Total Tests:  ${passedTests + failedTests}`);
  console.log(`Passed:       \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Failed:       \x1b[31m${failedTests}\x1b[0m`);
  console.log(`Duration:     ${duration}s`);
  console.log('\n');

  if (failedTests === 0) {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║            ✓ ALL TESTS PASSED!                       ║');
    console.log('║                                                       ║');
    console.log('║  The Param insurance system is working correctly!    ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n');
    process.exit(0);
  } else {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║            ✗ SOME TESTS FAILED                       ║');
    console.log('║                                                       ║');
    console.log('║  Please review the errors above.                     ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n');
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch((error) => {
  console.error('\n✗ Unexpected error:', error);
  process.exit(1);
});
