import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LiveEnhancementService } from '../../live-trading/live-enhancement.service';
import { BettingDecisionService } from '../../live-trading/betting-decision.service';
import { DATA_FILE_SERVICE } from '../../live-trading/tokens';
import * as fs from 'fs';
import * as path from 'path';

// Mock chokidar to prevent actual file watching during tests
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn()
  }))
}));

describe('Live Enhancement Integration', () => {
  let liveEnhancementService: LiveEnhancementService;
  let bettingDecisionService: BettingDecisionService;
  let mockDataFileService: any;
  let module: TestingModule;

  // Real-world test data
  const realOddsData = {
    timestamp: 1752937205791,
    matches: [
      {
        matchId: 'FB3491',
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        handicap: -0.25,
        homeOdds: 1.95,
        awayOdds: 1.85,
        timestamp: 1752937205791,
        source: 'hkjc'
      },
      {
        matchId: 'FB3492',
        homeTeam: 'Manchester City',
        awayTeam: 'Chelsea',
        handicap: -0.5,
        homeOdds: 1.80,
        awayOdds: 2.00,
        timestamp: 1752937205791,
        source: 'hkjc'
      }
    ],
    source: 'hkjc',
    totalMatches: 2
  };

  const realHistoricalData = {
    metadata: {
      totalMatches: 380,
      matchesWithFBRef: 106,
      season: '2022-2023'
    },
    matches: {
      '2022-23_Arsenal_v_Liverpool': {
        preMatch: {
          match: {
            eventId: 'FB2821',
            date: '2023-04-09T16:30:00.000Z',
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            asianHandicapOdds: {
              homeHandicap: '-0.25',
              homeOdds: 1.90,
              awayHandicap: '+0.25', 
              awayOdds: 1.90
            },
            homeWinOdds: 2.4,
            drawOdds: 3.3,
            awayWinOdds: 2.9
          }
        },
        postMatch: {
          actualResults: {
            homeGoals: 2,
            awayGoals: 2
          }
        }
      },
      '2022-23_Manchester_City_v_Chelsea': {
        preMatch: {
          match: {
            eventId: 'FB2654',
            date: '2023-01-05T20:30:00.000Z',
            homeTeam: 'Manchester City',
            awayTeam: 'Chelsea',
            asianHandicapOdds: {
              homeHandicap: '-1',
              homeOdds: 1.85,
              awayHandicap: '+1',
              awayOdds: 1.95
            },
            homeWinOdds: 1.4,
            drawOdds: 4.5,
            awayWinOdds: 7.0
          }
        },
        postMatch: {
          actualResults: {
            homeGoals: 1,
            awayGoals: 0
          }
        }
      }
    }
  };

  const realStrategies = [
    {
      name: 'Single_awayGoalDiff',
      factors: [
        {
          name: 'awayGoalDiff',
          expression: 'away.performance && away.performance.goalsPerGame > home.performance.goalsPerGame + 0.3'
        }
      ],
      side: {
        betSide: 'away'
      },
      size: {
        stakingMethod: 'fixed',
        expression: '100'
      }
    },
    {
      name: 'European_Pressure',
      factors: [
        {
          name: 'marketEfficiency',
          expression: 'hadCut > 8'
        },
        {
          name: 'homeForm',
          expression: 'home.currentForm && home.currentForm.winStreak >= 3'
        }
      ],
      side: {
        betSide: 'home'
      },
      size: {
        stakingMethod: 'fixed',
        expression: '150'
      }
    }
  ];

  beforeEach(async () => {
    // Mock DataFileService with realistic implementations
    mockDataFileService = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      writeLog: jest.fn(),
      getStrategies: jest.fn(),
      setBetDecisions: jest.fn()
    };

    // Mock file system for historical data loading
    jest.spyOn(fs, 'readdirSync').mockReturnValue([
      'year-2022-2023-enhanced.json',
      'year-2023-2024-enhanced.json'
    ]);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(realHistoricalData));
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    const mockConfigService = {
      get: jest.fn()
    };

    module = await Test.createTestingModule({
      providers: [
        LiveEnhancementService,
        BettingDecisionService,
        {
          provide: DATA_FILE_SERVICE,
          useValue: mockDataFileService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    liveEnhancementService = module.get<LiveEnhancementService>(LiveEnhancementService);
    bettingDecisionService = module.get<BettingDecisionService>(BettingDecisionService);
  });

  afterEach(async () => {
    await module.close();
    jest.clearAllMocks();
  });

  describe('Complete Live Data Flow', () => {
    it('should process complete flow from odds to betting decisions', async () => {
      // Setup mocks
      mockDataFileService.readFile
        .mockResolvedValueOnce(realOddsData) // For enhancement service
        .mockResolvedValueOnce({ // For enhanced live data
          metadata: { totalMatches: 2 },
          matches: {}
        });
      
      mockDataFileService.getStrategies.mockResolvedValue(realStrategies);
      mockDataFileService.writeFile.mockResolvedValue(undefined);
      mockDataFileService.setBetDecisions.mockResolvedValue(undefined);

      // Initialize services
      await liveEnhancementService.onModuleInit();
      
      // Step 1: Enhance live odds
      await liveEnhancementService.enhanceCurrentOdds();

      // Verify enhancement was called
      expect(mockDataFileService.readFile).toHaveBeenCalledWith('odds-data.json');
      expect(mockDataFileService.writeFile).toHaveBeenCalledWith(
        'enhanced-live-data.json',
        expect.objectContaining({
          metadata: expect.any(Object),
          matches: expect.any(Object)
        })
      );

      // Get the enhanced data that was written
      const enhancedWriteCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      const enhancedData = enhancedWriteCall[1];

      // Step 2: Verify enhanced data structure
      expect(enhancedData).toMatchObject({
        metadata: {
          totalMatches: 2,
          source: 'live-odds-monitor'
        },
        matches: expect.any(Object)
      });

      // Step 3: Verify matches have complete analytics
      const matches = Object.values(enhancedData.matches) as any[];
      expect(matches).toHaveLength(2);

      matches.forEach(match => {
        expect(match).toMatchObject({
          preMatch: {
            match: expect.objectContaining({
              homeTeam: expect.any(String),
              awayTeam: expect.any(String),
              asianHandicapOdds: expect.any(Object)
            }),
            enhanced: expect.any(Object),
            marketEfficiency: expect.any(Object)
          },
          timeSeries: {
            home: expect.any(Object),
            away: expect.any(Object)
          }
        });
      });
    });

    it('should generate betting decisions from enhanced live data', async () => {
      // Create enhanced data that should trigger betting decisions
      const enhancedLiveData = {
        metadata: { totalMatches: 1 },
        matches: {
          'Arsenal_v_Liverpool': {
            preMatch: {
              match: {
                eventId: 'FB3491',
                homeTeam: 'Arsenal',
                awayTeam: 'Liverpool',
                date: new Date().toISOString(),
                asianHandicapOdds: {
                  homeOdds: 1.95,
                  awayOdds: 1.85,
                  homeHandicap: '-0.25',
                  awayHandicap: '+0.25'
                }
              },
              enhanced: {
                homeImpliedProb: 51.3,
                awayImpliedProb: 54.1,
                hadCut: 8.5 // Triggers European_Pressure strategy
              },
              marketEfficiency: {
                ahHandicap: -0.25,
                efficiency: {
                  ahCut: 2.6,
                  hadCut: 8.5
                }
              }
            },
            timeSeries: {
              home: {
                currentForm: {
                  winStreak: 3, // Triggers European_Pressure strategy
                  lossStreak: 0
                },
                performance: {
                  played: 25,
                  winRate: 68,
                  goalsPerGame: 2.1
                }
              },
              away: {
                currentForm: {
                  winStreak: 1,
                  lossStreak: 0
                },
                performance: {
                  played: 25,
                  winRate: 72,
                  goalsPerGame: 2.5 // Triggers Single_awayGoalDiff strategy
                }
              }
            }
          }
        }
      };

      // Setup mocks for betting decision service
      mockDataFileService.getStrategies.mockResolvedValue(realStrategies);
      liveEnhancementService.getEnhancedLiveData = jest.fn().mockResolvedValue(enhancedLiveData);
      mockDataFileService.setBetDecisions.mockResolvedValue(undefined);

      // Manually call the decision process (simulating file change trigger)
      await (bettingDecisionService as any).processOddsUpdate();

      // Verify betting decisions were generated
      expect(mockDataFileService.setBetDecisions).toHaveBeenCalled();
      
      const decisions = mockDataFileService.setBetDecisions.mock.calls[0][0];
      expect(decisions).toBeInstanceOf(Array);
      expect(decisions.length).toBeGreaterThan(0);

      // Verify decision structure
      decisions.forEach((decision: any) => {
        expect(decision).toMatchObject({
          id: expect.stringMatching(/^decision_\d+_[a-z0-9]+$/),
          matchId: 'FB3491',
          homeTeam: 'Arsenal',
          awayTeam: 'Liverpool',
          strategyName: expect.any(String),
          betSide: expect.stringMatching(/^(home|away)$/),
          stake: expect.any(Number),
          odds: expect.any(Number),
          handicap: expect.any(Number),
          timestamp: expect.any(String),
          source: 'enhanced-live-data'
        });
      });
    });

    it('should handle timeline analytics correctly for known teams', async () => {
      mockDataFileService.readFile.mockResolvedValue(realOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await liveEnhancementService.onModuleInit();
      await liveEnhancementService.enhanceCurrentOdds();

      const enhancedWriteCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      const enhancedData = enhancedWriteCall[1];
      const arsenalMatch = Object.values(enhancedData.matches).find(
        (match: any) => match.preMatch.match.homeTeam === 'Arsenal'
      ) as any;

      // Verify timeline data was calculated from historical matches
      expect(arsenalMatch.timeSeries.home).toMatchObject({
        currentForm: expect.objectContaining({
          winStreak: expect.any(Number),
          lossStreak: expect.any(Number)
        }),
        performance: expect.objectContaining({
          played: expect.any(Number),
          winRate: expect.any(Number)
        })
      });

      // Arsenal should have some historical data since it's in our mock
      expect(arsenalMatch.timeSeries.home.performance.played).toBeGreaterThan(0);
    });

    it('should maintain data consistency across multiple enhancements', async () => {
      mockDataFileService.readFile.mockResolvedValue(realOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await liveEnhancementService.onModuleInit();

      // Run enhancement twice
      await liveEnhancementService.enhanceCurrentOdds();
      await liveEnhancementService.enhanceCurrentOdds();

      // Should have been called twice
      expect(mockDataFileService.writeFile).toHaveBeenCalledTimes(2);

      // Both calls should have the same structure
      const call1 = mockDataFileService.writeFile.mock.calls[0][1];
      const call2 = mockDataFileService.writeFile.mock.calls[1][1];

      expect(call1.metadata.totalMatches).toBe(call2.metadata.totalMatches);
      expect(Object.keys(call1.matches)).toEqual(Object.keys(call2.matches));
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial data gracefully', async () => {
      const partialOddsData = {
        timestamp: Date.now(),
        matches: [
          {
            matchId: 'FB123',
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            // Missing handicap and odds
            timestamp: Date.now(),
            source: 'hkjc'
          }
        ],
        source: 'hkjc'
      };

      mockDataFileService.readFile.mockResolvedValue(partialOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await liveEnhancementService.onModuleInit();
      await expect(liveEnhancementService.enhanceCurrentOdds()).resolves.not.toThrow();

      // Should still write some data, even if incomplete
      expect(mockDataFileService.writeFile).toHaveBeenCalled();
    });

    it('should recover from enhancement failures', async () => {
      mockDataFileService.readFile
        .mockRejectedValueOnce(new Error('File read error'))
        .mockResolvedValueOnce(realOddsData);
      
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await liveEnhancementService.onModuleInit();

      // First call should fail gracefully
      await expect(liveEnhancementService.enhanceCurrentOdds()).resolves.not.toThrow();

      // Second call should succeed
      await expect(liveEnhancementService.enhanceCurrentOdds()).resolves.not.toThrow();
      
      expect(mockDataFileService.writeFile).toHaveBeenCalledWith(
        'enhanced-live-data.json',
        expect.any(Object)
      );
    });

    it('should handle missing historical data for new teams', async () => {
      const newTeamsOddsData = {
        ...realOddsData,
        matches: [
          {
            matchId: 'FB999',
            homeTeam: 'NewTeam1',
            awayTeam: 'NewTeam2',
            handicap: 0,
            homeOdds: 1.90,
            awayOdds: 1.90,
            timestamp: Date.now(),
            source: 'hkjc'
          }
        ]
      };

      mockDataFileService.readFile.mockResolvedValue(newTeamsOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await liveEnhancementService.onModuleInit();
      await liveEnhancementService.enhanceCurrentOdds();

      const enhancedWriteCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      const enhancedData = enhancedWriteCall[1];
      const newTeamMatch = Object.values(enhancedData.matches)[0] as any;

      // Should have default stats for new teams
      expect(newTeamMatch.timeSeries.home.performance.played).toBe(0);
      expect(newTeamMatch.timeSeries.away.performance.played).toBe(0);
      expect(newTeamMatch.timeSeries.home.currentForm.winStreak).toBe(0);
    });
  });

  describe('Performance Validation', () => {
    it('should process enhancements within reasonable time', async () => {
      const largeOddsData = {
        ...realOddsData,
        matches: Array.from({ length: 50 }, (_, i) => ({
          matchId: `FB${i}`,
          homeTeam: `Team${i}A`,
          awayTeam: `Team${i}B`,
          handicap: (i % 4 - 2) * 0.25,
          homeOdds: 1.8 + (i % 5) * 0.1,
          awayOdds: 1.8 + ((i + 1) % 5) * 0.1,
          timestamp: Date.now(),
          source: 'hkjc'
        }))
      };

      mockDataFileService.readFile.mockResolvedValue(largeOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await liveEnhancementService.onModuleInit();

      const startTime = Date.now();
      await liveEnhancementService.enhanceCurrentOdds();
      const endTime = Date.now();

      // Should complete within 3 seconds for 50 matches
      expect(endTime - startTime).toBeLessThan(3000);

      // Should process all matches
      const enhancedWriteCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      const enhancedData = enhancedWriteCall[1];
      expect(Object.keys(enhancedData.matches)).toHaveLength(50);
    });

    it('should have consistent calculation results', async () => {
      mockDataFileService.readFile.mockResolvedValue(realOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await liveEnhancementService.onModuleInit();

      // Run enhancement multiple times
      const results = [];
      for (let i = 0; i < 3; i++) {
        await liveEnhancementService.enhanceCurrentOdds();
        const writeCall = mockDataFileService.writeFile.mock.calls[i];
        results.push(writeCall[1]);
      }

      // Results should be consistent (same calculations each time)
      const firstMatch1 = Object.values(results[0].matches)[0] as any;
      const firstMatch2 = Object.values(results[1].matches)[0] as any;
      const firstMatch3 = Object.values(results[2].matches)[0] as any;

      expect(firstMatch1.preMatch.marketEfficiency.ahHandicap)
        .toBe(firstMatch2.preMatch.marketEfficiency.ahHandicap);
      expect(firstMatch2.preMatch.marketEfficiency.ahHandicap)
        .toBe(firstMatch3.preMatch.marketEfficiency.ahHandicap);

      expect(firstMatch1.timeSeries.home.performance.played)
        .toBe(firstMatch2.timeSeries.home.performance.played);
    });
  });
});