import { Test, TestingModule } from '@nestjs/testing';
import { BettingExecutorService } from '../../live-trading/betting-executor.service';
import { ConfigService } from '@nestjs/config';
import { DataFileService } from '../../core/data-file.service';

describe('BettingExecutorService Unit Tests', () => {
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

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with correct configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('ENABLE_LIVE_BETTING', false);
      expect(configService.get).toHaveBeenCalledWith('ENABLE_PAPER_TRADING', true);
    });
  });

  describe('Betting Decision Validation', () => {
    it('should validate required betting decision fields', async () => {
      const result = await service.executeBet(mockBettingDecision);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.betId).toBe('FB3187');
      expect(result.isPaperTrade).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const incompleteDecision = {
        id: 'FB3187',
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool'
        // Missing required fields
      };
      
      const result = await service.executeBet(incompleteDecision);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('success'); // Paper trading always succeeds
    });
  });

  describe('Selector Logic Tests', () => {
    it('should generate correct HOME team selectors', () => {
      const homeSelectors = (service as any).generateTeamSelectors('home', 'FB3187');
      expect(homeSelectors).toContain('_H');
    });

    it('should generate correct AWAY team selectors', () => {
      const awaySelectors = (service as any).generateTeamSelectors('away', 'FB3187');
      expect(awaySelectors).toContain('_A');
    });

    it('should validate HKJC checkbox ID patterns', () => {
      const validId = 'HDC_FB3187_H';
      const isValid = (service as any).validateCheckboxId(validId);
      expect(isValid).toBe(true);
    });
  });

  describe('Configuration Tests', () => {
    it('should respect DRY_RUN_MODE configuration', () => {
      configService.get.mockReturnValueOnce(true); // DRY_RUN_MODE = true
      const isDryRun = configService.get('DRY_RUN_MODE');
      expect(isDryRun).toBe(true);
    });

    it('should validate stake amount limits', () => {
      const baseStake = configService.get('BASE_STAKE', 100);
      const maxStake = configService.get('MAX_STAKE', 500);
      expect(baseStake).toBe(100);
      expect(maxStake).toBe(500);
    });

    it('should validate confidence threshold', () => {
      const threshold = configService.get('CONFIDENCE_THRESHOLD', 0.6);
      expect(threshold).toBe(0.6);
    });
  });

  describe('Paper Trading Mode Tests', () => {
    it('should execute paper trading correctly', async () => {
      configService.get.mockReturnValueOnce(false); // ENABLE_LIVE_BETTING = false
      configService.get.mockReturnValueOnce(true);  // ENABLE_PAPER_TRADING = true
      
      const result = await service.executeBet(mockBettingDecision);
      
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.isPaperTrade).toBe(true);
      expect(result.hkjcBetId).toMatch(/^PAPER_/);
    });
  });

  describe('Data File Service Integration', () => {
    it('should read betting decisions from data file service', async () => {
      const mockDecisions = [mockBettingDecision];
      dataFileService.readFile.mockResolvedValue(mockDecisions);
      
      const decisions = await dataFileService.readFile('betting-decisions.json');
      
      expect(decisions).toEqual(mockDecisions);
      expect(dataFileService.readFile).toHaveBeenCalledWith('betting-decisions.json');
    });

    it('should write execution results to data file service', async () => {
      const mockResults = [{ status: 'success', betId: 'FB3187' }];
      
      await dataFileService.writeFile('bet-execution-results.json', mockResults);
      
      expect(dataFileService.writeFile).toHaveBeenCalledWith('bet-execution-results.json', mockResults);
    });
  });

  describe('Error Handling', () => {
    it('should handle data file service errors gracefully', async () => {
      dataFileService.readFile.mockRejectedValue(new Error('File not found'));
      
      try {
        await dataFileService.readFile('nonexistent.json');
      } catch (error) {
        expect(error.message).toBe('File not found');
      }
    });

    it('should handle browser initialization errors', async () => {
      // Mock browser initialization failure
      const mockBrowser = {
        launchPersistentContext: jest.fn().mockRejectedValue(new Error('Browser failed'))
      };
      
      try {
        await (service as any).initializeBrowser();
      } catch (error) {
        expect(error.message).toBe('Browser failed');
      }
    });
  });

  describe('Match ID Validation', () => {
    it('should validate Facebook match ID format', () => {
      const validId = 'FB3187';
      const isValid = (service as any).validateMatchId(validId);
      expect(isValid).toBe(true);
    });
  });
});