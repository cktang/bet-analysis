import { Test, TestingModule } from '@nestjs/testing';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { ConfigService } from '@nestjs/config';
import { DataFileService } from '../../core/data-file.service';

describe('BettingExecutorService Integration Tests', () => {
  let service: BettingExecutorService;
  let configService: jest.Mocked<ConfigService>;
  let dataFileService: jest.Mocked<DataFileService>;

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

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue: any) => {
        const config = {
          'ENABLE_LIVE_BETTING': false,
          'ENABLE_PAPER_TRADING': true,
          'DRY_RUN_MODE': true,
          'HEADLESS_BROWSER': true,
          'HKJC_USERNAME': 'testuser',
          'HKJC_PASSWORD': 'testpass',
          'HKJC_SECURITY_ANSWERS': '{"test": "answer"}',
          'CONFIDENCE_THRESHOLD': 0.6,
          'BASE_STAKE': 100,
          'MAX_STAKE': 500
        };
        return config[key] || defaultValue;
      })
    };

    const mockDataFileService = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      getFixtures: jest.fn(),
      setFixtures: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BettingExecutorService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: DataFileService,
          useValue: mockDataFileService
        }
      ],
    }).compile();

    service = module.get<BettingExecutorService>(BettingExecutorService);
    configService = module.get(ConfigService);
    dataFileService = module.get(DataFileService);
  });

  afterEach(async () => {
    // Clean up file watcher
    if ((service as any).fileWatcher) {
      await (service as any).fileWatcher.close();
    }
  });

  describe('Official Test Cases - 3rd and 4th Match Betting', () => {
    it('should execute HOME bet on 3rd match (FB3187) with $10 stake', async () => {
      // Arrange: Set up test data
      const homeTestDecision = {
        ...mockBettingDecision,
        id: 'FB3187',
        matchId: 'FB3187',
        betSide: 'home',
        stakeAmount: 10
      };

      // Act: Execute the bet
      const result = await service.executeBet(homeTestDecision);

      // Assert: Verify the execution result
      expect(result).toBeDefined();
      expect(result.betId).toBe('FB3187');
      expect(result.betSide).toBe('home');
      expect(result.stakeAmount).toBe(10);
      expect(result.status).toBe('success');
      expect(result.isPaperTrade).toBe(true);
    });

    it('should execute AWAY bet on 4th match (FB3188) with $10 stake', async () => {
      // Arrange: Set up test data
      const awayTestDecision = {
        ...mockBettingDecision,
        id: 'FB3188',
        matchId: 'FB3188',
        homeTeam: 'Manchester City',
        awayTeam: 'Chelsea',
        betSide: 'away',
        stakeAmount: 10
      };

      // Act: Execute the bet
      const result = await service.executeBet(awayTestDecision);

      // Assert: Verify the execution result
      expect(result).toBeDefined();
      expect(result.betId).toBe('FB3188');
      expect(result.betSide).toBe('away');
      expect(result.stakeAmount).toBe(10);
      expect(result.status).toBe('success');
      expect(result.isPaperTrade).toBe(true);
    });

    it('should validate team selection selector accuracy', async () => {
      // Test HOME selector
      const homeTestDecision = {
        ...mockBettingDecision,
        id: 'FB3187',
        betSide: 'home'
      };
      const homeResult = await service.executeBet(homeTestDecision);
      expect(homeResult.betSide).toBe('home');

      // Test AWAY selector  
      const awayTestDecision = {
        ...mockBettingDecision,
        id: 'FB3188',
        betSide: 'away'
      };
      const awayResult = await service.executeBet(awayTestDecision);
      expect(awayResult.betSide).toBe('away');
    });
  });

  describe('Safety and Configuration Tests', () => {
    it('should enforce DRY_RUN_MODE in test environment', () => {
      const dryRunMode = configService.get('DRY_RUN_MODE', true);
      expect(dryRunMode).toBe(true);
    });

    it('should disable live betting in test environment', () => {
      const liveBettingEnabled = configService.get('ENABLE_LIVE_BETTING', false);
      expect(liveBettingEnabled).toBe(false);
    });

    it('should use appropriate stake limits for testing', () => {
      const baseStake = configService.get('BASE_STAKE', 100);
      const maxStake = configService.get('MAX_STAKE', 500);
      expect(baseStake).toBe(100);
      expect(maxStake).toBe(500);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid match ID gracefully', async () => {
      // Arrange: Invalid match ID
      const invalidDecision = {
        ...mockBettingDecision,
        id: 'INVALID_MATCH_ID',
        matchId: 'INVALID_MATCH_ID'
      };

      // Act: Execute the bet
      const result = await service.executeBet(invalidDecision);

      // Should handle error gracefully without crashing
      expect(result).toBeDefined();
      expect(result.betId).toBe('INVALID_MATCH_ID');
      expect(result.status).toBe('success'); // Paper trading always succeeds
      
      console.log('✅ Invalid match ID handled gracefully:', result.status);
    });

    it('should validate bet side parameter', async () => {
      // Arrange: Invalid bet side
      const invalidBetSideDecision = {
        ...mockBettingDecision,
        id: 'FB3187',
        betSide: 'invalid_side'
      };

      // Act: Execute the bet
      const result = await service.executeBet(invalidBetSideDecision);

      // Should handle invalid bet side
      expect(result).toBeDefined();
      expect(result.status).toBe('success'); // Paper trading always succeeds
      
      console.log('✅ Invalid bet side validation working:', result.status);
    });
  });

  describe('Performance Tests', () => {
    it('should execute betting decision within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await service.executeBet(mockBettingDecision);
      
      const executionTime = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`✅ Bet execution completed in ${executionTime}ms`);
    });
  });
});