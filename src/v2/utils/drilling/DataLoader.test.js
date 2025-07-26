/**
 * DataLoader Test Suite
 * Tests for data loading integrity and consistency
 */

const DataLoader = require('./DataLoader');
const fs = require('fs');
const path = require('path');

// Mock data for testing
const mockEnhancedData = {
  matches: {
    'match_1': {
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
          matchesPlayed: 5
        },
        away: {
          leaguePosition: 8,
          matchesPlayed: 5
        }
      }
    },
    'match_2': {
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
          matchesPlayed: 10
        },
        away: {
          leaguePosition: 2,
          matchesPlayed: 10
        }
      }
    }
  }
};

describe('DataLoader', () => {
  describe('loadEnhancedData', () => {
    test('should load data with correct structure', async () => {
      const dataFiles = ['test-file.json'];
      
      // Mock file reader that returns our test data
      const fileReader = async (filePath) => {
        return mockEnhancedData;
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('matchKey');
      expect(result[0]).toHaveProperty('originalMatchKey');
      expect(result[0]).toHaveProperty('season');
      expect(result[0]).toHaveProperty('preMatch');
      expect(result[0]).toHaveProperty('timeSeries');
    });

    test('should extract season from filename correctly', async () => {
      const dataFiles = ['year-2023-2024-enhanced.json'];
      
      const fileReader = async (filePath) => {
        return mockEnhancedData;
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      expect(result[0].season).toBe('2023-24');
      expect(result[0].matchKey).toContain('2023-24');
    });

    test('should handle multiple files correctly', async () => {
      const dataFiles = [
        'year-2022-2023-enhanced.json',
        'year-2023-2024-enhanced.json'
      ];
      
      const fileReader = async (filePath) => {
        // Return different data based on file path to simulate different seasons
        if (filePath.includes('2022-2023')) {
          return { matches: { 'match_2022': mockEnhancedData.matches['match_1'] } };
        } else {
          return { matches: { 'match_2023': mockEnhancedData.matches['match_2'] } };
        }
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      // Should have 2 matches total (1 from each file)
      expect(result).toHaveLength(2);
      
      // Check that matches from different seasons have different prefixes
      const seasons = [...new Set(result.map(match => match.season))];
      expect(seasons).toContain('2022-23');
      expect(seasons).toContain('2023-24');
    });

    test('should handle file reading errors gracefully', async () => {
      const dataFiles = [
        'valid-file.json',
        'invalid-file.json'
      ];
      
      const fileReader = async (filePath) => {
        if (filePath === 'invalid-file.json') {
          throw new Error('File not found');
        }
        return mockEnhancedData;
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      // Should still load data from valid file
      expect(result).toHaveLength(2);
    });

    test('should handle files without matches property', async () => {
      const dataFiles = ['empty-file.json'];
      
      const fileReader = async (filePath) => {
        return { someOtherProperty: 'value' };
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      expect(result).toHaveLength(0);
    });

    test('should create unique matchKeys to avoid collisions', async () => {
      const dataFiles = [
        'year-2023-2024-enhanced.json',
        'year-2024-2025-enhanced.json'
      ];
      
      const fileReader = async (filePath) => {
        // Return different data based on file path to simulate different seasons
        if (filePath.includes('2023-2024')) {
          return { matches: { 'same_key': mockEnhancedData.matches['match_1'] } };
        } else {
          return { matches: { 'same_key': mockEnhancedData.matches['match_2'] } };
        }
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      expect(result).toHaveLength(2);
      
      // Both matches should have the same originalMatchKey but different matchKey
      expect(result[0].originalMatchKey).toBe('same_key');
      expect(result[1].originalMatchKey).toBe('same_key');
      expect(result[0].matchKey).not.toBe(result[1].matchKey);
      expect(result[0].matchKey).toContain('2023-24');
      expect(result[1].matchKey).toContain('2024-25');
    });
  });

  describe('data integrity', () => {
    test('should preserve all original match data', async () => {
      const dataFiles = ['test-file.json'];
      
      const fileReader = async (filePath) => {
        return mockEnhancedData;
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      // Check that all original data is preserved
      expect(result[0].preMatch).toEqual(mockEnhancedData.matches['match_1'].preMatch);
      expect(result[0].timeSeries).toEqual(mockEnhancedData.matches['match_1'].timeSeries);
      expect(result[1].preMatch).toEqual(mockEnhancedData.matches['match_2'].preMatch);
      expect(result[1].timeSeries).toEqual(mockEnhancedData.matches['match_2'].timeSeries);
    });

    test('should handle complex nested data structures', async () => {
      const complexData = {
        matches: {
          'complex_match': {
            preMatch: {
              match: {
                homeTeam: 'Team A',
                awayTeam: 'Team B',
                homeScore: 1,
                awayScore: 1,
                asianHandicapOdds: {
                  homeOdds: 1.90,
                  awayOdds: 1.90,
                  homeHandicap: 0
                }
              },
              fbref: {
                week: 15,
                season: '2023-24',
                competition: 'Premier League'
              },
              enhanced: {
                homeImpliedProb: 52.6,
                awayImpliedProb: 47.4
              }
            },
            timeSeries: {
              home: {
                leaguePosition: 7,
                matchesPlayed: 15,
                streaks: {
                  overall: {
                    current: {
                      type: 'win',
                      count: 2
                    },
                    previous: {
                      type: 'loss',
                      count: 1
                    }
                  },
                  asianHandicap: {
                    current: {
                      type: 'win',
                      count: 1
                    }
                  }
                },
                averages: {
                  overall: {
                    goalsFor: 1.4,
                    goalsAgainst: 1.2,
                    xGFor: 1.3,
                    xGAgainst: 1.1
                  }
                }
              },
              away: {
                leaguePosition: 12,
                matchesPlayed: 15,
                streaks: {
                  overall: {
                    current: {
                      type: 'draw',
                      count: 1
                    }
                  }
                },
                averages: {
                  overall: {
                    goalsFor: 1.1,
                    goalsAgainst: 1.3,
                    xGFor: 1.0,
                    xGAgainst: 1.4
                  }
                }
              }
            },
            postMatch: {
              incidents: [
                { type: 'goal', minute: 23, team: 'home' },
                { type: 'goal', minute: 67, team: 'away' }
              ]
            }
          }
        }
      };
      
      const dataFiles = ['complex-file.json'];
      
      const fileReader = async (filePath) => {
        return complexData;
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      expect(result).toHaveLength(1);
      expect(result[0].preMatch).toEqual(complexData.matches['complex_match'].preMatch);
      expect(result[0].timeSeries).toEqual(complexData.matches['complex_match'].timeSeries);
      expect(result[0].postMatch).toEqual(complexData.matches['complex_match'].postMatch);
    });
  });

  describe('cross-platform compatibility', () => {
    test('should work with Node.js file system', async () => {
      // Create a temporary test file
      const tempData = {
        matches: {
          'temp_match': {
            preMatch: {
              match: {
                homeTeam: 'Temp Home',
                awayTeam: 'Temp Away',
                homeScore: 0,
                awayScore: 0
              },
              fbref: { week: 1 }
            },
            timeSeries: {
              home: { leaguePosition: 1 },
              away: { leaguePosition: 2 }
            }
          }
        }
      };
      
      const tempFilePath = path.join(process.cwd(), 'temp-test-data.json');
      fs.writeFileSync(tempFilePath, JSON.stringify(tempData));
      
      try {
        const dataFiles = [tempFilePath];
        
        const fileReader = (filePath) => {
          const data = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(data);
        };
        
        const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
        
        expect(result).toHaveLength(1);
        expect(result[0].preMatch).toEqual(tempData.matches['temp_match'].preMatch);
      } finally {
        // Clean up
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });

    test('should work with browser fetch-like interface', async () => {
      const dataFiles = ['http://localhost:3001/analysis/data/enhanced/test.json'];
      
      // Mock fetch-like file reader
      const fileReader = async (filePath) => {
        // Simulate async fetch
        await new Promise(resolve => setTimeout(resolve, 10));
        return mockEnhancedData;
      };
      
      const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      
      expect(result).toHaveLength(2);
    });
  });
});

// Integration test with real data structure
describe('DataLoader Integration Tests', () => {
  test('should load data in same format as drilling app', async () => {
    // This test ensures the DataLoader produces the same structure
    // that the drilling app expects
    
    const dataFiles = ['test-file.json'];
    
    const fileReader = async (filePath) => {
      return mockEnhancedData;
    };
    
    const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
    
    // Verify the structure matches what the drilling app expects
    result.forEach(match => {
      // Required properties
      expect(match).toHaveProperty('matchKey');
      expect(match).toHaveProperty('originalMatchKey');
      expect(match).toHaveProperty('season');
      
      // Data structure
      expect(match).toHaveProperty('preMatch');
      expect(match).toHaveProperty('timeSeries');
      
      // Nested structure
      expect(match.preMatch).toHaveProperty('match');
      expect(match.preMatch).toHaveProperty('fbref');
      expect(match.timeSeries).toHaveProperty('home');
      expect(match.timeSeries).toHaveProperty('away');
      
      // MatchKey format - should contain season prefix
      expect(match.matchKey).toMatch(/^\d{4}-\d{2}_|^unknown_/);
    });
  });

  test('should handle edge cases gracefully', async () => {
    const edgeCaseData = {
      matches: {
        'edge_case_1': {
          preMatch: {
            match: {
              homeTeam: 'Team A',
              awayTeam: 'Team B',
              homeScore: null, // Edge case: null score
              awayScore: undefined, // Edge case: undefined score
              asianHandicapOdds: null // Edge case: null odds
            },
            fbref: {} // Edge case: empty fbref
          },
          timeSeries: null // Edge case: null timeSeries
        },
        'edge_case_2': {
          // Edge case: minimal data
          preMatch: {
            match: {
              homeTeam: 'Team C',
              awayTeam: 'Team D'
            }
          }
        }
      }
    };
    
    const dataFiles = ['edge-case-file.json'];
    
    const fileReader = async (filePath) => {
      return edgeCaseData;
    };
    
    const result = await DataLoader.loadEnhancedData(dataFiles, fileReader);
    
    expect(result).toHaveLength(2);
    
    // Should handle null/undefined values gracefully
    expect(result[0].preMatch.match.homeScore).toBeNull();
    expect(result[0].preMatch.match.awayScore).toBeUndefined();
    expect(result[0].timeSeries).toBeNull();
    
    // Should handle minimal data
    expect(result[1].preMatch.match.homeTeam).toBe('Team C');
    expect(result[1].preMatch.match.awayTeam).toBe('Team D');
  });
}); 