import { Test, TestingModule } from '@nestjs/testing';
import { FixtureService, MatchFixture } from '../../fixtures/fixture.service';
import { DataFileService } from '../../core/data-file.service';

describe('FixtureService', () => {
  let service: FixtureService;
  let dataFileService: jest.Mocked<DataFileService>;

  const mockFixtures: MatchFixture[] = [
    {
      homeTeam: 'Arsenal',
      awayTeam: 'Liverpool',
      kickoffTime: new Date('2025-07-04T15:00:00Z'),
      matchId: 'arsenal_v_liverpool_20250704',
      date: '2025-07-04',
      league: 'EPL',
      source: 'HKJC'
    },
    {
      homeTeam: 'Manchester City',
      awayTeam: 'Chelsea',
      kickoffTime: new Date('2025-07-04T17:30:00Z'),
      matchId: 'mancity_v_chelsea_20250704',
      date: '2025-07-04',
      league: 'EPL',
      source: 'HKJC'
    }
  ];

  beforeEach(async () => {
    const mockDataFileService = {
      getFixtures: jest.fn(),
      setFixtures: jest.fn(),
      readFile: jest.fn(),
      writeFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FixtureService,
        {
          provide: DataFileService,
          useValue: mockDataFileService
        }
      ],
    }).compile();

    service = module.get<FixtureService>(FixtureService);
    dataFileService = module.get(DataFileService);
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

  describe('loadTodaysFixtures', () => {
    it('should load fixtures from file when available', async () => {
      // Mock existing fixtures in file
      dataFileService.getFixtures.mockResolvedValue(mockFixtures);

      const result = await service.loadTodaysFixtures();

      expect(result).toEqual(mockFixtures);
      expect(dataFileService.getFixtures).toHaveBeenCalled();
    });

    it('should return mock fixtures when no file data available', async () => {
      // Mock no existing fixtures
      dataFileService.getFixtures.mockRejectedValue(new Error('No fixtures found'));

      const result = await service.loadTodaysFixtures();

      expect(result).toHaveLength(3); // Mock fixtures from getMockFixtures
      expect(result[0].homeTeam).toBe('Arsenal');
      expect(result[0].awayTeam).toBe('Liverpool');
    });

    it('should fallback to mock data on error', async () => {
      // Mock error when reading fixtures
      dataFileService.getFixtures.mockRejectedValue(new Error('Network error'));

      const result = await service.loadTodaysFixtures();

      expect(result).toHaveLength(3); // Mock fixtures fallback
    });
  });

  describe('getMatchesInWindow', () => {
    beforeEach(() => {
      // Set up fixtures with different kickoff times
      const now = new Date();
      const fixtures = [
        {
          ...mockFixtures[0],
          kickoffTime: new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
        },
        {
          ...mockFixtures[1],
          kickoffTime: new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes from now
        }
      ];
      (service as any).todaysFixtures = fixtures;
    });

    it('should return matches within specified time window', () => {
      const result = service.getMatchesInWindow(10); // 10 minutes window

      expect(result).toHaveLength(1);
      expect(result[0].homeTeam).toBe('Arsenal');
    });

    it('should return empty array when no matches in window', () => {
      const result = service.getMatchesInWindow(2); // 2 minutes window

      expect(result).toHaveLength(0);
    });
  });

  describe('getMatchesInTradingWindow', () => {
    it('should return matches between 5-10 minutes to kickoff', () => {
      const now = new Date();
      const fixtures = [
        {
          ...mockFixtures[0],
          kickoffTime: new Date(now.getTime() + 7 * 60 * 1000) // 7 minutes - in trading window
        },
        {
          ...mockFixtures[1],
          kickoffTime: new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes - not in trading window
        }
      ];
      (service as any).todaysFixtures = fixtures;

      const result = service.getMatchesInTradingWindow();

      expect(result).toHaveLength(1);
      expect(result[0].homeTeam).toBe('Arsenal');
    });
  });

  describe('getTodaysFixtures', () => {
    it('should return all loaded fixtures', () => {
      (service as any).todaysFixtures = mockFixtures;

      const result = service.getTodaysFixtures();

      expect(result).toEqual(mockFixtures);
    });
  });

  describe('getFixtureStatus', () => {
    it('should return correct fixture status', () => {
      const now = new Date();
      const fixtures = [
        {
          ...mockFixtures[0],
          kickoffTime: new Date(now.getTime() + 7 * 60 * 1000) // In trading window
        },
        {
          ...mockFixtures[1],
          kickoffTime: new Date(now.getTime() + 30 * 60 * 1000) // Upcoming
        }
      ];
      (service as any).todaysFixtures = fixtures;

      const status = service.getFixtureStatus();

      expect(status.totalFixtures).toBe(2);
      expect(status.upcomingToday).toBe(2);
      expect(status.inTradingWindow).toBe(1);
      expect(status.nextMatch).toEqual(fixtures[0]);
    });
  });

  describe('refreshFixtures', () => {
    it('should reload fixtures', async () => {
      const spy = jest.spyOn(service, 'loadTodaysFixtures');
      spy.mockResolvedValue(mockFixtures);

      const result = await service.refreshFixtures();

      expect(spy).toHaveBeenCalled();
      expect(result).toEqual(mockFixtures);
    });
  });
});