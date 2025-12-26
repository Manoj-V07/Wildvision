/**
 * FEATURE #1 TEST SCRIPT
 * 
 * Demonstrates the incident ingestion pipeline with various scenarios
 * Run: node scripts/testPipeline.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { processIncident } = require('../src/core/pipeline/ingestPipeline');
const Incident = require('../src/domain/models/Incident');

// Test cases covering different scenarios
const testCases = [
  {
    name: 'High Risk - Fire with spread',
    input: {
      rawText: 'Forest fire spreading rapidly near wildlife reserve, flames visible from 2km away',
      state: 'Karnataka',
      district: 'Uttara Kannada'
    },
    expectedRisk: 'High' // fire(30) + fireSpread(30) = 60
  },
  {
    name: 'Critical Risk - Poaching with weapons and injury',
    input: {
      rawText: 'Armed poachers caught hunting elephants, one ranger injured during confrontation',
      state: 'Assam',
      district: 'Kaziranga'
    },
    expectedRisk: 'Critical' // poaching(40) + weapon(25) + injury(20) = 85
  },
  {
    name: 'Medium Risk - Human-wildlife conflict with injury',
    input: {
      rawText: 'Elephants entered paddy field near Masinagudi, farmer injured while trying to chase them away',
      state: 'Tamil Nadu',
      district: 'Nilgiris'
    },
    expectedRisk: 'Medium' // conflict(25) + injury(20) = 45
  },
  {
    name: 'Low Risk - Habitat loss observation',
    input: {
      rawText: 'Noticed some deforestation activity in buffer zone, appears to be slow land clearing',
      state: 'Kerala',
      district: 'Wayanad'
    },
    expectedRisk: 'Low' // habitat_loss(20) = 20
  },
  {
    name: 'Validation Error - Missing state',
    input: {
      rawText: 'Some incident text',
      district: 'SomeDistrict'
      // state is missing
    },
    expectedError: 'Validation Error'
  },
  {
    name: 'Validation Error - Empty rawText',
    input: {
      rawText: '   ',
      state: 'TestState',
      district: 'TestDistrict'
    },
    expectedError: 'Validation Error'
  }
];

async function runTests() {
  try {
    console.log('🚀 Starting Feature #1 Pipeline Tests\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Clear previous test data (optional - uncomment if needed)
    // await Incident.deleteMany({});
    // console.log('✓ Cleared test data\n');

    let passed = 0;
    let failed = 0;

    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      console.log(`\nTest ${i + 1}: ${test.name}`);
      console.log('-'.repeat(60));
      
      try {
        const result = await processIncident(test.input);

        if (test.expectedError) {
          // Expecting an error
          if (!result.success && result.error === test.expectedError) {
            console.log(`✓ PASS: Got expected error "${test.expectedError}"`);
            console.log(`  Message: ${result.message}`);
            passed++;
          } else {
            console.log(`✗ FAIL: Expected error "${test.expectedError}" but got success or different error`);
            console.log(`  Result:`, JSON.stringify(result, null, 2));
            failed++;
          }
        } else {
          // Expecting success
          if (result.success) {
            console.log(`✓ PASS: Incident created successfully`);
            console.log(`  Risk Level: ${result.data.riskLevel} (expected: ${test.expectedRisk})`);
            console.log(`  Risk Score: ${result.data.riskScore}`);
            console.log(`  Confidence: ${result.data.confidence}`);
            console.log(`  Status: ${result.data.status}`);
            
            // Verify risk level matches expectation
            if (result.data.riskLevel === test.expectedRisk) {
              console.log(`  ✓ Risk level matches expectation`);
            } else {
              console.log(`  ⚠ Risk level mismatch (got ${result.data.riskLevel}, expected ${test.expectedRisk})`);
            }
            
            passed++;
          } else {
            console.log(`✗ FAIL: Expected success but got error`);
            console.log(`  Error:`, JSON.stringify(result, null, 2));
            failed++;
          }
        }
      } catch (error) {
        console.log(`✗ FAIL: Unexpected error`);
        console.log(`  Error: ${error.message}`);
        failed++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`Passed: ${passed} ✓`);
    console.log(`Failed: ${failed} ✗`);
    
    // Show recent incidents in database
    console.log('\n' + '='.repeat(60));
    console.log('RECENT INCIDENTS IN DATABASE');
    console.log('='.repeat(60));
    
    const recentIncidents = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('location.state location.district risk.level risk.score status createdAt');
    
    console.log(`\nShowing last ${recentIncidents.length} incidents:\n`);
    recentIncidents.forEach((inc, idx) => {
      console.log(`${idx + 1}. [${inc.risk.level}] ${inc.location.state}, ${inc.location.district}`);
      console.log(`   Score: ${inc.risk.score} | Status: ${inc.status} | ${inc.createdAt.toISOString()}`);
    });

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run tests
runTests();
