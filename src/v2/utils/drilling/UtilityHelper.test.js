/**
 * UtilityHelper Test Suite
 * Tests for factor expression evaluation, betting calculations, and utility functions
 */

const UtilityHelper = require('./UtilityHelper');
const fs = require('fs');
const path = require('path');

// Test data
const testMatch = {
  matchKey: 'test_match_1',
  preMatch: {
    match: {
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      homeScore: 2,
      awayScore: 1,
      asianHandicapOdds: {
        homeOdds: 1.95,
        awayOdds: 1.85,
        homeHandicap: -0.25
      }
    },
    fbref: {
      week: 5
    }
  },
  timeSeries: {
    home: {
      leaguePosition: 3,
      matchesPlayed: 5,
      streaks: {
        overall: {
          current: {
            type: 'win',
            count: 3
          }
        }
      }
    },
    away: {
      leaguePosition: 8,
      matchesPlayed: 5,
      streaks: {
        overall: {
          current: {
            type: 'loss',
            count: 2
          }
        }
      }
    }
  }
};

describe('UtilityHelper', () => {
  describe('evaluateFactorExpression', () => {
    let cache;

    beforeEach(() => {
      cache = new Map();
    });

    test('should evaluate simple boolean expressions', () => {
      const result = UtilityHelper.evaluateFactorExpression(testMatch, 'true', cache);
      expect(result).toBe(true);
    });

    test('should evaluate time-based factors', () => {
      const result = UtilityHelper.evaluateFactorExpression(
        testMatch, 
        'preMatch.fbref.week >= 1 && preMatch.fbref.week <= 6', 
        cache
      );
      expect(result).toBe(true);
    });

    test('should evaluate timeSeries factors', () => {
      const result = UtilityHelper.evaluateFactorExpression(
        testMatch, 
        '(timeSeries.home.leaguePosition) <= 6', 
        cache
      );
      expect(result).toBe(true);
    });

    test('should evaluate complex timeSeries factors', () => {
      const result = UtilityHelper.evaluateFactorExpression(
        testMatch, 
        '(timeSeries.home.leaguePosition) >= 15 && (timeSeries.away.leaguePosition) <= 6', 
        cache
      );
      expect(result).toBe(false); // home position is 3, away position is 8
    });

    test('should evaluate quarter handicap factors', () => {
      const result = UtilityHelper.evaluateFactorExpression(
        testMatch, 
        'preMatch.match.asianHandicapOdds.homeHandicap % 0.25 === 0 && preMatch.match.asianHandicapOdds.homeHandicap % 0.5 !== 0', 
        cache
      );
      expect(result).toBe(true); // -0.25 is a quarter handicap
    });

    test('should handle invalid expressions gracefully', () => {
      const result = UtilityHelper.evaluateFactorExpression(
        testMatch, 
        'invalid.expression', 
        cache
      );
      expect(result).toBe(false);
    });

    test('should use caching for performance', () => {
      const expression = 'preMatch.fbref.week >= 1';
      
      // First evaluation
      const result1 = UtilityHelper.evaluateFactorExpression(testMatch, expression, cache);
      expect(result1).toBe(true);
      
      // Second evaluation should use cache
      const result2 = UtilityHelper.evaluateFactorExpression(testMatch, expression, cache);
      expect(result2).toBe(true);
      
      // Verify cache was used
      expect(cache.size).toBe(1);
    });
  });

  describe('getBettingConfigHash', () => {
    test('should generate consistent hash for same configuration', () => {
      const matches = [testMatch];
      const sideSelection = { category: 'side', key: 'home' };
      const sizeSelection = { category: 'size', key: 'fix' };
      
      const hash1 = UtilityHelper.getBettingConfigHash(matches, sideSelection, sizeSelection);
      const hash2 = UtilityHelper.getBettingConfigHash(matches, sideSelection, sizeSelection);
      
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different configurations', () => {
      const matches = [testMatch];
      const sideSelection1 = { category: 'side', key: 'home' };
      const sideSelection2 = { category: 'side', key: 'away' };
      const sizeSelection = { category: 'size', key: 'fix' };
      
      const hash1 = UtilityHelper.getBettingConfigHash(matches, sideSelection1, sizeSelection);
      const hash2 = UtilityHelper.getBettingConfigHash(matches, sideSelection2, sizeSelection);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should handle API format (betSide/expression) configurations', () => {
      const matches = [testMatch];
      const sideSelection = { 
        betSide: 'home', 
        description: 'Bet on home team' 
      };
      const sizeSelection = { 
        expression: '1500', 
        description: '$1500', 
        stakingMethod: 'fixed' 
      };
      
      const hash = UtilityHelper.getBettingConfigHash(matches, sideSelection, sizeSelection);
      expect(hash).toBeTruthy();
      expect(hash).toContain('home:Bet on home team');
      expect(hash).toContain('1500:fixed');
    });

    test('should generate different hashes for different API format configurations', () => {
      const matches = [testMatch];
      const sideSelection = { betSide: 'home', description: 'Bet on home team' };
      
      const fixedSizeSelection = { 
        expression: '1500', 
        description: '$1500', 
        stakingMethod: 'fixed' 
      };
      const dynamicSizeSelection = { 
        expression: '200 + Math.floor((Math.max(preMatch.match.asianHandicapOdds.homeOdds, preMatch.match.asianHandicapOdds.awayOdds) - 1.91) * 100) * 150', 
        description: '$200 if odds <=1.91, else +$150 per 0.01', 
        stakingMethod: 'variable' 
      };
      
      const hash1 = UtilityHelper.getBettingConfigHash(matches, sideSelection, fixedSizeSelection);
      const hash2 = UtilityHelper.getBettingConfigHash(matches, sideSelection, dynamicSizeSelection);
      
      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain('1500:fixed');
      expect(hash2).toContain('variable');
    });

    test('should handle mixed format configurations (category/key vs betSide/expression)', () => {
      const matches = [testMatch];
      
      // Original drilling tool format
      const originalSideSelection = { category: 'side', key: 'home' };
      const originalSizeSelection = { category: 'size', key: 'fix' };
      
      // API format
      const apiSideSelection = { betSide: 'home', description: 'Bet on home team' };
      const apiSizeSelection = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      
      const hash1 = UtilityHelper.getBettingConfigHash(matches, originalSideSelection, originalSizeSelection);
      const hash2 = UtilityHelper.getBettingConfigHash(matches, apiSideSelection, apiSizeSelection);
      
      // Should generate different hashes due to different data structures
      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain('side:home');
      expect(hash2).toContain('home:Bet on home team');
    });

    test('should ensure size.fix and size.dynamic never collide in cache', () => {
      const matches = [testMatch];
      const sideSelection = { betSide: 'home', description: 'Bet on home team' };
      
      const fixedSizeSelection = { 
        expression: '1500', 
        description: '$1500', 
        stakingMethod: 'fixed' 
      };
      const dynamicSizeSelection = { 
        expression: '200 + Math.floor((Math.max(preMatch.match.asianHandicapOdds.homeOdds, preMatch.match.asianHandicapOdds.awayOdds) - 1.91) * 100) * 150', 
        description: 'Dynamic sizing', 
        stakingMethod: 'variable' 
      };
      
      const hashFixed = UtilityHelper.getBettingConfigHash(matches, sideSelection, fixedSizeSelection);
      const hashDynamic = UtilityHelper.getBettingConfigHash(matches, sideSelection, dynamicSizeSelection);
      
      // Critical test: These must NEVER be equal to prevent cache collision bug
      expect(hashFixed).not.toBe(hashDynamic);
      
      // Verify the hashes contain distinguishing information
      expect(hashFixed).toContain('fixed');
      expect(hashDynamic).toContain('variable');
    });
  });

  describe('formatCurrency', () => {
    test('should format positive numbers correctly', () => {
      expect(UtilityHelper.formatCurrency(1234.56)).toBe('$1,235');
      expect(UtilityHelper.formatCurrency(1000000)).toBe('$1,000,000');
    });

    test('should format negative numbers correctly', () => {
      expect(UtilityHelper.formatCurrency(-1234.56)).toBe('-$1,235');
    });

    test('should handle zero correctly', () => {
      expect(UtilityHelper.formatCurrency(0)).toBe('$0');
    });
  });

  describe('formatPercent', () => {
    test('should format percentages correctly', () => {
      expect(UtilityHelper.formatPercent(0.1234)).toBe('+0.12%');
      expect(UtilityHelper.formatPercent(1.5)).toBe('+1.50%');
      expect(UtilityHelper.formatPercent(-0.05)).toBe('-0.05%');
    });
  });

  describe('getProfitColorClass', () => {
    test('should return correct color classes', () => {
      expect(UtilityHelper.getProfitColorClass(100)).toBe('profit-positive');
      expect(UtilityHelper.getProfitColorClass(-100)).toBe('profit-negative');
      expect(UtilityHelper.getProfitColorClass(0)).toBe('profit-neutral');
    });
  });

  describe('roundNumber', () => {
    test('should round numbers correctly', () => {
      expect(UtilityHelper.roundNumber(3.14159, 2)).toBe(3.14);
      expect(UtilityHelper.roundNumber(3.14159, 0)).toBe(3);
      expect(UtilityHelper.roundNumber(3.14159)).toBe(3.14); // default 2 decimals
    });
  });

  describe('isValidNumber', () => {
    test('should validate numbers correctly', () => {
      expect(UtilityHelper.isValidNumber(123)).toBe(true);
      expect(UtilityHelper.isValidNumber(123.45)).toBe(true);
      expect(UtilityHelper.isValidNumber(NaN)).toBe(false);
      expect(UtilityHelper.isValidNumber(Infinity)).toBe(false);
      expect(UtilityHelper.isValidNumber('123')).toBe(false);
    });
  });

  describe('getNestedProperty', () => {
    test('should get nested properties correctly', () => {
      const obj = { a: { b: { c: 'value' } } };
      expect(UtilityHelper.getNestedProperty(obj, 'a.b.c')).toBe('value');
      expect(UtilityHelper.getNestedProperty(obj, 'a.b.d', 'default')).toBe('default');
    });
  });
});

// Integration test with known strategy data
describe('UtilityHelper Integration Tests', () => {
  let knownStrategy;

  beforeAll(() => {
    const strategyPath = path.join(process.cwd(), 'data', 'v2', 'known-strategy.json');
    try {
      const strategyData = fs.readFileSync(strategyPath, 'utf8');
      knownStrategy = JSON.parse(strategyData);
    } catch (error) {
      // Fallback strategy data for testing if file doesn't exist
      knownStrategy = {
        factors: [
          {
            key: 'veryEarly',
            expression: 'preMatch.fbref.week >= 1 && preMatch.fbref.week <= 6'
          },
          {
            key: 'quarterHandicap',
            expression: 'preMatch.match.asianHandicapOdds.homeHandicap % 0.25 === 0 && preMatch.match.asianHandicapOdds.homeHandicap % 0.5 !== 0'
          }
        ]
      };
    }
  });

  test('should evaluate known strategy factors correctly', () => {
    const cache = new Map();
    
    // Test the veryEarly factor from known strategy
    const veryEarlyFactor = knownStrategy.factors.find(f => f.key === 'veryEarly');
    const result = UtilityHelper.evaluateFactorExpression(
      testMatch, 
      veryEarlyFactor.expression, 
      cache
    );
    expect(result).toBe(true); // week 5 is between 1-6
  });

  test('should evaluate quarter handicap factor correctly', () => {
    const cache = new Map();
    
    // Test the quarterHandicap factor from known strategy
    const quarterHandicapFactor = knownStrategy.factors.find(f => f.key === 'quarterHandicap');
    const result = UtilityHelper.evaluateFactorExpression(
      testMatch, 
      quarterHandicapFactor.expression, 
      cache
    );
    expect(result).toBe(true); // -0.25 is a quarter handicap
  });
}); 