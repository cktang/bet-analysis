import { Injectable } from '@nestjs/common';
import { DataFileService } from '../core/data-file.service';
import moment from 'moment';
import * as chokidar from 'chokidar';

export interface MatchFixture {
  homeTeam: string;
  awayTeam: string;
  kickoffTime: Date;
  matchId: string;
  date: string;
  league: string;
  source: string;
}

@Injectable()
export class FixtureService {
  private todaysFixtures: MatchFixture[] = [];
  private fileWatcher: chokidar.FSWatcher;

  constructor(
    private readonly dataFileService: DataFileService
  ) {}

  async onModuleInit() {
    console.log('📅 Fixture Service initialized - FILE-BASED MODE');
    
    // Load initial fixtures
    await this.loadTodaysFixtures();
    
    // Set up file watcher for triggers
    this.setupFileWatcher();
    
    console.log(`📅 Fixture Service ready with ${this.todaysFixtures.length} fixtures loaded`);
  }

  async onModuleDestroy() {
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
  }

  private setupFileWatcher() {
    // Watch for data collection triggers to refresh fixtures
    this.fileWatcher = chokidar.watch('./data/v2/data-collection-result.json');
    this.fileWatcher.on('change', async () => {
      console.log('📅 Data collection completed, refreshing fixtures...');
      await this.loadTodaysFixtures();
    });
  }

  /**
   * Load fixtures from external data source and save to file
   */
  async loadTodaysFixtures(): Promise<MatchFixture[]> {
    console.log('📅 Loading today\'s fixtures...');

    try {
      // First try to load enhanced fixtures from file
      try {
        const existingFixtures = await this.dataFileService.getFixtures();
        if (existingFixtures.length > 0) {
          console.log(`📅 Loaded ${existingFixtures.length} enhanced fixtures from file`);
          this.todaysFixtures = existingFixtures as MatchFixture[];
          return this.todaysFixtures;
        }
      } catch (error) {
        console.log('📅 No existing fixtures found, generating new ones...');
      }

      // Fallback: Generate mock fixtures (in real system this would read from external API)
      this.todaysFixtures = this.getMockFixtures();
      
      console.log(`📅 Generated ${this.todaysFixtures.length} fixtures for today`);
      
      // Write fixtures to file for other modules to consume
      await this.writeFixturesIfNeeded(this.todaysFixtures);
      
      return this.todaysFixtures;
    } catch (error) {
      console.error('❌ Error loading fixtures:', error);
      return [];
    }
  }

  /**
   * Write fixtures to file system only if no enhanced fixtures exist or they're stale
   */
  private async writeFixturesIfNeeded(fixtures: MatchFixture[]): Promise<void> {
    try {
      const existingFixtures = await this.dataFileService.getFixtures();
      
      // Check if enhanced fixtures already exist (contain asianHandicapOdds)
      const hasEnhancedFixtures = existingFixtures.length > 0 && 
        existingFixtures.some((f: any) => f.asianHandicapOdds);
      
      if (hasEnhancedFixtures) {
        console.log('📅 Enhanced fixtures already exist, not overwriting');
        return;
      }
      
      // If no enhanced fixtures, write basic fixtures for other services to consume
      console.log('📅 Writing basic fixtures to file system');
      await this.dataFileService.setFixtures(fixtures);
    } catch (error) {
      console.error('❌ Error checking/writing fixtures:', error);
      // Fallback: write fixtures anyway
      await this.dataFileService.setFixtures(fixtures);
    }
  }

  /**
   * Get matches starting within specified minutes
   */
  getMatchesInWindow(minutes: number): MatchFixture[] {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + minutes * 60 * 1000);

    return this.todaysFixtures.filter(fixture => {
      const kickoff = new Date(fixture.kickoffTime);
      return kickoff > now && kickoff <= windowEnd;
    });
  }

  /**
   * Get matches starting in 5-10 minutes (trading window)
   */
  getMatchesInTradingWindow(): MatchFixture[] {
    const now = new Date();
    const fiveMinutes = new Date(now.getTime() + 5 * 60 * 1000);
    const tenMinutes = new Date(now.getTime() + 10 * 60 * 1000);

    return this.todaysFixtures.filter(fixture => {
      const kickoff = new Date(fixture.kickoffTime);
      return kickoff >= fiveMinutes && kickoff <= tenMinutes;
    });
  }

  /**
   * Get all today's fixtures
   */
  getTodaysFixtures(): MatchFixture[] {
    return this.todaysFixtures;
  }

  private getMockFixtures(): MatchFixture[] {
    // Week 1 mock fixtures designed to trigger our proven betting strategies
    const today = moment().format('YYYY-MM-DD');
    return [
      {
        // STRATEGY TRIGGER: -0.25-Early-Away (39.73% ROI)
        // Condition: Away team on 0/-0.5 handicap in early season (week 1)
        homeTeam: 'Arsenal',
        awayTeam: 'Liverpool', 
        kickoffTime: moment().add(2, 'hours').toDate(),
        matchId: '2025-26_Arsenal_v_Liverpool',
        date: today,
        league: 'EPL',
        source: 'Enhanced_Mock_Data'
      },
      {
        // STRATEGY TRIGGER: Top8-Dynamic-Home (25.96% ROI)  
        // Condition: Home team in top 8 clashes from week 7+ (simulated as week 7)
        homeTeam: 'Manchester City',
        awayTeam: 'Chelsea',
        kickoffTime: moment().add(4, 'hours').toDate(),
        matchId: '2025-26_Manchester_City_v_Chelsea',
        date: today,
        league: 'EPL',
        source: 'Enhanced_Mock_Data'
      },
      {
        // STRATEGY TRIGGER: GiantKilling-Dynamic-High (21.02% ROI)
        // Condition: Lower team (15+) vs top 6 from week 8+ (Brighton vs Liverpool)
        homeTeam: 'Brighton',
        awayTeam: 'Liverpool',
        kickoffTime: moment().add(7, 'minutes').toDate(), // In trading window for demo
        matchId: '2025-26_Brighton_v_Liverpool',
        date: today,
        league: 'EPL',
        source: 'Enhanced_Mock_Data'
      }
    ];
  }

  private isEPLTeam(teamName: string): boolean {
    const eplTeams = [
      'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
      'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich',
      'Leicester', 'Liverpool', 'Manchester City', 'Manchester Utd',
      'Newcastle', 'Nottingham Forest', 'Southampton', 'Tottenham',
      'West Ham', 'Wolves'
    ];
    
    return eplTeams.some(team => 
      teamName.toLowerCase().includes(team.toLowerCase()) ||
      team.toLowerCase().includes(teamName.toLowerCase())
    );
  }

  /**
   * Manual refresh of fixtures
   */
  async refreshFixtures(): Promise<MatchFixture[]> {
    return await this.loadTodaysFixtures();
  }

  /**
   * Get current fixtures (alias for compatibility)
   */
  async getCurrentFixtures(): Promise<MatchFixture[]> {
    return await this.loadTodaysFixtures();
  }

  /**
   * Get fixture status for monitoring
   */
  getFixtureStatus(): any {
    const now = new Date();
    const upcoming = this.todaysFixtures.filter(f => new Date(f.kickoffTime) > now);
    const inTradingWindow = this.getMatchesInTradingWindow();

    return {
      totalFixtures: this.todaysFixtures.length,
      upcomingToday: upcoming.length,
      inTradingWindow: inTradingWindow.length,
      nextMatch: upcoming.length > 0 ? upcoming[0] : null,
      lastUpdated: Date.now()
    };
  }
}