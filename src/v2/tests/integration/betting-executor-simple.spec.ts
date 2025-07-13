import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { DataFileService } from '../../core/data-file.service';

describe('BettingExecutorService Simple Integration Tests', () => {
  let service: BettingExecutorService;

  // Simple mock configuration
  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'ENABLE_LIVE_BETTING': false,
        'ENABLE_PAPER_TRADING': true,
        'HEADLESS_BROWSER': true,
        'baseStake': 10,
        'maxStake': 100,
        'confidenceThreshold': 0.6
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockDataFileService = {
    readFile: jest.fn().mockResolvedValue([]),
    writeFile: jest.fn().mockResolvedValue(undefined),
    appendToFile: jest.fn().mockResolvedValue(undefined),
    writeLog: jest.fn().mockResolvedValue(undefined),
    getFixtures: jest.fn().mockResolvedValue([]),
    setFixtures: jest.fn().mockResolvedValue(undefined),
    getBetDecisions: jest.fn().mockResolvedValue([]),
    setBetDecisions: jest.fn().mockResolvedValue(undefined),
    getBetPendingDecisions: jest.fn().mockResolvedValue([]),
    setBetPendingDecisions: jest.fn().mockResolvedValue(undefined),
    addBetRecord: jest.fn().mockResolvedValue(undefined),
    addBetResult: jest.fn().mockResolvedValue(undefined),
    addBetDecision: jest.fn().mockResolvedValue(undefined),
    getBetSessions: jest.fn().mockResolvedValue([]),
    addBetSession: jest.fn().mockResolvedValue(undefined),
    getBetRecords: jest.fn().mockResolvedValue([]),
    getBetResults: jest.fn().mockResolvedValue([]),
    getStrategies: jest.fn().mockResolvedValue([]),
    setStrategies: jest.fn().mockResolvedValue(undefined),
    getLogs: jest.fn().mockResolvedValue([]),
  };

  const mockBettingDecision = {
    id: 'FB3187',
    matchId: 'FB3187',
    homeTeam: 'Arsenal',
    awayTeam: 'Liverpool',
    betSide: 'home',
    stakeAmount: 10,
    strategyName: 'Test Strategy',
    reasoning: 'Test reasoning',
    timestamp: Date.now()
  };

  beforeAll(async () => {
    console.log('🔧 Setting up test module...');
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BettingExecutorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataFileService,
          useValue: mockDataFileService,
        },
      ],
    }).compile();

    service = module.get<BettingExecutorService>(BettingExecutorService);
    
    console.log('🔧 Service created:', !!service);
    console.log('🔧 Service constructor:', service.constructor.name);
    
    // Check if dependencies are injected
    if (service) {
      console.log('🔧 Service has configService:', !!(service as any).configService);
      console.log('🔧 Service has dataFileService:', !!(service as any).dataFileService);
    }
  });

  afterAll(async () => {
    // Clean up browser session if method exists
    if (service && typeof service.closeBrowserSession === 'function') {
      await service.closeBrowserSession();
    }
  });

  describe('Service Initialization Tests', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should get executor status', () => {
      const status = service.getExecutorStatus();
      
      expect(status).toBeDefined();
      expect(status.isExecuting).toBeDefined();
      expect(status.isLoggedIn).toBeDefined();
      expect(status.liveBettingEnabled).toBeDefined();
      expect(status.paperTradingEnabled).toBeDefined();
      
      console.log('📊 Executor Status:', status);
    });
  });

  describe('Paper Trading Tests', () => {
    it('should execute paper trading bet', async () => {
      console.log('📝 Testing paper trading execution...');
      
      const testDecision = {
        id: 'FB3187',
        matchId: 'FB3187',
        homeTeam: 'Test Home Team',
        awayTeam: 'Test Away Team',
        betSide: 'home' as const,
        handicap: '-0.5',
        confidence: 0.75,
        stakeAmount: 10,
        expectedOdds: 1.85,
        strategy: 'integration_test_paper',
        timestamp: new Date().toISOString(),
        reasoning: 'Integration test for paper trading'
      };

      const result = await service.executeBet(testDecision);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('betId');
      
      console.log('✅ Paper trading result:', result);
    }, 30000);

    it('should handle multiple paper trading bets', async () => {
      console.log('📝 Testing multiple paper trading bets...');
      
      const testDecisions = [
        {
          id: 'FB3187',
          matchId: 'FB3187',
          homeTeam: 'Test Home 1',
          awayTeam: 'Test Away 1',
          betSide: 'home' as const,
          stakeAmount: 10,
          strategy: 'test_multiple_1'
        },
        {
          id: 'FB3188',
          matchId: 'FB3188',
          homeTeam: 'Test Home 2',
          awayTeam: 'Test Away 2',
          betSide: 'away' as const,
          stakeAmount: 20,
          strategy: 'test_multiple_2'
        }
      ];

      const results: any[] = [];
      for (const decision of testDecisions) {
        const result = await service.executeBet(decision);
        results.push(result);
      }
      
      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('betId');
      });
      
      console.log('✅ Multiple paper trading results:', results);
    }, 30000);
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid betting decisions gracefully', async () => {
      console.log('🎯 Testing error handling...');
      
      const invalidDecision = {
        id: 'INVALID_MATCH_ID',
        matchId: 'INVALID_MATCH_ID',
        // Missing required fields
      };

      const result = await service.executeBet(invalidDecision as any);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      
      console.log('✅ Error handling test completed:', result);
    }, 30000);
  });

  describe('Configuration Tests', () => {
    it('should respect configuration settings', () => {
      const status = service.getExecutorStatus();
      
      expect(status.paperTradingEnabled).toBe(true);
      expect(status.liveBettingEnabled).toBe(false);
      expect(status.headlessBrowser).toBe(true);
      
      console.log('✅ Configuration test completed');
    });
  });
}); 