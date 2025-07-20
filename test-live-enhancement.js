#!/usr/bin/env node

/**
 * Test runner for Live Enhancement Service
 * This script runs the tests and provides a summary of results
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Live Enhancement Service Tests...\n');

const testFiles = [
  'src/v2/tests/unit/live-enhancement.service.spec.ts',
  'src/v2/tests/integration/live-enhancement-integration.spec.ts'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const testFile of testFiles) {
  console.log(`📋 Running: ${testFile}`);
  console.log('─'.repeat(60));
  
  try {
    const result = execSync(`npx jest ${testFile} --verbose --no-cache`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Tests passed!\n');
    
  } catch (error) {
    console.log('❌ Some tests failed!\n');
    failedTests++;
  }
}

console.log('📊 Test Summary');
console.log('═'.repeat(40));

if (failedTests === 0) {
  console.log('🎉 All Live Enhancement Service tests passed!');
  console.log('✅ Unit tests: PASSED');
  console.log('✅ Integration tests: PASSED');
  console.log('\n🚀 Your live enhancement service is working correctly!');
} else {
  console.log('⚠️  Some tests failed. Please check the output above.');
  console.log(`❌ Failed test files: ${failedTests}`);
}

console.log('\n📝 What was tested:');
console.log('• Historical data loading and processing');
console.log('• Live odds enhancement with complete analytics');
console.log('• Market efficiency calculations');
console.log('• Timeline analytics from historical data');
console.log('• Data format compatibility with existing system');
console.log('• Error handling and edge cases');
console.log('• Performance with large datasets');
console.log('• Complete data flow from odds to betting decisions');
console.log('• Integration with betting decision service');

process.exit(failedTests > 0 ? 1 : 0);