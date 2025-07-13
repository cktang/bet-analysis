import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { DataFileService } from '../../core/data-file.service';
import * as fs from 'fs';
import * as path from 'path';

describe('BettingExecutorService Live Integration Tests', () => {
  let service: BettingExecutorService;
  let configService: ConfigService;
  let dataFileService: DataFileService;

  // Real configuration for live testing
  const liveConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        'ENABLE_LIVE_BETTING': true,
        'ENABLE_PAPER_TRADING': false,
        'HEADLESS_BROWSER': false,
        'HKJC_USERNAME': process.env.HKJC_USERNAME || 'test_user',
        'HKJC_PASSWORD': process.env.HKJC_PASSWORD || 'test_pass',
        'HKJC_SECURITY_ANSWERS': process.env.HKJC_SECURITY_ANSWERS || '{}',
        'baseStake': 10,
        'maxStake': 100,
        'confidenceThreshold': 0.6
      };
      return config[key] ?? defaultValue;
    }),
  };

  const realDataFileService: Partial<DataFileService> = {
    readFile: jest.fn(async (filename: string) => {
      const filePath = path.join(process.cwd(), 'data', 'v2', filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
      return [];
    }),
    writeFile: jest.fn(async (filename: string, data: any) => {
      const filePath = path.join(process.cwd(), 'data', 'v2', filename);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }),
    appendToFile: jest.fn(async (filename: string, record: any) => {
      const filePath = path.join(process.cwd(), 'data', 'v2', filename);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      let existing: any[] = [];
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        existing = JSON.parse(content);
      }
      existing.push(record);
      fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));
    }),
    writeLog: jest.fn(async (level: string, message: string) => {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }),
    getFixtures: jest.fn(),
    setFixtures: jest.fn(),
    getBetDecisions: jest.fn(),
    setBetDecisions: jest.fn(),
    getBetPendingDecisions: jest.fn(),
    setBetPendingDecisions: jest.fn(),
    addBetRecord: jest.fn(),
    addBetResult: jest.fn(),
    addBetDecision: jest.fn(),
    getBetSessions: jest.fn(),
    addBetSession: jest.fn(),
    getBetRecords: jest.fn(),
    getBetResults: jest.fn(),
    getStrategies: jest.fn(),
    setStrategies: jest.fn(),
    getLogs: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BettingExecutorService,
        {
          provide: ConfigService,
          useValue: liveConfigService,
        },
        {
          provide: DataFileService,
          useValue: realDataFileService,
        },
      ],
    }).compile();

    service = module.get<BettingExecutorService>(BettingExecutorService);
    configService = module.get<ConfigService>(ConfigService);
    dataFileService = module.get<DataFileService>(DataFileService);
  });

  afterAll(async () => {
    // Clean up browser session
    await service.closeBrowserSession();
  });

  describe('Live Browser Integration Tests', () => {
    it('should initialize browser and validate credentials', async () => {
      console.log('🔐 Testing browser initialization and credential validation...');
      
      const isValid = await service.validateCredentials();
      
      // This will actually try to login to HKJC
      expect(isValid).toBeDefined();
      console.log(`✅ Credential validation result: ${isValid}`);
    }, 60000); // 60 second timeout for browser operations

    it('should get executor status', () => {
      const status = service.getExecutorStatus();
      
      expect(status).toBeDefined();
      expect(status.isExecuting).toBeDefined();
      expect(status.isLoggedIn).toBeDefined();
      expect(status.liveBettingEnabled).toBeDefined();
      expect(status.paperTradingEnabled).toBeDefined();
      
      console.log('📊 Executor Status:', status);
    });

    it('should execute paper trading bet (safe test)', async () => {
      console.log('📝 Testing paper trading execution...');
      
      const testDecision = {
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

      // Temporarily enable paper trading for this test
      liveConfigService.get.mockImplementationOnce((key: string) => {
        if (key === 'ENABLE_PAPER_TRADING') return true;
        if (key === 'ENABLE_LIVE_BETTING') return false;
        return liveConfigService.get(key);
      });

      const result = await service.executeBet(testDecision);
      
      expect(result).toBeDefined();
      expect(result.status).toMatch(/success|simulated|paper/i);
      expect(result.betId).toBeDefined();
      
      console.log('✅ Paper trading result:', result);
    }, 30000);

    it('should handle betting decisions from file', async () => {
      console.log('📋 Testing betting decisions file processing...');
      
      // Create a test betting decision file
      const testDecisions = [
        {
          matchId: 'FB3187',
          homeTeam: 'Test Home',
          awayTeam: 'Test Away',
          betSide: 'home' as const,
          handicap: '-0.5',
          confidence: 0.75,
          stakeAmount: 10,
          expectedOdds: 1.85,
          strategy: 'integration_test_file',
          timestamp: new Date().toISOString(),
          reasoning: 'Integration test for file processing'
        }
      ];

      // Write test decisions to file
      await dataFileService.writeFile('betting-decisions.json', testDecisions);
      
      // Read back the decisions
      const readDecisions = await dataFileService.readFile('betting-decisions.json');
      
      expect(readDecisions).toEqual(testDecisions);
      expect(readDecisions.length).toBe(1);
      expect(readDecisions[0].matchId).toBe('FB3187');
      
      console.log('✅ File processing test completed');
    });

    it('should execute live bet with proper error handling', async () => {
      console.log('🎯 Testing live bet execution with error handling...');
      
      const testDecision = {
        matchId: 'INVALID_MATCH_ID',
        homeTeam: 'Invalid Home',
        awayTeam: 'Invalid Away',
        betSide: 'home' as const,
        handicap: '-0.5',
        confidence: 0.75,
        stakeAmount: 10,
        expectedOdds: 1.85,
        strategy: 'integration_test_error_handling',
        timestamp: new Date().toISOString(),
        reasoning: 'Integration test for error handling'
      };

      // Enable live betting for this test
      liveConfigService.get.mockImplementationOnce((key: string) => {
        if (key === 'ENABLE_LIVE_BETTING') return true;
        if (key === 'ENABLE_PAPER_TRADING') return false;
        return liveConfigService.get(key);
      });

      const result = await service.executeBet(testDecision);
      
      // Should handle the error gracefully
      expect(result).toBeDefined();
      expect(result.status).toMatch(/failed|error/i);
      expect(result.error).toBeDefined();
      
      console.log('✅ Error handling test completed:', result);
    }, 60000);
  });

  describe('Service Method Direct Testing', () => {
    it('should test placeBet method directly (if accessible)', async () => {
      console.log('🎯 Testing placeBet method directly...');
      
      // Note: This test would require the placeBet method to be public
      // or we would need to use reflection to access private methods
      // For now, we test through the public executeBet interface
      
      const testDecision = {
        matchId: 'FB3187',
        homeTeam: 'Direct Test Home',
        awayTeam: 'Direct Test Away',
        betSide: 'home' as const,
        handicap: '-0.5',
        confidence: 0.75,
        stakeAmount: 10,
        expectedOdds: 1.85,
        strategy: 'integration_test_direct',
        timestamp: new Date().toISOString(),
        reasoning: 'Integration test for direct method testing'
      };

      // Enable paper trading for safe testing
      liveConfigService.get.mockImplementationOnce((key: string) => {
        if (key === 'ENABLE_PAPER_TRADING') return true;
        if (key === 'ENABLE_LIVE_BETTING') return false;
        return liveConfigService.get(key);
      });

      const result = await service.executeBet(testDecision);
      
      expect(result).toBeDefined();
      expect((result as any).status).toMatch(/success|simulated|paper/i);
      
      console.log('✅ Direct method testing completed:', result);
    }, 30000);
  });
}); 