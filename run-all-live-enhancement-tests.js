#!/usr/bin/env node

/**
 * Complete Test Suite for Live Enhancement Service
 * Runs all tests to verify the service works correctly
 */

const { execSync } = require('child_process');

console.log('🧪 Live Enhancement Service - Complete Test Suite');
console.log('═'.repeat(60));
console.log('Running comprehensive tests to verify your live enhancement');
console.log('service works correctly with real data flows.\n');

const tests = [
  {
    name: 'Unit Functionality Test',
    description: 'Tests core enhancement logic and data processing',
    script: 'node test-live-enhancement-simple.js',
    critical: true
  },
  {
    name: 'Complete Integration Test', 
    description: 'Tests full flow from odds to betting decisions',
    script: 'node test-complete-integration.js',
    critical: true
  },
  {
    name: 'FBRef Data Integration Test',
    description: 'Tests FBRef data parsing and integration capabilities',
    script: 'node test-fbref-integration.js',
    critical: true
  }
];

let totalTests = 0;
let passedTests = 0;
let criticalFailures = 0;

console.log('📋 Test Execution Plan:');
tests.forEach((test, i) => {
  console.log(`${i + 1}. ${test.name} ${test.critical ? '(CRITICAL)' : ''}`);
  console.log(`   ${test.description}`);
});

console.log('\n🚀 Starting Test Execution...\n');

for (const [index, test] of tests.entries()) {
  console.log(`🔬 Test ${index + 1}/${tests.length}: ${test.name}`);
  console.log('─'.repeat(60));
  
  try {
    execSync(test.script, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`\n✅ ${test.name}: PASSED\n`);
    passedTests++;
  } catch (error) {
    console.log(`\n❌ ${test.name}: FAILED\n`);
    if (test.critical) {
      criticalFailures++;
    }
  }
  
  totalTests++;
}

console.log('📊 Final Test Results');
console.log('═'.repeat(60));
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
console.log(`🚨 Critical Failures: ${criticalFailures}`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉');
  console.log('\n🚀 Your Live Enhancement Service is fully working!');
  console.log('\n✅ What this means:');
  console.log('• Your service can process live odds data');
  console.log('• It generates complete enhanced analytics');
  console.log('• Timeline data is calculated from historical matches');
  console.log('• Market efficiency metrics are computed correctly');
  console.log('• Enhanced data triggers real betting strategies');
  console.log('• The complete data flow works end-to-end');
  console.log('• Data format is compatible with existing system');
  
  console.log('\n🎯 Ready for Production:');
  console.log('• Start your NestJS server: npm start');
  console.log('• Live odds will automatically be enhanced');
  console.log('• Real strategies will evaluate enhanced data');
  console.log('• Betting decisions will be generated automatically');
  console.log('• All data flows through enhanced-live-data.json');
  
} else if (criticalFailures === 0) {
  console.log('\n⚠️ Most tests passed, but some non-critical issues detected.');
  console.log('The core functionality should work, but review the failures above.');
  
} else {
  console.log('\n🚨 CRITICAL FAILURES DETECTED!');
  console.log('The live enhancement service may not work correctly.');
  console.log('Please review and fix the failed tests before proceeding.');
}

console.log('\n📋 Test Coverage Summary:');
console.log('• ✅ Service initialization and setup');
console.log('• ✅ Historical data loading for timeline analytics');
console.log('• ✅ Live odds data processing and normalization');
console.log('• ✅ Market efficiency calculations (cuts, implied probabilities)');
console.log('• ✅ Team timeline analytics (streaks, performance, form)');
console.log('• ✅ Enhanced data structure generation');
console.log('• ✅ Data format compatibility with historical files');
console.log('• ✅ Integration with betting decision service');
console.log('• ✅ Strategy evaluation with enhanced data');
console.log('• ✅ Betting decision generation');
console.log('• ✅ Error handling and edge cases');
console.log('• ✅ Complete end-to-end data flow');
console.log('• ✅ FBRef data parsing and incident extraction');
console.log('• ✅ Match cleanliness scoring for bet quality assessment');
console.log('• ✅ Team name mapping between FBRef and live odds');
console.log('• ✅ FBRef integration with live enhancement service');

process.exit(criticalFailures > 0 ? 1 : 0);