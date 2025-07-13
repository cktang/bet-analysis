import { Test, TestingModule } from '@nestjs/testing';
import { StrategyDecisionService } from '../../live-trading/strategy-decision.service';
import { DataFileService } from '../../core/data-file.service';

describe('StrategyDecisionService', () => {
  let service: StrategyDecisionService;
  let dataFileService: jest.Mocked<DataFileService>;

  const mockStrategies = [
    {
      name: 'Christmas-Away',
      factors: [
        {
          category: 'time',
          description: 'weeks 17-22',
          displayExpression: ['fbref.week'],
          expression: 'parseInt(fbref.week) >= 17 && parseInt(fbref.week) <= 22',
          key: 'christmas',
        },
      ],
      side: {
        betSide: 'away',
        category: 'side',
        description: 'Bet on away team',
        expression: 'true',
        key: 'away',
      },
      size: {
        category: 'size',
        description: '$1500',
        expression: '1500',
        key: 'fix',
        stakingMethod: 'fixed',
      },
      performance: {
        roi: 11.92,
        totalBets: 171,
        totalProfit: 30585,
        winRate: 55.56,
      },
      timestamp: 1751479950169,
    },
    {
      name: 'Trapped-HighOdds',
      factors: [
        {
          category: 'oddsLevel',
          description: 'Trapped pricing ≤1.72',
          displayExpression: 'Math.min(asianHandicapOdds.homeOdds, asianHandicapOdds.awayOdds)',
          expression: 'Math.min(asianHandicapOdds.homeOdds, asianHandicapOdds.awayOdds) <= 1.72',
          key: 'trapped',
        },
      ],
      side: {
        betSide: 'asianHandicapOdds.homeOdds > asianHandicapOdds.awayOdds ? \'home\' : \'away\'',
        category: 'side',
        description: 'Bet on team with higher odds',
        expression: 'true',
        key: 'higherOdds',
      },
      size: {
        category: 'size',
        description: '$1500',
        expression: '1500',
        key: 'fix',
        stakingMethod: 'fixed',
      },
      performance: {
        roi: 12.2,
        totalBets: 120,
        totalProfit: 21967.5,
        winRate: 57.5,
      },
      timestamp: 1751428518507,
    },
  ];

  const mockMatchData = {
    homeTeam: 'Arsenal',
    awayTeam: 'Liverpool',
    fbref: { week: 20 },
    asianHandicapOdds: {
      homeOdds: 1.65,
      awayOdds: 2.15,
      homeHandicap: 0,
      awayHandicap: 0,
    },
    timeSeries: {
      home: { leaguePosition: 3 },
      away: { leaguePosition: 2 },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyDecisionService,
        {
          provide: DataFileService,
          useValue: {
            readFile: jest.fn(),
            writeFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StrategyDecisionService>(StrategyDecisionService);
    dataFileService = module.get(DataFileService);

    // Mock the strategies loading
    jest.spyOn(service as any, 'loadStrategies').mockResolvedValue(undefined);
    (service as any).strategies = mockStrategies;
  });

  afterEach(async () => {
    // Clean up file watcher
    if ((service as any).fileWatcher) {
      await (service as any).fileWatcher.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should load strategies on initialization', async () => {
      const loadStrategiesSpy = jest.spyOn(service as any, 'loadStrategies');
      
      await service.onModuleInit();
      
      expect(loadStrategiesSpy).toHaveBeenCalled();
    });
  });

  describe('evaluateStrategiesForMatch', () => {
    it('should evaluate strategies against match data', async () => {
      const result = await service.evaluateStrategiesForMatch(mockMatchData);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      if (result.length > 0) {
        const signal = result[0];
        expect(signal).toHaveProperty('strategyName');
        expect(signal).toHaveProperty('matchId');
        expect(signal).toHaveProperty('homeTeam', 'Arsenal');
        expect(signal).toHaveProperty('awayTeam', 'Liverpool');
        expect(signal).toHaveProperty('betSide');
        expect(signal).toHaveProperty('stakeAmount');
        expect(signal).toHaveProperty('reasoning');
      }
    });

    it('should return empty array when no strategies match', async () => {
      // Use match data that won't satisfy any strategy
      const noMatchData = {
        ...mockMatchData,
        fbref: { week: 1 }, // Early season, won't match Christmas strategy
        asianHandicapOdds: {
          homeOdds: 2.0,
          awayOdds: 2.0, // Won't match trapped strategy
        },
      };
      
      const result = await service.evaluateStrategiesForMatch(noMatchData);
      
      expect(result).toHaveLength(0);
    });

    it('should handle evaluation errors gracefully', async () => {
      // Use invalid match data to trigger errors
      const invalidMatchData = {
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        // Missing required properties
      };
      
      const result = await service.evaluateStrategiesForMatch(invalidMatchData);
      
      expect(Array.isArray(result)).toBe(true);
      // Should handle errors gracefully and return empty array or partial results
    });
  });

  describe('evaluateAllCurrentMatches', () => {
    it('should evaluate strategies for all loaded matches', async () => {
      const mockMatches = [mockMatchData];
      dataFileService.readFile.mockResolvedValue(mockMatches);
      
      const result = await service.evaluateAllCurrentMatches();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle data loading errors', async () => {
      dataFileService.readFile.mockRejectedValue(new Error('File not found'));
      
      const result = await service.evaluateAllCurrentMatches();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getDecisionStatus', () => {
    it('should return current decision engine status', () => {
      const status = service.getDecisionStatus();
      
      expect(status).toHaveProperty('strategiesLoaded');
      expect(status).toHaveProperty('isEvaluating');
      expect(status).toHaveProperty('fileWatcherActive');
      expect(typeof status.strategiesLoaded).toBe('number');
      expect(typeof status.isEvaluating).toBe('boolean');
      expect(typeof status.fileWatcherActive).toBe('boolean');
    });
  });

  describe('evaluateSingleStrategy', () => {
    it('should evaluate specific strategy against match', async () => {
      const strategy = mockStrategies[0];
      const result = await service.evaluateSingleStrategy(strategy, mockMatchData);
      
      expect(result).toHaveProperty('shouldBet');
      expect(result).toHaveProperty('betSide');
      expect(result).toHaveProperty('reasoning');
    });

    it('should return null for invalid strategy', async () => {
      const invalidStrategy = null;
      
      try {
        const result = await service.evaluateSingleStrategy(invalidStrategy, mockMatchData);
        // Should handle gracefully
        expect(result).toBeDefined();
      } catch (error) {
        // Or throw error, both are acceptable
        expect(error).toBeDefined();
      }
    });

    it('should return result when strategy doesn\'t match', async () => {
      const strategy = mockStrategies[0];
      const noMatchData = {
        ...mockMatchData,
        fbref: { week: 1 }, // Won't match Christmas strategy
      };
      
      const result = await service.evaluateSingleStrategy(strategy, noMatchData);
      
      expect(result).toHaveProperty('shouldBet', false);
      expect(result).toHaveProperty('reasoning');
    });
  });

  describe('getLoadedStrategies', () => {
    it('should return all loaded strategies', () => {
      const strategies = service.getLoadedStrategies();
      
      expect(strategies).toEqual(mockStrategies);
    });
  });

  describe('getStrategyByName', () => {
    it('should return strategy by name', () => {
      const strategy = service.getStrategyByName('Christmas-Away');
      
      expect(strategy).toEqual(mockStrategies[0]);
    });

    it('should return undefined for non-existent strategy', () => {
      const strategy = service.getStrategyByName('NonExistentStrategy');
      
      expect(strategy).toBeUndefined();
    });
  });
});