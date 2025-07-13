// Angular tests disabled - angular directory not present
/*
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from '../web-interface/angular/services/api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFixtures', () => {
    it('should retrieve fixtures', () => {
      const mockResponse = {
        fixtures: [
          {
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            kickoffTime: new Date(),
            matchId: 'test_match',
            date: '2025-07-04',
            league: 'EPL',
            source: 'HKJC'
          }
        ],
        status: { totalFixtures: 1 }
      };

      service.getFixtures().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/automation/fixtures');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTradingWindow', () => {
    it('should retrieve trading window data', () => {
      const mockResponse = {
        matchesInWindow: [],
        count: 0
      };

      service.getTradingWindow().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/automation/trading-window');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getLatestOdds', () => {
    it('should retrieve latest odds', () => {
      const mockResponse = {
        matches: [
          {
            homeTeam: 'Arsenal',
            awayTeam: 'Liverpool',
            kickoff: '2025-07-04T15:00:00Z',
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

      service.getLatestOdds().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/trading/odds/latest');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getStrategies', () => {
    it('should retrieve strategies', () => {
      const mockResponse = [
        {
          name: 'Single_awayGoalDiff',
          description: 'Away team goal difference strategy',
          roi: 17.73,
          winRate: 61.3,
          totalBets: 222
        }
      ];

      service.getStrategies().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/analysis/strategies');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getStrategyPerformances', () => {
    it('should retrieve strategy performances', () => {
      const mockResponse = [
        {
          strategy: 'Single_awayGoalDiff',
          roi: 17.73,
          winRate: 61.3,
          totalBets: 222
        }
      ];

      service.getStrategyPerformances().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/performance/strategies');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('evaluateAllStrategies', () => {
    it('should evaluate all strategies', () => {
      const mockResponse = [
        {
          homeTeam: 'Arsenal',
          awayTeam: 'Liverpool',
          strategy: 'Single_awayGoalDiff',
          expectedROI: 17.73,
          betType: 'Asian Handicap',
          selection: 'Away +0.5',
          confidence: 0.85
        }
      ];

      service.evaluateAllStrategies().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/live-trading/strategies/evaluate-all');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('getSystemPerformance', () => {
    it('should retrieve system performance', () => {
      const mockResponse = {
        totalStrategies: 10,
        totalBets: 150,
        successfulBets: 95,
        systemROI: 15.4,
        dailyProfit: 125.50,
        mode: 'paper'
      };

      service.getSystemPerformance().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/performance/system');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAutomationStatus', () => {
    it('should retrieve automation status', () => {
      const mockResponse = {
        scheduler: {
          status: 'active',
          isRunning: true
        },
        fixtures: {
          totalFixtures: 3,
          upcomingToday: 2,
          inTradingWindow: 1,
          lastUpdated: Date.now()
        }
      };

      service.getAutomationStatus().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/automation/status');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Polling Methods', () => {
    it('should create fixtures polling observable', (done) => {
      const mockResponse = {
        fixtures: [],
        status: {}
      };

      let callCount = 0;
      service.getFixturesPolling(100).subscribe(response => {
        callCount++;
        expect(response).toEqual(mockResponse);
        
        if (callCount === 2) {
          done();
        }
      });

      // Handle first immediate request and subsequent interval requests
      setTimeout(() => {
        const req1 = httpMock.expectOne('/api/automation/fixtures');
        req1.flush(mockResponse);
      }, 0);

      setTimeout(() => {
        const req2 = httpMock.expectOne('/api/automation/fixtures');
        req2.flush(mockResponse);
      }, 100);
    });

    it('should create odds polling observable', (done) => {
      const mockResponse = { matches: [] };

      let callCount = 0;
      service.getOddsPolling(100).subscribe(response => {
        callCount++;
        expect(response).toEqual(mockResponse);
        
        if (callCount === 2) {
          done();
        }
      });

      setTimeout(() => {
        const req1 = httpMock.expectOne('/api/trading/odds/latest');
        req1.flush(mockResponse);
      }, 0);

      setTimeout(() => {
        const req2 = httpMock.expectOne('/api/trading/odds/latest');
        req2.flush(mockResponse);
      }, 100);
    });

    it('should create betting signals polling observable', (done) => {
      const mockResponse = [];

      let callCount = 0;
      service.getBettingSignalsPolling(100).subscribe(response => {
        callCount++;
        expect(response).toEqual(mockResponse);
        
        if (callCount === 2) {
          done();
        }
      });

      setTimeout(() => {
        const req1 = httpMock.expectOne('/live-trading/strategies/evaluate-all');
        req1.flush(mockResponse);
      }, 0);

      setTimeout(() => {
        const req2 = httpMock.expectOne('/live-trading/strategies/evaluate-all');
        req2.flush(mockResponse);
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', () => {
      service.getFixtures().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('/api/automation/fixtures');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', () => {
      service.getLatestOdds().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne('/api/trading/odds/latest');
      req.error(new ErrorEvent('Network error'));
    });
  });
});*/
