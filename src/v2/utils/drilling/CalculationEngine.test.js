/**
 * CalculationEngine Test Suite
 * Tests for match filtering, betting calculations, and performance caching
 */

const CalculationEngine = require('./CalculationEngine');
const fs = require('fs');
const path = require('path');

// Test data
const testMatches = [
  {
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
  },
  {
    matchKey: 'test_match_2',
    preMatch: {
      match: {
        homeTeam: 'Liverpool',
        awayTeam: 'Man City',
        homeScore: 1,
        awayScore: 2,
        asianHandicapOdds: {
          homeOdds: 2.10,
          awayOdds: 1.70,
          homeHandicap: 0.5
        }
      },
      fbref: {
        week: 10
      }
    },
    timeSeries: {
      home: {
        leaguePosition: 15,
        matchesPlayed: 10,
        streaks: {
          overall: {
            current: {
              type: 'loss',
              count: 1
            }
          }
        }
      },
      away: {
        leaguePosition: 2,
        matchesPlayed: 10,
        streaks: {
          overall: {
            current: {
              type: 'win',
              count: 4
            }
          }
        }
      }
    }
  }
];

describe('CalculationEngine', () => {
  let calculationEngine;

  beforeEach(() => {
    calculationEngine = new CalculationEngine();
  });

  describe('getFilteredMatches', () => {
    test('should return all matches when no factors provided', () => {
      const result = calculationEngine.getFilteredMatches(testMatches, []);
      expect(result).toEqual(testMatches);
    });

    test('should filter matches by single factor', () => {
      const factors = [{
        category: 'time',
        key: 'veryEarly',
        expression: 'preMatch.fbref.week >= 1 && preMatch.fbref.week <= 6'
      }];
      
      const result = calculationEngine.getFilteredMatches(testMatches, factors);
      expect(result).toHaveLength(1); // Only first match has week 5
      expect(result[0].matchKey).toBe('test_match_1');
    });

    test('should filter matches by multiple factors', () => {
      const factors = [
        {
          category: 'time',
          key: 'veryEarly',
          expression: 'preMatch.fbref.week >= 1 && preMatch.fbref.week <= 6'
        },
        {
          category: 'ahLevel',
          key: 'quarterHandicap',
          expression: 'preMatch.match.asianHandicapOdds.homeHandicap % 0.25 === 0 && preMatch.match.asianHandicapOdds.homeHandicap % 0.5 !== 0'
        }
      ];
      
      const result = calculationEngine.getFilteredMatches(testMatches, factors);
      expect(result).toHaveLength(1); // Only first match satisfies both conditions
      expect(result[0].matchKey).toBe('test_match_1');
    });

    test('should use caching for performance', () => {
      const factors = [{
        category: 'time',
        key: 'veryEarly',
        expression: 'preMatch.fbref.week >= 1 && preMatch.fbref.week <= 6'
      }];
      
      // First call
      const result1 = calculationEngine.getFilteredMatches(testMatches, factors);
      const stats1 = calculationEngine.getCacheHitRates();
      
      // Second call should use cache
      const result2 = calculationEngine.getFilteredMatches(testMatches, factors);
      const stats2 = calculationEngine.getCacheHitRates();
      
      expect(result1).toEqual(result2);
      expect(parseFloat(stats2.matchFilter)).toBeGreaterThan(parseFloat(stats1.matchFilter));
    });

    test('should handle invalid factor expressions gracefully', () => {
      const factors = [{
        category: 'invalid',
        key: 'invalid',
        expression: 'invalid.expression'
      }];
      
      const result = calculationEngine.getFilteredMatches(testMatches, factors);
      expect(result).toHaveLength(0); // No matches should pass invalid expression
    });
  });

  describe('calculateBettingResults', () => {
    test('should calculate results for home betting', () => {
      const sideSelection = {
        category: 'side',
        key: 'home',
        betSide: 'home'
      };
      
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      
      const result = calculationEngine.calculateBettingResults(testMatches, sideSelection, sizeSelection);
      
      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalBets');
      expect(result.summary).toHaveProperty('totalStake');
      expect(result.summary).toHaveProperty('totalProfit');
      expect(result.summary).toHaveProperty('roi');
      expect(result.summary).toHaveProperty('winRate');
      expect(result).toHaveProperty('bettingRecords');
      expect(result.bettingRecords).toHaveLength(2);
    });

    test('should calculate results for away betting', () => {
      const sideSelection = {
        category: 'side',
        key: 'away',
        betSide: 'away'
      };
      
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      
      const result = calculationEngine.calculateBettingResults(testMatches, sideSelection, sizeSelection);
      
      expect(result.summary.totalBets).toBe(2);
      expect(result.summary.totalStake).toBe(3000);
    });

    test('should calculate dynamic sizing correctly', () => {
      const sideSelection = {
        category: 'side',
        key: 'home',
        betSide: 'home'
      };
      
      const sizeSelection = {
        category: 'size',
        key: 'dynamic',
        expression: '200 + Math.floor((Math.max(preMatch.match.asianHandicapOdds.homeOdds, preMatch.match.asianHandicapOdds.awayOdds) - 1.91) * 100) * 150',
        stakingMethod: 'variable'
      };
      
      const result = calculationEngine.calculateBettingResults(testMatches, sideSelection, sizeSelection);
      
      expect(result.summary.totalBets).toBe(2);
      expect(result.summary.totalStake).toBeGreaterThan(0);
    });

    test('should use caching for betting results', () => {
      const sideSelection = {
        category: 'side',
        key: 'home',
        betSide: 'home'
      };
      
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      
      // First call
      const result1 = calculationEngine.calculateBettingResults(testMatches, sideSelection, sizeSelection);
      const stats1 = calculationEngine.getCacheHitRates();
      
      // Second call should use cache
      const result2 = calculationEngine.calculateBettingResults(testMatches, sideSelection, sizeSelection);
      const stats2 = calculationEngine.getCacheHitRates();
      
      expect(result1.summary).toEqual(result2.summary);
      expect(parseFloat(stats2.bettingResult)).toBeGreaterThan(parseFloat(stats1.bettingResult));
    });

    test('should calculate results for higherOdds dynamic side', () => {
      const sideSelection = {
        category: 'side',
        key: 'higherOdds',
        betSide: "preMatch.match.asianHandicapOdds.homeOdds > preMatch.match.asianHandicapOdds.awayOdds ? 'home' : 'away'"
      };
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      const result = calculationEngine.calculateBettingResults(testMatches, sideSelection, sizeSelection);
      expect(result.summary.totalBets).toBe(2);
      expect(result.summary.totalStake).toBe(3000);
      // For match 1, homeOdds=1.95 > 1.85, so betSide should resolve to 'home'
      // For match 2, homeOdds=2.10 > 1.70, so betSide should resolve to 'home'
      expect(result.bettingRecords[0].betSide).toBe('home');
      expect(result.bettingRecords[1].betSide).toBe('home');
    });
  });

  describe('calculateSingleBet', () => {
    test('should calculate home win correctly', () => {
      const sideSelection = {
        category: 'side',
        key: 'home',
        betSide: 'home'
      };
      
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      
      const result = calculationEngine.calculateSingleBet(testMatches[0], sideSelection, sizeSelection);
      
      expect(result).toHaveProperty('matchKey');
      expect(result).toHaveProperty('stake');
      expect(result).toHaveProperty('odds');
      expect(result).toHaveProperty('outcome');
      expect(result).toHaveProperty('profit');
      expect(result).toHaveProperty('payout');
    });

    test('should calculate away win correctly', () => {
      const sideSelection = {
        category: 'side',
        key: 'away',
        betSide: 'away'
      };
      
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      
      const result = calculationEngine.calculateSingleBet(testMatches[0], sideSelection, sizeSelection);
      
      expect(result.outcome).toBe('loss'); // Away team lost 1-2
      expect(result.profit).toBeLessThan(0);
    });

    test('should calculate single bet with higherOdds dynamic side', () => {
      const sideSelection = {
        category: 'side',
        key: 'higherOdds',
        betSide: "preMatch.match.asianHandicapOdds.homeOdds > preMatch.match.asianHandicapOdds.awayOdds ? 'home' : 'away'"
      };
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      const result = calculationEngine.calculateSingleBet(testMatches[0], sideSelection, sizeSelection);
      expect(result).toHaveProperty('betSide', 'home');
      expect(result).toHaveProperty('outcome');
      expect(result).toHaveProperty('profit');
    });

    test('should handle betSide as higherOdds string directly', () => {
      const sideSelection = {
        category: 'side',
        key: 'higherOdds',
        betSide: 'higherOdds'  // This is what the genetic algorithm actually passes
      };
      const sizeSelection = {
        category: 'size',
        key: 'fix',
        expression: '1500',
        stakingMethod: 'fixed'
      };
      
      const result = calculationEngine.calculateSingleBet(testMatches[0], sideSelection, sizeSelection);
      
      expect(result).not.toBeNull();
      expect(result.betSide).toBe('home'); // Should resolve to home since homeOdds > awayOdds in test data
      expect(result.stake).toBe(1500);
    });
  });

  describe('cache management', () => {
    test('should clear all caches', () => {
      // First, populate some caches
      const factors = [{
        category: 'time',
        key: 'veryEarly',
        expression: 'preMatch.fbref.week >= 1 && preMatch.fbref.week <= 6'
      }];
      
      calculationEngine.getFilteredMatches(testMatches, factors);
      
      // Clear cache
      calculationEngine.clearCache();
      
      // Verify caches are empty
      const hitRates = calculationEngine.getCacheHitRates();
      expect(hitRates.matchFilter).toBe('0.0');
    });

    test('should track cache hit rates', () => {
      const factors = [{
        category: 'time',
        key: 'veryEarly',
        expression: 'preMatch.fbref.week >= 1 && preMatch.fbref.week <= 6'
      }];
      
      // First call (miss)
      calculationEngine.getFilteredMatches(testMatches, factors);
      
      // Second call (hit)
      calculationEngine.getFilteredMatches(testMatches, factors);
      
      const hitRates = calculationEngine.getCacheHitRates();
      expect(hitRates.matchFilter).toBe('50.0'); // 1 hit, 1 miss = 50%
    });
  });
});

// Integration test with known strategy
describe('CalculationEngine Integration Tests', () => {
  let calculationEngine;
  let knownStrategy;
  let testMatches;

  beforeAll(() => {
    calculationEngine = new CalculationEngine();
    
    // Load known strategy
    const strategyPath = path.join(process.cwd(), 'data', 'v2', 'known-strategy.json');
    const strategyData = fs.readFileSync(strategyPath, 'utf8');
    knownStrategy = JSON.parse(strategyData);
    
    // Create test matches that should match the known strategy
    testMatches = [
      {
        matchKey: 'known_strategy_test_1',
        preMatch: {
          match: {
            homeTeam: 'Test Home',
            awayTeam: 'Test Away',
            homeScore: 1,
            awayScore: 0,
            asianHandicapOdds: {
              homeOdds: 1.95,
              awayOdds: 1.85,
              homeHandicap: -0.25
            }
          },
          fbref: {
            week: 3
          }
        },
        timeSeries: {
          home: { leaguePosition: 5 },
          away: { leaguePosition: 10 }
        }
      }
    ];
  });

  test('should filter matches using known strategy factors', () => {
    const result = calculationEngine.getFilteredMatches(testMatches, knownStrategy.factors);
    
    // Should find 1 match that satisfies both veryEarly and quarterHandicap factors
    expect(result).toHaveLength(1);
    expect(result[0].matchKey).toBe('known_strategy_test_1');
  });

  test('should calculate betting results using known strategy configuration', () => {
    const result = calculationEngine.calculateBettingResults(
      testMatches, 
      knownStrategy.side, 
      knownStrategy.size
    );
    
    expect(result.summary.totalBets).toBe(1);
    expect(result.summary.totalStake).toBeGreaterThan(0);
    expect(result.bettingRecords).toHaveLength(1);
  });
}); 