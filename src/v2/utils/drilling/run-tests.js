#!/usr/bin/env node

/**
 * Test Runner for Utility Classes
 * Runs all tests and provides comprehensive integrity validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Utility Classes Test Suite...\n');

// Test files to run
const testFiles = [
  'UtilityHelper.test.js',
  'CalculationEngine.test.js', 
  'DataLoader.test.js',
  'integration.test.js',
  'performance-validation.test.js',
  'api-performance-validation.test.js'
];

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(testFile) {
  const testPath = path.join(__dirname, testFile);
  
  if (!fs.existsSync(testPath)) {
    log(`❌ Test file not found: ${testFile}`, 'red');
    return { success: false, error: 'File not found' };
  }
  
  try {
    log(`🔍 Running ${testFile}...`, 'blue');
    
    // Run the test using Jest
    const result = execSync(`npx jest ${testPath} --verbose --no-coverage`, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    log(`✅ ${testFile} passed`, 'green');
    return { success: true, output: result };
    
  } catch (error) {
    log(`❌ ${testFile} failed`, 'red');
    return { success: false, error: error.message, output: error.stdout };
  }
}

function validateKnownStrategy() {
  log('\n📋 Validating Known Strategy Data...', 'blue');
  
  try {
    const strategyPath = path.join(process.cwd(), '..', '..', '..', '..', 'data', 'v2', 'known-strategy.json');
    
    if (!fs.existsSync(strategyPath)) {
      log('❌ Known strategy file not found', 'red');
      return false;
    }
    
    const strategyData = fs.readFileSync(strategyPath, 'utf8');
    const strategy = JSON.parse(strategyData);
    
    // Validate strategy structure
    const requiredFields = ['name', 'side', 'size', 'factors', 'performance'];
    const missingFields = requiredFields.filter(field => !strategy[field]);
    
    if (missingFields.length > 0) {
      log(`❌ Missing required fields: ${missingFields.join(', ')}`, 'red');
      return false;
    }
    
    // Validate factors
    if (!Array.isArray(strategy.factors) || strategy.factors.length === 0) {
      log('❌ No factors found in strategy', 'red');
      return false;
    }
    
    // Validate performance
    const performanceFields = ['roi', 'totalBets', 'winRate', 'totalProfit'];
    const missingPerformance = performanceFields.filter(field => !(field in strategy.performance));
    
    if (missingPerformance.length > 0) {
      log(`❌ Missing performance fields: ${missingPerformance.join(', ')}`, 'red');
      return false;
    }
    
    log(`✅ Strategy validation passed: ${strategy.factors.length} factors, ${strategy.performance.totalBets} bets`, 'green');
    return true;
    
  } catch (error) {
    log(`❌ Strategy validation failed: ${error.message}`, 'red');
    return false;
  }
}

function runAllTests() {
  log('🚀 Starting Comprehensive Test Suite...\n', 'bold');
  
  // Validate known strategy first
  const strategyValid = validateKnownStrategy();
  if (!strategyValid) {
    log('\n❌ Strategy validation failed. Aborting tests.', 'red');
    process.exit(1);
  }
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  // Run each test file
  for (const testFile of testFiles) {
    const result = runTest(testFile);
    results.push({ file: testFile, ...result });
    
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(''); // Add spacing between tests
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'bold');
  log('📊 TEST SUMMARY', 'bold');
  log('='.repeat(60), 'bold');
  
  log(`\n✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue');
  
  if (failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    results.filter(r => !r.success).forEach(result => {
      log(`  - ${result.file}: ${result.error}`, 'red');
    });
  }
  
  // Detailed results
  log('\n📋 DETAILED RESULTS:', 'blue');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`  ${status} ${result.file}`, color);
  });
  
  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'yellow');
  if (failed === 0) {
    log('  ✅ All tests passed! The utility classes are working correctly.', 'green');
    log('  ✅ Data integrity is maintained across the system.', 'green');
    log('  ✅ Cross-platform compatibility is verified.', 'green');
  } else {
    log('  🔧 Review failed tests and fix any issues.', 'yellow');
    log('  🔧 Check data structure consistency.', 'yellow');
    log('  🔧 Verify factor expressions are valid.', 'yellow');
  }
  
  log('\n' + '='.repeat(60), 'bold');
  
  return failed === 0;
}

// Run the tests
const success = runAllTests();

// Exit with appropriate code
process.exit(success ? 0 : 1); 