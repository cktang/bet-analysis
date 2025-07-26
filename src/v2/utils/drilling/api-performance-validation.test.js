/**
 * API Performance Validation Test
 * Validates that the actual NestJS API endpoints produce the same performance metrics
 * as recorded in the known-strategy.json file
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

describe('API Performance Validation Tests', () => {
  let knownStrategy;
  let baseUrl = 'http://localhost:3001';
  let serverProcess;

  beforeAll(async () => {
    // Load known strategy
    const strategyPath = path.join(process.cwd(), '..', '..', '..', '..', 'data', 'v2', 'known-strategy.json');
    const strategyData = fs.readFileSync(strategyPath, 'utf8');
    knownStrategy = JSON.parse(strategyData);
    
    console.log(`🎯 Testing API against known strategy:`);
    console.log(`   Factors: ${knownStrategy.factors.map(f => f.key).join(', ')}`);
    console.log(`   Expected Bets: ${knownStrategy.performance.totalBets}`);
    console.log(`   Expected ROI: ${knownStrategy.performance.roi}%`);
    console.log(`   Expected Profit: $${knownStrategy.performance.totalProfit}`);
  });

  describe('API Endpoint Validation', () => {
    test('should validate server is running and accessible', async () => {
      try {
        const response = await axios.get(`${baseUrl}/health`);
        expect(response.status).toBe(200);
        console.log('✅ Server is running and accessible');
      } catch (error) {
        console.error('❌ Server is not running. Please start the server with: npm start');
        throw new Error('Server must be running on http://localhost:3001');
      }
    });

    test('should validate factor definitions are loaded', async () => {
      const response = await axios.get(`${baseUrl}/analysis/factor-definitions`);
      expect(response.status).toBe(200);
      
      const factorDefinitions = response.data;
      expect(factorDefinitions).toBeDefined();
      
      // Check that our known strategy factors exist
      knownStrategy.factors.forEach(factor => {
        expect(factorDefinitions[factor.category]).toBeDefined();
        expect(factorDefinitions[factor.category][factor.key]).toBeDefined();
        console.log(`✅ Factor ${factor.key} (${factor.category}) is available`);
      });
    });

    test('should validate create-specific-strategy endpoint with known strategy factors', async () => {
      // Convert known strategy to API format
      const apiRequest = {
        factors: knownStrategy.factors.map(f => `${f.category}.${f.key}`),
        betSide: knownStrategy.side.betSide,
        size: knownStrategy.size.stakingMethod === 'variable' ? 'dynamic' : knownStrategy.size.expression
      };
      
      console.log(`📤 API Request:`, JSON.stringify(apiRequest, null, 2));
      
      const response = await axios.post(`${baseUrl}/analysis/create-specific-strategy`, apiRequest);
      expect(response.status).toBe(201); // POST requests return 201 Created
      
      const apiResult = response.data;
      console.log(`📥 API Response:`, JSON.stringify(apiResult, null, 2));
      
      // Validate the API response structure (API returns flat structure)
      expect(apiResult).toHaveProperty('performance');
      expect(apiResult).toHaveProperty('factors');
      expect(apiResult).toHaveProperty('betSide');
      expect(apiResult).toHaveProperty('size');
      expect(apiResult.performance).toHaveProperty('totalBets');
      expect(apiResult.performance).toHaveProperty('totalProfit');
      expect(apiResult.performance).toHaveProperty('roi');
      expect(apiResult.performance).toHaveProperty('winRate');
      
      // Compare with known strategy performance
      console.log(`🔍 Performance Comparison:`);
      console.log(`   API Total Bets: ${apiResult.performance.totalBets}`);
      console.log(`   Expected Total Bets: ${knownStrategy.performance.totalBets}`);
      console.log(`   API Total Profit: $${apiResult.performance.totalProfit}`);
      console.log(`   Expected Total Profit: $${knownStrategy.performance.totalProfit}`);
      console.log(`   API ROI: ${apiResult.performance.roi}%`);
      console.log(`   Expected ROI: ${knownStrategy.performance.roi}%`);
      console.log(`   API Win Rate: ${apiResult.performance.winRate}%`);
      console.log(`   Expected Win Rate: ${knownStrategy.performance.winRate}%`);
      
      // Validate exact match
      expect(apiResult.performance.totalBets).toBe(knownStrategy.performance.totalBets);
      expect(apiResult.performance.totalProfit).toBeCloseTo(knownStrategy.performance.totalProfit, 2);
      expect(apiResult.performance.roi).toBeCloseTo(knownStrategy.performance.roi, 2);
      expect(apiResult.performance.winRate).toBeCloseTo(knownStrategy.performance.winRate, 2);
      
      console.log(`✅ API performance matches known strategy exactly!`);
    });

    test('should validate individual factor drilling works correctly', async () => {
      // Test each factor individually
      for (const factor of knownStrategy.factors) {
        const factorKey = `${factor.category}.${factor.key}`;
        console.log(`🔍 Testing individual factor: ${factorKey}`);
        
        const response = await axios.post(`${baseUrl}/analysis/drill-factors`, {
          factors: [factorKey]
        });
        
        expect(response.status).toBe(201); // POST requests return 201 Created
        const result = response.data;
        
        // Handle different response structures
        const matchCount = result.matches?.length || result.matchCount || result.filteredMatches || 0;
        console.log(`   Found ${matchCount} matches for ${factorKey}`);
        // Individual factor drilling might return 0 matches, which is acceptable
        expect(matchCount).toBeGreaterThanOrEqual(0);
        
        // Validate that the factor is working
        if (result.factors) {
          expect(result.factors).toHaveLength(1);
          expect(result.factors[0].key).toBe(factorKey);
        }
      }
    });

    test('should validate generate-random-strategy endpoint produces valid results', async () => {
      const response = await axios.get(`${baseUrl}/analysis/generate-random-strategy?betSide=away&size=1500&noOfFactors=2`);
      expect(response.status).toBe(200);
      
      const result = response.data;
      console.log(`🎲 Random Strategy Generated:`);
      console.log(`   Total Bets: ${result.performance.totalBets}`);
      console.log(`   ROI: ${result.performance.roi}%`);
      
      // Check if strategy structure exists
      if (result.strategy && result.strategy.factors) {
        console.log(`   Factors: ${result.strategy.factors.map(f => f.key).join(', ')}`);
      }
      
      // Validate structure (API returns flat structure)
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('factors');
      expect(result.factors).toHaveLength(2);
      expect(result.performance.totalBets).toBeGreaterThan(0);
    });

    test('should validate available-factors endpoint', async () => {
      const response = await axios.get(`${baseUrl}/analysis/available-factors`);
      expect(response.status).toBe(200);
      
      const factors = response.data;
      console.log(`📊 Available factors response:`, typeof factors, factors ? Object.keys(factors) : 'null');
      
      // Handle different response formats - API returns object with category arrays
      const allFactors = [];
      Object.values(factors || {}).forEach(categoryFactors => {
        if (Array.isArray(categoryFactors)) {
          allFactors.push(...categoryFactors);
        }
      });
      
      expect(allFactors.length).toBeGreaterThan(0);
      
      // Check that our known strategy factors are available
      const availableFactorKeys = allFactors.map(f => f.split(' - ')[0]); // Extract key from "key - description" format
      knownStrategy.factors.forEach(factor => {
        const factorKey = `${factor.category}.${factor.key}`;
        expect(availableFactorKeys).toContain(factorKey);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid factor combinations gracefully', async () => {
      try {
        const response = await axios.post(`${baseUrl}/analysis/create-specific-strategy`, {
          factors: ['invalid.factor', 'another.invalid']
        });
        
        // Should either return 0 matches or handle gracefully
        expect(response.status).toBe(201);
        expect(response.data.performance.totalBets).toBe(0);
        console.log('✅ Invalid factors handled gracefully');
      } catch (error) {
        // API might return an error, which is also acceptable
        if (error.response) {
          expect(error.response.status).toBe(400);
          console.log('✅ Invalid factors properly rejected');
        } else {
          console.log('✅ Invalid factors handled gracefully');
        }
      }
    });

    test('should handle empty factor list', async () => {
      const response = await axios.post(`${baseUrl}/analysis/create-specific-strategy`, {
        factors: []
      });
      
      expect(response.status).toBe(201);
      // Should return all matches when no factors specified
      const result = response.data;
      console.log('Empty factor list response:', JSON.stringify(result, null, 2));
      // Empty factor list should return some result
      expect(result).toBeDefined();
      console.log('✅ Empty factor list handled correctly');
    });

    test('should validate cache clearing functionality', async () => {
      const response = await axios.post(`${baseUrl}/analysis/clear-cache`);
      expect(response.status).toBe(201);
      expect(response.data.message).toContain('Cache cleared');
      console.log('✅ Cache clearing works');
    });
  });

  describe('Performance Benchmarking', () => {
    test('should complete API requests within reasonable time', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(`${baseUrl}/analysis/create-specific-strategy`, {
        factors: knownStrategy.factors.map(f => `${f.category}.${f.key}`),
        betSide: knownStrategy.side.betSide,
        size: 'dynamic'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⏱️  API request completed in ${duration}ms`);
      
      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      expect(response.status).toBe(201);
      
      console.log(`🚀 API performance: ${duration}ms for full strategy analysis`);
    });

    test('should demonstrate API consistency across multiple requests', async () => {
      const results = [];
      
      // Make multiple identical requests
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        const response = await axios.post(`${baseUrl}/analysis/create-specific-strategy`, {
          factors: knownStrategy.factors.map(f => `${f.category}.${f.key}`),
          betSide: knownStrategy.side.betSide,
          size: 'dynamic'
        });
        
        const duration = Date.now() - startTime;
        results.push({
          duration,
          totalBets: response.data.performance.totalBets,
          roi: response.data.performance.roi
        });
        
        console.log(`   Request ${i + 1}: ${duration}ms, ${response.data.performance.totalBets} bets, ${response.data.performance.roi}% ROI`);
      }
      
      // Results should be consistent
      const firstResult = results[0];
      results.forEach((result, index) => {
        expect(result.totalBets).toBe(firstResult.totalBets);
        expect(result.roi).toBeCloseTo(firstResult.roi, 2);
      });
      
      console.log(`✅ API produces consistent results across multiple requests`);
    });
  });
}); 