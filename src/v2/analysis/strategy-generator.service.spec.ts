import { Test, TestingModule } from '@nestjs/testing';
import { StrategyGeneratorService } from './strategy-generator.service';
import { DrillAnalysisService } from './drill-analysis.service';

describe('StrategyGeneratorService', () => {
  let service: StrategyGeneratorService;
  let drillAnalysisService: DrillAnalysisService;

  const mockFactorDefinitions = {
    side: {
      home: {
        expression: "true",
        description: "Bet on home team",
        betSide: "home"
      },
      away: {
        expression: "true", 
        description: "Bet on away team",
        betSide: "away"
      }
    },
    time: {
      midSeason: {
        expression: "fbref.week >= 9 && fbref.week <= 24",
        description: "weeks 9-24"
      },
      earlySeason: {
        expression: "fbref.week >= 1 && fbref.week <= 8", 
        description: "Early season weeks 1-8"
      }
    },
    context: {
      topSixHome: {
        expression: "fbref.week >= 6 && (timeSeries.home.leaguePosition || 20) <= 6",
        description: "Top 6 teams playing at home"
      }
    }
  };

  const mockBettingResults = {
    summary: {
      roi: 15.5,
      totalBets: 25,
      winRate: 60.0,
      totalProfit: 750.25,
      totalStake: 5000,
      totalPayout: 5750.25,
      wins: 15,
      losses: 8,
      pushes: 2
    },
    records: []
  };

  beforeEach(async () => {
    const mockDrillAnalysisService = {
      loadFactorDefinitions: jest.fn().mockResolvedValue(mockFactorDefinitions),
      analyzeStrategy: jest.fn().mockResolvedValue(mockBettingResults)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyGeneratorService,
        {
          provide: DrillAnalysisService,
          useValue: mockDrillAnalysisService
        }
      ],
    }).compile();

    service = module.get<StrategyGeneratorService>(StrategyGeneratorService);
    drillAnalysisService = module.get<DrillAnalysisService>(DrillAnalysisService);

    // Initialize the service
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSpecificStrategy', () => {
    it('should create a strategy with specific factors', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      const factorKeys = ['side.home', 'time.midSeason'];

      const strategy = await service.createSpecificStrategy(factorKeys, betSide, size);

      expect(strategy).toBeDefined();
      expect(strategy.factors).toHaveLength(2);
      expect(strategy.factors[0].category).toBe('side');
      expect(strategy.factors[0].key).toBe('home');
      expect(strategy.factors[1].category).toBe('time');
      expect(strategy.factors[1].key).toBe('midSeason');
      expect(strategy.betSide).toEqual(betSide);
      expect(strategy.size).toEqual(size);
      expect(strategy.performance).toEqual(mockBettingResults.summary);
      
      // Verify drillAnalysisService was called with correct factors
      expect(drillAnalysisService.analyzeStrategy).toHaveBeenCalledWith(
        strategy.factors,
        betSide,
        size
      );
    });

    it('should return null when invalid factor keys are provided', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      const factorKeys = ['invalid.factor', 'nonexistent.key'];

      const strategy = await service.createSpecificStrategy(factorKeys, betSide, size);

      expect(strategy).toBeNull();
    });

    it('should handle mixed valid and invalid factor keys', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      const factorKeys = ['side.home', 'invalid.factor', 'time.midSeason'];

      const strategy = await service.createSpecificStrategy(factorKeys, betSide, size);

      expect(strategy).toBeDefined();
      expect(strategy.factors).toHaveLength(2); // Only valid factors should be included
      expect(strategy.factors[0].key).toBe('home');
      expect(strategy.factors[1].key).toBe('midSeason');
    });

    it('should handle malformed factor keys gracefully', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      const factorKeys = ['side.home', 'invalidformat', 'time.midSeason'];

      const strategy = await service.createSpecificStrategy(factorKeys, betSide, size);

      expect(strategy).toBeDefined();
      expect(strategy.factors).toHaveLength(2); // Only properly formatted factors should be included
    });
  });

  describe('createRandomStrategy', () => {
    it('should create a random strategy with specified number of factors', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      const noOfFactors = 2;

      const strategy = await service.createRandomStrategy(betSide, size, noOfFactors);

      expect(strategy).toBeDefined();
      expect(strategy.factors).toHaveLength(noOfFactors);
      expect(strategy.betSide).toEqual(betSide);
      expect(strategy.size).toEqual(size);
      expect(strategy.performance).toEqual(mockBettingResults.summary);
      expect(strategy.matchCount).toBe(mockBettingResults.summary.totalBets);
      
      // Verify drillAnalysisService was called
      expect(drillAnalysisService.analyzeStrategy).toHaveBeenCalledWith(
        strategy.factors,
        betSide,
        size
      );
    });

    it('should return null when no factors are available', async () => {
      // Mock empty factor definitions
      jest.spyOn(drillAnalysisService, 'loadFactorDefinitions').mockResolvedValue({});
      
      // Reinitialize service to reload empty factors
      await service.onModuleInit();

      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      
      const strategy = await service.createRandomStrategy(betSide, size, 2);
      
      expect(strategy).toBeNull();
    });

    it('should limit number of factors to available factors when requested more than available', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      const noOfFactors = 100; // More than available

      const strategy = await service.createRandomStrategy(betSide, size, noOfFactors);

      expect(strategy).toBeDefined();
      // Should only select available factors (5 in our mock: 2 side + 2 time + 1 context)
      expect(strategy.factors.length).toBeLessThanOrEqual(5);
    });

    it('should select factors from different categories when possible', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      const noOfFactors = 3;

      const strategy = await service.createRandomStrategy(betSide, size, noOfFactors);

      expect(strategy).toBeDefined();
      expect(strategy.factors).toHaveLength(noOfFactors);
      
      // Check that factors come from different categories
      const categories = strategy.factors.map(f => f.category);
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories.size).toBe(noOfFactors); // Each factor should be from different category
    });
  });

  describe('generateRandomStrategies', () => {
    it('should generate multiple strategies and sort by ROI', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      
      // Mock different ROI values for each call
      const mockResults = [
        { ...mockBettingResults, summary: { ...mockBettingResults.summary, roi: 10.5 } },
        { ...mockBettingResults, summary: { ...mockBettingResults.summary, roi: 20.5 } },
        { ...mockBettingResults, summary: { ...mockBettingResults.summary, roi: 15.5 } }
      ];
      
      jest.spyOn(drillAnalysisService, 'analyzeStrategy')
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const strategies = await service.generateRandomStrategies(betSide, size, 2, 3, 10);

      expect(strategies).toHaveLength(3);
      
      // Should be sorted by ROI descending
      expect(strategies[0].performance.roi).toBe(20.5);
      expect(strategies[1].performance.roi).toBe(15.5);
      expect(strategies[2].performance.roi).toBe(10.5);
    });

    it('should filter out strategies with insufficient matches', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };
      
      // Mock results with insufficient matches
      const mockResultsLowMatches = {
        ...mockBettingResults,
        summary: { ...mockBettingResults.summary, totalBets: 5 }
      };
      
      jest.spyOn(drillAnalysisService, 'analyzeStrategy')
        .mockResolvedValue(mockResultsLowMatches);

      const strategies = await service.generateRandomStrategies(betSide, size, 2, 3, 15);

      expect(strategies).toHaveLength(0); // All strategies should be filtered out
    });
  });

  describe('getFactorSummary', () => {
    it('should return correct factor counts by category', () => {
      const summary = service.getFactorSummary();
      
      expect(summary).toEqual({
        side: 2,    // home, away
        time: 2,    // midSeason, earlySeason
        context: 1  // topSixHome
      });
    });
  });

  describe('getAllAvailableFactors', () => {
    it('should return all factors organized by category', () => {
      const factors = service.getAllAvailableFactors();
      
      expect(factors).toHaveProperty('side');
      expect(factors).toHaveProperty('time');
      expect(factors).toHaveProperty('context');
      
      expect(factors.side).toHaveLength(2);
      expect(factors.time).toHaveLength(2);
      expect(factors.context).toHaveLength(1);
      
      // Check format: should include category.key - description
      expect(factors.side[0]).toMatch(/^side\.\w+ - .+/);
      expect(factors.time[0]).toMatch(/^time\.\w+ - .+/);
      expect(factors.context[0]).toMatch(/^context\.\w+ - .+/);
    });
  });

  describe('factor selection', () => {
    it('should not select duplicate factors in same strategy', async () => {
      const betSide = { betSide: 'home', description: 'Bet on home team' };
      const size = { expression: '1500', description: '$1500', stakingMethod: 'fixed' };

      // Run multiple times to test randomness
      for (let i = 0; i < 5; i++) {
        const strategy = await service.createRandomStrategy(betSide, size, 3);
        
        expect(strategy).toBeDefined();
        
        if (!strategy) return; // TypeScript null check
        
        // Check no duplicate factors
        const factorKeys = strategy.factors.map(f => `${f.category}.${f.key}`);
        const uniqueKeys = new Set(factorKeys);
        expect(uniqueKeys.size).toBe(factorKeys.length);
      }
    });
  });
});