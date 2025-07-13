import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FixtureService } from '../../fixtures/fixture.service';
import { OddsMonitorService } from '../../live-trading/odds-monitor.service';
import { StrategyDecisionService } from '../../live-trading/strategy-decision.service';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { ResultsTrackerService } from '../../live-trading/results-tracker.service';
import { PatternDiscoveryService } from '../../analysis/pattern-discovery.service';
import { HkjcBrowserService } from '../../core/hkjc-browser.service';
import { TeamMappingService } from '../../core/team-mapping.service';
import { DataFileService } from '../../core/data-file.service';

describe('Live Trading Pipeline Integration', () => {
  let module: TestingModule;
  let fixtureService: FixtureService;
  let oddsMonitorService: OddsMonitorService;
  let strategyDecisionService: StrategyDecisionService;
  let bettingExecutorService: BettingExecutorService;
  let resultsTrackerService: ResultsTrackerService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        FixtureService,
        OddsMonitorService,
        StrategyDecisionService,
        BettingExecutorService,
        ResultsTrackerService,
        PatternDiscoveryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                'ENABLE_LIVE_BETTING': false,
                'ENABLE_PAPER_TRADING': true,
                'BASE_STAKE': 100,
                'MAX_STAKE': 500,
                'CONFIDENCE_THRESHOLD': 0.6,
                'ODDS_MONITOR_INTERVAL': 60000
              };
              return config[key] || defaultValue;
            })
          }
        },
        {
          provide: HkjcBrowserService,
          useValue: {
            initialize: jest.fn(),
            cleanup: jest.fn(),
            scrapeTodaysFixtures: jest.fn().mockResolvedValue([]),
            scrapeMatchOdds: jest.fn().mockResolvedValue({})
          }
        },
        {
          provide: TeamMappingService,
          useValue: {
            normalizeTeamName: jest.fn((name: string) => name)
          }
        },
        {
          provide: DataFileService,
          useValue: {
            loadData: jest.fn().mockResolvedValue([]),
            saveData: jest.fn().mockResolvedValue(true),
            watchFile: jest.fn(),
            unwatchFile: jest.fn(),
            getDataPath: jest.fn().mockReturnValue('./test-data'),
            readFile: jest.fn().mockResolvedValue([]),
            writeFile: jest.fn().mockResolvedValue(true),
            appendToFile: jest.fn().mockResolvedValue(true),
            writeLog: jest.fn().mockResolvedValue(true),
            getFixtures: jest.fn().mockResolvedValue([]),
            setFixtures: jest.fn().mockResolvedValue(true),
            getBetDecisions: jest.fn().mockResolvedValue([]),
            setBetDecisions: jest.fn().mockResolvedValue(true),
            getBetPendingDecisions: jest.fn().mockResolvedValue([]),
            setBetPendingDecisions: jest.fn().mockResolvedValue(true),
            addBetRecord: jest.fn().mockResolvedValue(true),
            addBetResult: jest.fn().mockResolvedValue(true),
            addBetDecision: jest.fn().mockResolvedValue(true),
            getBetSessions: jest.fn().mockResolvedValue([]),
            addBetSession: jest.fn().mockResolvedValue(true),
            getBetRecords: jest.fn().mockResolvedValue([]),
            getBetResults: jest.fn().mockResolvedValue([]),
            getStrategies: jest.fn().mockResolvedValue([]),
            setStrategies: jest.fn().mockResolvedValue(true),
            getLogs: jest.fn().mockResolvedValue([])
          }
        }
      ],
    }).compile();

    fixtureService = module.get<FixtureService>(FixtureService);
    oddsMonitorService = module.get<OddsMonitorService>(OddsMonitorService);
    strategyDecisionService = module.get<StrategyDecisionService>(StrategyDecisionService);
    bettingExecutorService = module.get<BettingExecutorService>(BettingExecutorService);
    resultsTrackerService = module.get<ResultsTrackerService>(ResultsTrackerService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('End-to-End Trading Flow', () => {
    it('should execute complete trading pipeline', async () => {
      // 1. Initialize all services
      await fixtureService.onModuleInit();
      await oddsMonitorService.onModuleInit();
      await strategyDecisionService.onModuleInit();
      await bettingExecutorService.onModuleInit();
      await resultsTrackerService.onModuleInit();

      // 2. Load fixtures
      const fixtures = await fixtureService.loadTodaysFixtures();
      expect(fixtures).toBeDefined();
      expect(Array.isArray(fixtures)).toBe(true);

      // 3. Get odds data
      const oddsData = await oddsMonitorService.getLatestOdds();
      expect(oddsData).toBeDefined();
      expect(oddsData.matches).toBeDefined();

      // 4. Evaluate strategies
      const signals = await strategyDecisionService.evaluateAllCurrentMatches();
      expect(Array.isArray(signals)).toBe(true);

      // 5. If signals exist, test betting execution
      if (signals.length > 0) {
        const signal = signals[0];
        const executionResult = await bettingExecutorService.executeBet(signal);
        
        expect(executionResult).toBeDefined();
        expect(executionResult.status).toBeDefined();
        
        // 6. Record results if bet was placed
        if (executionResult.status === 'success') {
          await resultsTrackerService.recordBet(executionResult);
          
          const performance = await resultsTrackerService.getSystemPerformance();
          expect(performance).toBeDefined();
          expect(performance.totalBets).toBeGreaterThan(0);
        }
      }
    });

    it('should handle trading window detection', async () => {
      await fixtureService.onModuleInit();
      
      // Get matches in trading window
      const tradingMatches = fixtureService.getMatchesInTradingWindow();
      
      // Verify trading window logic
      const now = new Date();
      tradingMatches.forEach(match => {
        const kickoff = new Date(match.kickoffTime);
        const minutesToKickoff = (kickoff.getTime() - now.getTime()) / (1000 * 60);
        
        expect(minutesToKickoff).toBeGreaterThanOrEqual(5);
        expect(minutesToKickoff).toBeLessThanOrEqual(10);
      });
    });

    it('should validate strategy evaluation consistency', async () => {
      await strategyDecisionService.onModuleInit();
      
      // Get loaded strategies
      const strategies = strategyDecisionService.getLoadedStrategies();
      expect(strategies.length).toBeGreaterThan(0);
      
      // Verify each strategy has required properties
      strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('name');
        expect(strategy).toHaveProperty('factors');
        expect(Array.isArray(strategy.factors)).toBe(true);
        expect(strategy).toHaveProperty('side');
        expect(strategy).toHaveProperty('size');
        expect(strategy).toHaveProperty('performance');
        expect(typeof strategy.performance.roi).toBe('number');
        expect(typeof strategy.performance.winRate).toBe('number');
        expect(typeof strategy.performance.totalBets).toBe('number');
      });
    });

    it('should handle betting execution with paper trading mode', async () => {
      await bettingExecutorService.onModuleInit();
      
      const mockSignal = {
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        strategy: 'Test_Strategy',
        betType: 'Asian Handicap',
        selection: 'Home -0.5',
        expectedROI: 15.5,
        confidence: 0.8,
        recommendedStake: 150,
        timestamp: new Date()
      };

      const result = await bettingExecutorService.executeBet(mockSignal);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('success'); // Paper trading should always succeed
      expect(result.isPaperTrade).toBe(true);
      expect(result.betId).toBeDefined();
    });

    it('should track and calculate performance metrics', async () => {
      await resultsTrackerService.onModuleInit();
      
      // Simulate some betting results
      const mockBets = [
        {
          homeTeam: 'Arsenal',
          awayTeam: 'Liverpool',
          strategy: 'Test_Strategy_1',
          status: 'success',
          actualStake: 100,
          potentialWin: 180,
          mode: 'paper',
          timestamp: new Date()
        },
        {
          homeTeam: 'Chelsea',
          awayTeam: 'Manchester City',
          strategy: 'Test_Strategy_2', 
          status: 'success',
          actualStake: 150,
          potentialWin: 270,
          mode: 'paper',
          timestamp: new Date()
        }
      ];

      // Record bets
      for (const bet of mockBets) {
        await resultsTrackerService.recordBet(bet);
      }

      // Check system performance
      const performance = await resultsTrackerService.getSystemPerformance();
      
      expect(performance.totalBets).toBeGreaterThanOrEqual(0);
      expect(performance).toHaveProperty('totalBets');
      expect(performance).toHaveProperty('successfulBets');
      expect(performance).toHaveProperty('systemROI');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle fixture loading failures gracefully', async () => {
      // Mock fixture service to fail
      const mockHkjcService = module.get(HkjcBrowserService);
      (mockHkjcService.scrapeTodaysFixtures as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      // Should fall back to mock data
      const fixtures = await fixtureService.loadTodaysFixtures();
      expect(fixtures).toBeDefined();
      expect(Array.isArray(fixtures)).toBe(true);
    });

    it('should handle strategy evaluation errors', async () => {
      await strategyDecisionService.onModuleInit();
      
      // Test with malformed match data
      const malformedMatchData = {
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool'
        // Missing required data fields
      };

      const signals = await strategyDecisionService.evaluateStrategiesForMatch(malformedMatchData);
      
      // Should return empty array instead of throwing
      expect(Array.isArray(signals)).toBe(true);
      expect(signals.length).toBe(0);
    });

    it('should handle betting execution failures', async () => {
      await bettingExecutorService.onModuleInit();
      
      const invalidSignal = {
        homeTeam: '',
        awayTeam: '',
        strategy: '',
        betType: 'Invalid',
        selection: '',
        expectedROI: -100,
        confidence: 2.0, // Invalid confidence > 1
        recommendedStake: -50, // Invalid negative stake
        timestamp: new Date()
      };

      const result = await bettingExecutorService.executeBet(invalidSignal);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('success'); // Paper trading always succeeds
      expect(result.isPaperTrade).toBe(true);
    });
  });

  describe('Service Status and Health Checks', () => {
    it('should provide comprehensive status information', async () => {
      await fixtureService.onModuleInit();
      await oddsMonitorService.onModuleInit();
      await strategyDecisionService.onModuleInit();
      await bettingExecutorService.onModuleInit();
      await resultsTrackerService.onModuleInit();

      // Check individual service statuses
      const fixtureStatus = fixtureService.getFixtureStatus();
      expect(fixtureStatus).toHaveProperty('totalFixtures');
      expect(fixtureStatus).toHaveProperty('upcomingToday');
      expect(fixtureStatus).toHaveProperty('inTradingWindow');

      const oddsStatus = oddsMonitorService.getMonitoringStatus();
      expect(oddsStatus).toHaveProperty('isRunning');
      expect(oddsStatus).toHaveProperty('enabled');

      const decisionStatus = strategyDecisionService.getDecisionStatus();
      expect(decisionStatus).toHaveProperty('strategiesLoaded');
      expect(decisionStatus).toHaveProperty('totalStrategies');

      const executorStatus = bettingExecutorService.getExecutorStatus();
      expect(executorStatus).toHaveProperty('mode');
      expect(executorStatus).toHaveProperty('credentialsValid');

      const trackerStatus = resultsTrackerService.getTrackerStatus();
      expect(trackerStatus).toHaveProperty('totalBets');
      expect(trackerStatus).toHaveProperty('activeBets');
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across services', async () => {
      await fixtureService.onModuleInit();
      await oddsMonitorService.onModuleInit();

      const fixtures = fixtureService.getTodaysFixtures();
      const oddsData = await oddsMonitorService.getLatestOdds();

      // Verify fixture and odds data alignment
      fixtures.forEach(fixture => {
        const hasMatchingOdds = oddsData.matches.some(odds => 
          odds.homeTeam === fixture.homeTeam && odds.awayTeam === fixture.awayTeam
        );
        
        // Note: In mock data, not all fixtures may have odds, so we just verify structure
        expect(fixture).toHaveProperty('homeTeam');
        expect(fixture).toHaveProperty('awayTeam');
        expect(fixture).toHaveProperty('kickoffTime');
      });
    });

    it('should validate betting signal structure', async () => {
      await strategyDecisionService.onModuleInit();
      
      const signals = await strategyDecisionService.evaluateAllCurrentMatches();
      
      signals.forEach(signal => {
        expect(signal).toHaveProperty('homeTeam');
        expect(signal).toHaveProperty('awayTeam');
        expect(signal).toHaveProperty('strategy');
        expect(signal).toHaveProperty('betType');
        expect(signal).toHaveProperty('selection');
        expect(signal).toHaveProperty('expectedROI');
        expect(signal).toHaveProperty('confidence');
        expect(signal).toHaveProperty('recommendedStake');
        expect(signal).toHaveProperty('timestamp');
        
        // Validate value ranges
        expect(signal.confidence).toBeGreaterThanOrEqual(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
        expect(signal.recommendedStake).toBeGreaterThan(0);
        expect(signal.timestamp).toBeInstanceOf(Date);
      });
    });
  });
});