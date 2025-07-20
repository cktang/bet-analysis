import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LiveEnhancementService } from '../../live-trading/live-enhancement.service';
import { DATA_FILE_SERVICE } from '../../live-trading/tokens';
import * as fs from 'fs';
import * as path from 'path';

// Mock chokidar
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn()
  }))
}));

describe('LiveEnhancementService', () => {
  let service: LiveEnhancementService;
  let mockDataFileService: any;
  let mockConfigService: any;

  // Mock data
  const mockOddsData = {
    timestamp: Date.now(),
    matches: [
      {
        matchId: 'FB123',
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        handicap: -0.25,
        homeOdds: 1.95,
        awayOdds: 1.85,
        timestamp: Date.now(),
        source: 'hkjc'
      },
      {
        matchId: 'FB124',
        homeTeam: 'Manchester City',
        awayTeam: 'Chelsea',
        handicap: -0.5,
        homeOdds: 1.80,
        awayOdds: 2.00,
        timestamp: Date.now(),
        source: 'hkjc'
      }
    ],
    source: 'hkjc'
  };

  const mockHistoricalData = {
    '2023-2024': {
      metadata: {
        totalMatches: 2,
        season: '2023-2024'
      },
      matches: {
        '2023-24_Arsenal_v_Liverpool': {
          preMatch: {
            match: {
              eventId: 'FB001',
              date: '2023-08-15T15:00:00.000Z',
              homeTeam: 'Arsenal',
              awayTeam: 'Liverpool',
              asianHandicapOdds: {
                homeHandicap: '-0.25',
                homeOdds: 1.90,
                awayHandicap: '+0.25',
                awayOdds: 1.90
              }
            }
          },
          postMatch: {
            actualResults: {
              homeGoals: 2,
              awayGoals: 1
            }
          }
        },
        '2023-24_Manchester_City_v_Chelsea': {
          preMatch: {
            match: {
              eventId: 'FB002',
              date: '2023-08-20T17:00:00.000Z',
              homeTeam: 'Manchester City',
              awayTeam: 'Chelsea',
              asianHandicapOdds: {
                homeHandicap: '-0.5',
                homeOdds: 1.85,
                awayHandicap: '+0.5',
                awayOdds: 1.95
              }
            }
          },
          postMatch: {
            actualResults: {
              homeGoals: 3,
              awayGoals: 0
            }
          }
        }
      }
    }
  };

  beforeEach(async () => {
    // Mock DataFileService
    mockDataFileService = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      writeLog: jest.fn()
    };

    // Mock ConfigService
    mockConfigService = {
      get: jest.fn()
    };

    // Mock file system
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['year-2023-2024-enhanced.json']);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockHistoricalData['2023-2024']));
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveEnhancementService,
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

    service = module.get<LiveEnhancementService>(LiveEnhancementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should load historical data on module init', async () => {
      await service.onModuleInit();
      
      // Verify historical data was loaded
      expect(fs.readdirSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should handle missing historical data gracefully', async () => {
      jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
        throw new Error('Directory not found');
      });

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('Live Enhancement Processing', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should enhance current odds when called manually', async () => {
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await service.enhanceCurrentOdds();

      expect(mockDataFileService.readFile).toHaveBeenCalledWith('odds-data.json');
      expect(mockDataFileService.writeFile).toHaveBeenCalledWith(
        'enhanced-live-data.json',
        expect.objectContaining({
          metadata: expect.objectContaining({
            totalMatches: 2,
            source: 'live-odds-monitor'
          }),
          matches: expect.any(Object)
        })
      );
    });

    it('should skip enhancement when no odds data available', async () => {
      mockDataFileService.readFile.mockResolvedValue(null);

      await service.enhanceCurrentOdds();

      expect(mockDataFileService.writeFile).not.toHaveBeenCalled();
    });

    it('should skip enhancement when odds data has no matches', async () => {
      mockDataFileService.readFile.mockResolvedValue({ matches: [] });

      await service.enhanceCurrentOdds();

      expect(mockDataFileService.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('Match Enhancement', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should enhance a single match with complete analytics', async () => {
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await service.enhanceCurrentOdds();

      const writeCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      
      expect(writeCall).toBeDefined();
      const enhancedData = writeCall[1];
      
      // Check enhanced data structure
      expect(enhancedData).toMatchObject({
        metadata: expect.objectContaining({
          totalMatches: 2,
          matchesWithEnhancements: 2,
          source: 'live-odds-monitor'
        }),
        matches: expect.any(Object)
      });

      // Check individual match structure
      const matches = Object.values(enhancedData.matches);
      expect(matches).toHaveLength(2);
      
      const match = matches[0] as any;
      expect(match).toMatchObject({
        preMatch: {
          match: expect.objectContaining({
            homeTeam: expect.any(String),
            awayTeam: expect.any(String),
            asianHandicapOdds: expect.objectContaining({
              homeOdds: expect.any(Number),
              awayOdds: expect.any(Number)
            })
          }),
          enhanced: expect.any(Object),
          marketEfficiency: expect.objectContaining({
            ahHandicap: expect.any(Number),
            efficiency: expect.any(Object)
          })
        },
        postMatch: expect.any(Object),
        timeSeries: {
          home: expect.any(Object),
          away: expect.any(Object)
        }
      });
    });

    it('should calculate market efficiency metrics correctly', async () => {
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await service.enhanceCurrentOdds();

      const writeCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      
      const enhancedData = writeCall[1];
      const match = Object.values(enhancedData.matches)[0] as any;
      
      // Check market efficiency calculations
      expect(match.preMatch.marketEfficiency).toMatchObject({
        ahHandicap: expect.any(Number),
        efficiency: expect.objectContaining({
          ahCut: expect.any(Number),
          hadCut: expect.any(Number),
          ouCut: expect.any(Number)
        })
      });

      // Verify Asian handicap cut is reasonable (should be between 0-10%)
      const ahCut = match.preMatch.marketEfficiency.efficiency.ahCut;
      expect(ahCut).toBeGreaterThanOrEqual(0);
      expect(ahCut).toBeLessThan(15); // Reasonable bookmaker margin
    });

    it('should calculate timeline analytics from historical data', async () => {
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await service.enhanceCurrentOdds();

      const writeCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      
      const enhancedData = writeCall[1];
      const match = Object.values(enhancedData.matches)[0] as any;
      
      // Check timeline analytics structure
      expect(match.timeSeries.home).toMatchObject({
        currentForm: expect.objectContaining({
          winStreak: expect.any(Number),
          lossStreak: expect.any(Number)
        }),
        performance: expect.objectContaining({
          played: expect.any(Number),
          winRate: expect.any(Number),
          goalsPerGame: expect.any(Number)
        }),
        recentForm: expect.objectContaining({
          last5: expect.any(Array),
          last5WinRate: expect.any(Number)
        })
      });

      expect(match.timeSeries.away).toMatchObject({
        currentForm: expect.objectContaining({
          winStreak: expect.any(Number),
          lossStreak: expect.any(Number)
        }),
        performance: expect.objectContaining({
          played: expect.any(Number),
          winRate: expect.any(Number),
          goalsPerGame: expect.any(Number)
        })
      });
    });
  });

  describe('Data Format Compatibility', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should produce enhanced data compatible with historical format', async () => {
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await service.enhanceCurrentOdds();

      const writeCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      
      const enhancedData = writeCall[1];
      
      // Check metadata structure matches historical files
      expect(enhancedData.metadata).toMatchObject({
        totalMatches: expect.any(Number),
        matchesWithFBRef: expect.any(Number),
        matchesWithoutFBRef: expect.any(Number),
        matchesWithEnhancements: expect.any(Number),
        generatedAt: expect.any(String),
        structure: {
          preMatch: 'Predictive analysis available before match',
          postMatch: 'Result-dependent analysis only after match completion',
          timeSeries: 'Team streaks, patterns, and historical performance'
        }
      });

      // Check matches structure
      expect(enhancedData.matches).toBeDefined();
      expect(typeof enhancedData.matches).toBe('object');
      
      const matchKeys = Object.keys(enhancedData.matches);
      expect(matchKeys.length).toBeGreaterThan(0);
      
      // Check match key format
      matchKeys.forEach(key => {
        expect(key).toMatch(/^.+_v_.+$/); // Team1_v_Team2 format
      });
    });

    it('should handle handicap conversion correctly', async () => {
      const testData = {
        ...mockOddsData,
        matches: [
          { ...mockOddsData.matches[0], handicap: -0.25 },
          { ...mockOddsData.matches[1], handicap: -0.75 },
          { matchId: 'FB125', homeTeam: 'Team1', awayTeam: 'Team2', handicap: 0, homeOdds: 1.90, awayOdds: 1.90 }
        ]
      };

      mockDataFileService.readFile.mockResolvedValue(testData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await service.enhanceCurrentOdds();

      const writeCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      
      const enhancedData = writeCall[1];
      const matches = Object.values(enhancedData.matches) as any[];
      
      // Check handicap values are properly converted
      matches.forEach(match => {
        const handicap = match.preMatch.marketEfficiency.ahHandicap;
        expect(typeof handicap).toBe('number');
        expect(handicap).toBeGreaterThanOrEqual(-3);
        expect(handicap).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should handle file read errors gracefully', async () => {
      mockDataFileService.readFile.mockRejectedValue(new Error('File read error'));

      await expect(service.enhanceCurrentOdds()).resolves.not.toThrow();
    });

    it('should handle file write errors gracefully', async () => {
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockRejectedValue(new Error('File write error'));

      await expect(service.enhanceCurrentOdds()).resolves.not.toThrow();
    });

    it('should handle malformed odds data', async () => {
      const malformedData = {
        matches: [
          { homeTeam: 'Arsenal' }, // Missing required fields
          { homeOdds: 'invalid' }, // Invalid data types
          null // Null match
        ]
      };

      mockDataFileService.readFile.mockResolvedValue(malformedData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await expect(service.enhanceCurrentOdds()).resolves.not.toThrow();
    });

    it('should provide default team stats when historical data is missing', async () => {
      // Clear historical data
      jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      
      const newService = new LiveEnhancementService(mockConfigService, mockDataFileService);
      await newService.onModuleInit();
      
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await newService.enhanceCurrentOdds();

      const writeCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      
      const enhancedData = writeCall[1];
      const match = Object.values(enhancedData.matches)[0] as any;
      
      // Should have default stats
      expect(match.timeSeries.home.currentForm.winStreak).toBe(0);
      expect(match.timeSeries.home.performance.played).toBe(0);
      expect(match.timeSeries.away.currentForm.winStreak).toBe(0);
    });
  });

  describe('Public API', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return enhanced live data when available', async () => {
      const mockEnhancedData = { metadata: {}, matches: {} };
      mockDataFileService.readFile.mockResolvedValue(mockEnhancedData);

      const result = await service.getEnhancedLiveData();

      expect(result).toEqual(mockEnhancedData);
      expect(mockDataFileService.readFile).toHaveBeenCalledWith('enhanced-live-data.json');
    });

    it('should return null when enhanced live data is not available', async () => {
      mockDataFileService.readFile.mockRejectedValue(new Error('File not found'));

      const result = await service.getEnhancedLiveData();

      expect(result).toBeNull();
    });

    it('should trigger enhancement manually', async () => {
      mockDataFileService.readFile.mockResolvedValue(mockOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      await service.enhanceCurrentOdds();

      expect(mockDataFileService.readFile).toHaveBeenCalledWith('odds-data.json');
      expect(mockDataFileService.writeFile).toHaveBeenCalledWith(
        'enhanced-live-data.json',
        expect.any(Object)
      );
    });
  });

  describe('Performance and Memory', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeOddsData = {
        ...mockOddsData,
        matches: Array.from({ length: 100 }, (_, i) => ({
          matchId: `FB${i}`,
          homeTeam: `Team${i}A`,
          awayTeam: `Team${i}B`,
          handicap: (i % 4 - 2) * 0.25, // Vary handicaps
          homeOdds: 1.8 + (i % 5) * 0.1,
          awayOdds: 1.8 + ((i + 1) % 5) * 0.1,
          timestamp: Date.now(),
          source: 'hkjc'
        }))
      };

      mockDataFileService.readFile.mockResolvedValue(largeOddsData);
      mockDataFileService.writeFile.mockResolvedValue(undefined);

      const startTime = Date.now();
      await service.enhanceCurrentOdds();
      const endTime = Date.now();

      // Should complete within reasonable time (< 5 seconds for 100 matches)
      expect(endTime - startTime).toBeLessThan(5000);

      // Should process all matches
      const writeCall = mockDataFileService.writeFile.mock.calls.find(
        call => call[0] === 'enhanced-live-data.json'
      );
      const enhancedData = writeCall[1];
      expect(Object.keys(enhancedData.matches)).toHaveLength(100);
    });
  });
});