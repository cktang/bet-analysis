import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OddsMonitorService } from '../../live-trading/odds-monitor.service';

describe('OddsMonitorService', () => {
  let service: OddsMonitorService;
  let configService: jest.Mocked<ConfigService>;

  const mockOddsData = {
    timestamp: Date.now(),
    matches: [
      {
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool',
        kickoff: new Date(Date.now() + 2 * 60 * 60 * 1000),
        odds: {
          homeWin: 2.40,
          draw: 3.30,
          awayWin: 2.90,
          asianHandicap: {
            homeHandicap: '-0.5',
            homeOdds: 1.85,
            awayHandicap: '+0.5',
            awayOdds: 1.95
          },
          overUnder: {
            line: 2.5,
            overOdds: 1.60,
            underOdds: 2.30
          }
        },
        volume: 125000,
        lastUpdate: Date.now()
      }
    ]
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          'ODDS_MONITOR_INTERVAL': 60000,
          'ENABLE_ODDS_MONITORING': true
        };
        return config[key] || defaultValue;
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OddsMonitorService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<OddsMonitorService>(OddsMonitorService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize with mock odds data', async () => {
      await service.onModuleInit();

      const latestOdds = await service.getLatestOdds();
      expect(latestOdds).toBeDefined();
      expect(latestOdds.matches).toHaveLength(3); // Mock data has 3 matches
    });
  });

  describe('getLatestOdds', () => {
    it('should return the most recent odds data', async () => {
      await service.onModuleInit();

      const result = await service.getLatestOdds();

      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
      expect(Array.isArray(result.matches)).toBe(true);
    });
  });

  describe('getMatchOdds', () => {
    it('should return odds for specific match', async () => {
      await service.onModuleInit();

      const result = await service.getMatchOdds('Arsenal', 'Liverpool');

      expect(result).toBeDefined();
      expect(result.homeTeam).toBe('Arsenal');
      expect(result.awayTeam).toBe('Liverpool');
    });

    it('should return null for non-existent match', async () => {
      await service.onModuleInit();

      const result = await service.getMatchOdds('NonExistent', 'Team');

      expect(result).toBeNull();
    });
  });

  describe('getMonitoringStatus', () => {
    it('should return monitoring status', () => {
      const status = service.getMonitoringStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('enabled');
      expect(status.enabled).toBe(true);
    });
  });

  describe('monitorOdds', () => {
    it('should prevent concurrent monitoring', async () => {
      // Mock the private isRunning property
      (service as any).isRunning = true;

      const result = await service.monitorOdds();

      expect(result).toBeUndefined();
    });

    it('should handle browser initialization failure gracefully', async () => {
      // Mock browser initialization to fail
      jest.spyOn(service as any, 'initializeBrowser').mockRejectedValue(new Error('Browser init failed'));

      await expect(service.monitorOdds()).rejects.toThrow('Browser init failed');
    });
  });

  describe('isEPLTeam', () => {
    it('should correctly identify EPL teams', () => {
      const isEPLTeam = (service as any).isEPLTeam.bind(service);

      expect(isEPLTeam('Arsenal')).toBe(true);
      expect(isEPLTeam('Liverpool')).toBe(true);
      expect(isEPLTeam('Manchester City')).toBe(true);
      expect(isEPLTeam('Real Madrid')).toBe(false);
      expect(isEPLTeam('Barcelona')).toBe(false);
    });

    it('should handle partial team name matches', () => {
      const isEPLTeam = (service as any).isEPLTeam.bind(service);

      expect(isEPLTeam('Man City')).toBe(true);
      expect(isEPLTeam('Spurs')).toBe(true);
      expect(isEPLTeam('Brighton')).toBe(true);
    });
  });

  describe('normalizeTeamName', () => {
    it('should normalize common team name variations', () => {
      const normalizeTeamName = (service as any).normalizeTeamName.bind(service);

      expect(normalizeTeamName('Man City')).toBe('Manchester City');
      expect(normalizeTeamName('Man Utd')).toBe('Manchester Utd');
      expect(normalizeTeamName('Spurs')).toBe('Tottenham');
      expect(normalizeTeamName('Leicester City')).toBe('Leicester');
      expect(normalizeTeamName('Nottm Forest')).toBe('Nottingham Forest');
    });

    it('should return unchanged name if no mapping exists', () => {
      const normalizeTeamName = (service as any).normalizeTeamName.bind(service);

      expect(normalizeTeamName('Arsenal')).toBe('Arsenal');
      expect(normalizeTeamName('Liverpool')).toBe('Liverpool');
    });
  });

  describe('detectOddsChanges', () => {
    it('should detect significant odds changes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Set initial odds data
      (service as any).lastOddsData = {
        matches: [
          {
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            homeOdds: 2.00,
            awayOdds: 1.80,
            handicap: 0
          }
        ]
      };

      // New odds data with significant changes
      const newOddsData = {
        matches: [
          {
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            homeOdds: 2.10, // +0.10 change (> 0.05 threshold)
            awayOdds: 1.75, // -0.05 change (= 0.05 threshold)
            handicap: 0.5,  // +0.5 change (> 0 threshold)
            timestamp: Date.now()
          }
        ]
      };

      await (service as any).detectOddsChanges(newOddsData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Detected'),
        expect.stringContaining('odds changes')
      );

      consoleSpy.mockRestore();
    });

    it('should not detect insignificant odds changes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Set initial odds data
      (service as any).lastOddsData = {
        matches: [
          {
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            homeOdds: 2.00,
            awayOdds: 1.80,
            handicap: 0
          }
        ]
      };

      // New odds data with insignificant changes
      const newOddsData = {
        matches: [
          {
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            homeOdds: 2.02, // +0.02 change (< 0.05 threshold)
            awayOdds: 1.82, // +0.02 change (< 0.05 threshold)
            handicap: 0,    // No change
            timestamp: Date.now()
          }
        ]
      };

      await (service as any).detectOddsChanges(newOddsData);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('🔄 Detected')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getMockOddsData', () => {
    it('should return properly formatted mock odds data', () => {
      const mockData = (service as any).getMockOddsData();

      expect(mockData).toHaveProperty('timestamp');
      expect(mockData).toHaveProperty('matches');
      expect(Array.isArray(mockData.matches)).toBe(true);
      expect(mockData.matches).toHaveLength(3);

      const firstMatch = mockData.matches[0];
      expect(firstMatch).toHaveProperty('homeTeam');
      expect(firstMatch).toHaveProperty('awayTeam');
      expect(firstMatch).toHaveProperty('odds');
      expect(firstMatch.odds).toHaveProperty('asianHandicap');
      expect(firstMatch.odds).toHaveProperty('overUnder');
    });

    it('should include trading window information', () => {
      const mockData = (service as any).getMockOddsData();
      
      // Find the match that should be in trading window (Tottenham vs Newcastle)
      const tradingMatch = mockData.matches.find(m => 
        m.homeTeam === 'Tottenham' && m.awayTeam === 'Newcastle'
      );

      expect(tradingMatch).toBeDefined();
      expect(tradingMatch.inTradingWindow).toBe(true);
      expect(tradingMatch.timeToKickoff).toBe(7);
    });
  });
});