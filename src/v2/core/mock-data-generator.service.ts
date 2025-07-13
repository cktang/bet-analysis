import { Injectable } from '@nestjs/common';
import { DataFileService } from './data-file.service';
import moment from 'moment';

export interface MockMatchData {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: Date;
  league: string;
  odds: {
    homeWin: number;
    draw: number;
    awayWin: number;
    asianHandicap: {
      homeHandicap: string;
      homeOdds: number;
      awayHandicap: string;
      awayOdds: number;
    };
    overUnder: {
      line: number;
      overOdds: number;
      underOdds: number;
    };
  };
  venue: string;
  expectedResult?: 'home' | 'away' | 'draw';
  strategyTrigger?: string;
  expectedROI?: number;
}

// Mock betting record interfaces removed - only real betting records allowed

@Injectable()
export class MockDataGeneratorService {
  private matchCounter = 1;
  private betCounter = 1;
  
  constructor(private dataFileService: DataFileService) {}
  
  private readonly eplTeams = [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich',
    'Leicester', 'Liverpool', 'Manchester City', 'Manchester Utd',
    'Newcastle', 'Nottingham Forest', 'Southampton', 'Tottenham',
    'West Ham', 'Wolves'
  ];

  private readonly venues = {
    'Arsenal': 'Emirates Stadium',
    'Aston Villa': 'Villa Park',
    'Bournemouth': 'Vitality Stadium',
    'Brentford': 'Brentford Community Stadium',
    'Brighton': 'Amex Stadium',
    'Chelsea': 'Stamford Bridge',
    'Crystal Palace': 'Selhurst Park',
    'Everton': 'Goodison Park',
    'Fulham': 'Craven Cottage',
    'Ipswich': 'Portman Road',
    'Leicester': 'King Power Stadium',
    'Liverpool': 'Anfield',
    'Manchester City': 'Etihad Stadium',
    'Manchester Utd': 'Old Trafford',
    'Newcastle': 'St. James\' Park',
    'Nottingham Forest': 'City Ground',
    'Southampton': 'St. Mary\'s Stadium',
    'Tottenham': 'Tottenham Hotspur Stadium',
    'West Ham': 'London Stadium',
    'Wolves': 'Molineux Stadium'
  };

  private readonly strategyConfigs = [
    {
      name: '-0.25-Early-Away',
      expectedROI: 39.73,
      condition: (homeTeam: string, awayTeam: string) => Math.random() < 0.15, // 15% chance
      handicap: '-0.25',
      betSide: 'away' as const
    },
    {
      name: 'Top8-Dynamic-Home',
      expectedROI: 25.96,
      condition: (homeTeam: string, awayTeam: string) => Math.random() < 0.20, // 20% chance
      handicap: '-0.75',
      betSide: 'home' as const
    },
    {
      name: 'GiantKilling-Dynamic-High',
      expectedROI: 21.02,
      condition: (homeTeam: string, awayTeam: string) => Math.random() < 0.12, // 12% chance
      handicap: '+0.75',
      betSide: 'home' as const
    },
    {
      name: 'Bottom6Away-Extreme-High',
      expectedROI: 17.4,
      condition: (homeTeam: string, awayTeam: string) => Math.random() < 0.18, // 18% chance
      handicap: '+0.5',
      betSide: 'away' as const
    }
  ];

  /**
   * Generate a new mock match every 15 minutes
   */
  generateNextMatch(): MockMatchData {
    const homeTeam = this.getRandomTeam();
    let awayTeam = this.getRandomTeam();
    
    // Ensure different teams
    while (awayTeam === homeTeam) {
      awayTeam = this.getRandomTeam();
    }

    const kickoffTime = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes from now
    const matchId = `MOCK_${Date.now()}_${this.matchCounter++}`;
    
    // Check if this match should trigger a strategy
    const strategyTrigger = this.getStrategyTrigger(homeTeam, awayTeam);
    
    return {
      matchId,
      homeTeam,
      awayTeam,
      kickoffTime,
      league: 'EPL',
      odds: this.generateRealisticOdds(homeTeam, awayTeam, strategyTrigger),
      venue: this.venues[homeTeam] || `${homeTeam} Stadium`,
      strategyTrigger: strategyTrigger?.name,
      expectedROI: strategyTrigger?.expectedROI
    };
  }

  /**
   * Generate realistic betting odds based on teams and strategy
   */
  private generateRealisticOdds(homeTeam: string, awayTeam: string, strategy?: any) {
    let homeWin = 2.0 + (Math.random() * 2.0); // 2.0 - 4.0
    let draw = 3.0 + (Math.random() * 1.0);     // 3.0 - 4.0  
    let awayWin = 2.0 + (Math.random() * 2.0);  // 2.0 - 4.0

    let homeHandicap = '0';
    let homeOdds = 1.90;
    let awayHandicap = '0';
    let awayOdds = 1.90;

    // Adjust odds based on strategy trigger
    if (strategy) {
      switch (strategy.name) {
        case '-0.25-Early-Away':
          homeHandicap = '-0.25';
          awayHandicap = '+0.25';
          homeOdds = 1.85;
          awayOdds = 1.95;
          homeWin = 2.4;
          awayWin = 2.9;
          break;
        case 'Top8-Dynamic-Home':
          homeHandicap = '-0.75';
          awayHandicap = '+0.75';
          homeOdds = 1.90;
          awayOdds = 1.90;
          homeWin = 1.7;
          awayWin = 4.5;
          break;
        case 'GiantKilling-Dynamic-High':
          homeHandicap = '+0.75';
          awayHandicap = '-0.75';
          homeOdds = 1.88;
          awayOdds = 1.92;
          homeWin = 3.8;
          awayWin = 1.95;
          break;
        case 'Bottom6Away-Extreme-High':
          homeHandicap = '-0.5';
          awayHandicap = '+0.5';
          homeOdds = 1.85;
          awayOdds = 1.95;
          homeWin = 1.6;
          awayWin = 5.2;
          break;
      }
    } else {
      // Random handicap for non-strategy matches
      const handicaps = ['-1', '-0.75', '-0.5', '-0.25', '0', '+0.25', '+0.5', '+0.75', '+1'];
      const randomHandicap = handicaps[Math.floor(Math.random() * handicaps.length)];
      homeHandicap = randomHandicap;
      awayHandicap = randomHandicap.startsWith('-') ? randomHandicap.replace('-', '+') : randomHandicap.replace('+', '-');
      
      homeOdds = 1.80 + (Math.random() * 0.4);
      awayOdds = 1.80 + (Math.random() * 0.4);
    }

    return {
      homeWin: Math.round(homeWin * 100) / 100,
      draw: Math.round(draw * 100) / 100,
      awayWin: Math.round(awayWin * 100) / 100,
      asianHandicap: {
        homeHandicap,
        homeOdds: Math.round(homeOdds * 100) / 100,
        awayHandicap,
        awayOdds: Math.round(awayOdds * 100) / 100
      },
      overUnder: {
        line: 2.5,
        overOdds: 1.5 + (Math.random() * 0.5),
        underOdds: 2.0 + (Math.random() * 0.8)
      }
    };
  }

  /**
   * Determine if match should trigger a betting strategy
   */
  private getStrategyTrigger(homeTeam: string, awayTeam: string) {
    for (const strategy of this.strategyConfigs) {
      if (strategy.condition(homeTeam, awayTeam)) {
        return strategy;
      }
    }
    return null;
  }

  private getRandomTeam(): string {
    return this.eplTeams[Math.floor(Math.random() * this.eplTeams.length)];
  }

  /**
   * Get next match kickoff time (every 15 minutes)
   */
  getNextMatchTime(): Date {
    return new Date(Date.now() + (15 * 60 * 1000));
  }

  /**
   * Check if it's time to generate a new match
   */
  isTimeForNewMatch(lastMatchTime?: Date): boolean {
    if (!lastMatchTime) return true;
    
    const now = new Date();
    const timeSinceLastMatch = now.getTime() - lastMatchTime.getTime();
    const fifteenMinutes = 15 * 60 * 1000;
    
    return timeSinceLastMatch >= fifteenMinutes;
  }

  /**
   * Generate fixtures and save to file
   */
  async generateFixturesToFile(): Promise<void> {
    const fixtures = [];
    
    // Generate 5 upcoming matches
    for (let i = 0; i < 5; i++) {
      const matchData = this.generateNextMatch();
      fixtures.push({
        id: matchData.matchId,
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        kickoffTime: matchData.kickoffTime.toISOString(),
        asianHandicapOdds: matchData.odds.asianHandicap,
        fbref: { week: Math.floor(Math.random() * 38) + 1 },
        timeSeries: {
          home: { leaguePosition: Math.floor(Math.random() * 20) + 1 },
          away: { leaguePosition: Math.floor(Math.random() * 20) + 1 }
        }
      });
    }
    
    await this.dataFileService.setFixtures(fixtures);
  }

  /**
   * Start the mock fixture generator
   */
  startMockGenerator(): void {
    this.generateFixturesToFile();
    
    setInterval(() => {
      this.generateFixturesToFile();
    }, 15 * 60 * 1000); // Every 15 minutes
  }
}