/**
 * Performance Validation Test
 * Validates that our calculation engine produces the same performance metrics
 * as recorded in the known-strategy.json file
 */

const UtilityHelper = require('./UtilityHelper');
const CalculationEngine = require('./CalculationEngine');
const DataLoader = require('./DataLoader');
const fs = require('fs');
const path = require('path');

describe('Performance Validation Tests', () => {
  let knownStrategy;
  let enhancedData;
  let calculationEngine;

  beforeAll(async () => {
    // Load known strategy
    const strategyPath = path.join(process.cwd(), '..', '..', '..', '..', 'data', 'v2', 'known-strategy.json');
    const strategyData = fs.readFileSync(strategyPath, 'utf8');
    knownStrategy = JSON.parse(strategyData);
    
    // Load enhanced historical data
    const dataFiles = [
      'data/enhanced/year-2022-2023-enhanced.json',
      'data/enhanced/year-2023-2024-enhanced.json',
      'data/enhanced/year-2024-2025-enhanced.json'
    ];
    
    const fileReader = (filePath) => {
      const fullPath = path.join(process.cwd(), '..', '..', '..', '..', filePath);
      const data = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(data);
    };
    
    enhancedData = await DataLoader.loadEnhancedData(dataFiles, fileReader);
    calculationEngine = new CalculationEngine();
    
    console.log(`📊 Loaded ${enhancedData.length} matches from historical data`);
    console.log(`🎯 Known strategy: ${knownStrategy.factors.length} factors, expected ${knownStrategy.performance.totalBets} bets`);
  });

  describe('Known Strategy Performance Validation', () => {
    test('should reproduce the exact performance metrics from known-strategy.json', () => {
      // Step 1: Filter matches using the known strategy factors
      const filteredMatches = calculationEngine.getFilteredMatches(enhancedData, knownStrategy.factors);
      
      console.log(`🔍 Found ${filteredMatches.length} matches matching the strategy factors`);
      
      // Step 2: Calculate betting results using the known strategy configuration
      const bettingResults = calculationEngine.calculateBettingResults(
        filteredMatches, 
        knownStrategy.side, 
        knownStrategy.size
      );
      
      console.log(`💰 Calculated Results:`);
      console.log(`   Total Bets: ${bettingResults.summary.totalBets}`);
      console.log(`   Total Stake: $${bettingResults.summary.totalStake.toFixed(2)}`);
      console.log(`   Total Profit: $${bettingResults.summary.totalProfit.toFixed(2)}`);
      console.log(`   ROI: ${bettingResults.summary.roi.toFixed(2)}%`);
      console.log(`   Win Rate: ${bettingResults.summary.winRate.toFixed(2)}%`);
      
      console.log(`📋 Expected Results (from known-strategy.json):`);
      console.log(`   Total Bets: ${knownStrategy.performance.totalBets}`);
      console.log(`   Total Profit: $${knownStrategy.performance.totalProfit.toFixed(2)}`);
      console.log(`   ROI: ${knownStrategy.performance.roi.toFixed(2)}%`);
      console.log(`   Win Rate: ${knownStrategy.performance.winRate.toFixed(2)}%`);
      
      // Step 3: Validate the performance metrics match
      expect(bettingResults.summary.totalBets).toBe(knownStrategy.performance.totalBets);
      expect(bettingResults.summary.totalProfit).toBeCloseTo(knownStrategy.performance.totalProfit, 2);
      expect(bettingResults.summary.roi).toBeCloseTo(knownStrategy.performance.roi, 2);
      expect(bettingResults.summary.winRate).toBeCloseTo(knownStrategy.performance.winRate, 2);
      
      // Additional validation
      expect(bettingResults.summary.totalBets).toBeGreaterThan(0);
      expect(bettingResults.summary.totalStake).toBeGreaterThan(0);
      expect(bettingResults.bettingRecords).toHaveLength(knownStrategy.performance.totalBets);
      
      console.log(`✅ Performance validation passed!`);
    });

    test('should validate individual factor evaluation matches expected behavior', () => {
      const cache = new Map();
      
      // Test each factor individually
      knownStrategy.factors.forEach(factor => {
        console.log(`🔍 Testing factor: ${factor.key} (${factor.category})`);
        
        const matchingMatches = enhancedData.filter(match => {
          return UtilityHelper.evaluateFactorExpression(match, factor.expression, cache);
        });
        
        console.log(`   Found ${matchingMatches.length} matches for factor ${factor.key}`);
        
        // Each factor should find some matches
        expect(matchingMatches.length).toBeGreaterThan(0);
      });
    });

    test('should validate betting configuration produces expected results', () => {
      // Test the side configuration
      expect(knownStrategy.side).toHaveProperty('betSide');
      expect(knownStrategy.side.betSide).toBe('away'); // From the known strategy
      
      // Test the size configuration
      expect(knownStrategy.size).toHaveProperty('stakingMethod');
      expect(knownStrategy.size.stakingMethod).toBe('variable'); // Dynamic sizing
      
      // Test that the size expression is valid
      const testMatch = enhancedData[0];
      const sizeExpression = knownStrategy.size.expression;
      
      // This should not throw an error
      expect(() => {
        const { preMatch } = testMatch;
        new Function('preMatch', 'Math', `return ${sizeExpression}`)(preMatch, Math);
      }).not.toThrow();
    });

    test('should validate data integrity throughout the calculation process', () => {
      // Step 1: Filter matches
      const filteredMatches = calculationEngine.getFilteredMatches(enhancedData, knownStrategy.factors);
      
      // Step 2: Calculate results
      const bettingResults = calculationEngine.calculateBettingResults(
        filteredMatches, 
        knownStrategy.side, 
        knownStrategy.size
      );
      
      // Step 3: Validate data integrity
      bettingResults.bettingRecords.forEach((record, index) => {
        expect(record).toHaveProperty('matchKey');
        expect(record).toHaveProperty('stake');
        expect(record).toHaveProperty('odds');
        expect(record).toHaveProperty('outcome');
        expect(record).toHaveProperty('profit');
        expect(record).toHaveProperty('payout');
        
        // Validate that the matchKey corresponds to a real match
        const originalMatch = enhancedData.find(m => m.matchKey === record.matchKey);
        expect(originalMatch).toBeDefined();
        
        // Validate that the stake is reasonable
        expect(record.stake).toBeGreaterThan(0);
        
        // Validate that the odds are reasonable
        expect(record.odds).toBeGreaterThan(1.0);
        expect(record.odds).toBeLessThan(10.0);
      });
      
      // Validate summary calculations
      const calculatedTotalStake = bettingResults.bettingRecords.reduce((sum, record) => sum + record.stake, 0);
      const calculatedTotalProfit = bettingResults.bettingRecords.reduce((sum, record) => sum + record.profit, 0);
      
      expect(bettingResults.summary.totalStake).toBeCloseTo(calculatedTotalStake, 2);
      expect(bettingResults.summary.totalProfit).toBeCloseTo(calculatedTotalProfit, 2);
    });

    test('should handle edge cases gracefully', () => {
      // Test with empty match list
      const emptyResults = calculationEngine.calculateBettingResults(
        [], 
        knownStrategy.side, 
        knownStrategy.size
      );
      
      expect(emptyResults.summary.totalBets).toBe(0);
      expect(emptyResults.summary.totalStake).toBe(0);
      expect(emptyResults.summary.totalProfit).toBe(0);
      expect(emptyResults.summary.roi).toBe(0);
      expect(emptyResults.summary.winRate).toBe(0);
      
      // Test with no factors
      const noFactorMatches = calculationEngine.getFilteredMatches(enhancedData, []);
      expect(noFactorMatches).toEqual(enhancedData);
    });
  });

  describe('Performance Benchmarking', () => {
    test('should complete calculations within reasonable time', () => {
      const startTime = Date.now();
      
      const filteredMatches = calculationEngine.getFilteredMatches(enhancedData, knownStrategy.factors);
      const bettingResults = calculationEngine.calculateBettingResults(
        filteredMatches, 
        knownStrategy.side, 
        knownStrategy.size
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  Calculation completed in ${duration}ms`);
      console.log(`   Matches processed: ${enhancedData.length}`);
      console.log(`   Matches filtered: ${filteredMatches.length}`);
      console.log(`   Bets calculated: ${bettingResults.summary.totalBets}`);
      
      // Should complete within 5 seconds for this dataset
      expect(duration).toBeLessThan(5000);
      
      // Should process at least 1000 matches per second
      const processingRate = enhancedData.length / (duration / 1000);
      expect(processingRate).toBeGreaterThan(1000);
      
      console.log(`🚀 Processing rate: ${processingRate.toFixed(0)} matches/second`);
    });

    test('should demonstrate caching effectiveness', () => {
      // First run
      const startTime1 = Date.now();
      const filteredMatches1 = calculationEngine.getFilteredMatches(enhancedData, knownStrategy.factors);
      const bettingResults1 = calculationEngine.calculateBettingResults(
        filteredMatches1, 
        knownStrategy.side, 
        knownStrategy.size
      );
      const duration1 = Date.now() - startTime1;
      
      // Second run (should use cache)
      const startTime2 = Date.now();
      const filteredMatches2 = calculationEngine.getFilteredMatches(enhancedData, knownStrategy.factors);
      const bettingResults2 = calculationEngine.calculateBettingResults(
        filteredMatches2, 
        knownStrategy.side, 
        knownStrategy.size
      );
      const duration2 = Date.now() - startTime2;
      
      console.log(`⏱️  First run: ${duration1}ms`);
      console.log(`⏱️  Second run: ${duration2}ms`);
      console.log(`📈 Speed improvement: ${(duration1 / duration2).toFixed(1)}x faster`);
      
      // Results should be identical
      expect(bettingResults1.summary).toEqual(bettingResults2.summary);
      
      // Second run should be faster (caching working)
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });
}); 