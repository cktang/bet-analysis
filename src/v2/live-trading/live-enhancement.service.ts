import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataFileService } from '../core/data-file.service';
import { DATA_FILE_SERVICE } from './tokens';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

@Injectable()
export class LiveEnhancementService {
  private readonly logPrefix = '[LiveEnhancement]';
  private historicalData: any = {};
  private fbrefIncidentData: any = {};
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    @Inject(DATA_FILE_SERVICE) private dataFileService: DataFileService
  ) {}

  async onModuleInit() {
    console.log(`${this.logPrefix} Initializing live enhancement service...`);
    
    // Load historical data for timeline calculations
    await this.loadHistoricalData();
    
    // Set up file watcher for odds data changes
    this.setupOddsWatcher();
    
    this.isInitialized = true;
    console.log(`${this.logPrefix} Live enhancement service ready`);
  }

  /**
   * Load all historical enhanced data for timeline calculations
   */
  private async loadHistoricalData() {
    try {
      const enhancedDir = path.join(process.cwd(), 'data', 'enhanced');
      const files = fs.readdirSync(enhancedDir)
        .filter(f => f.endsWith('-enhanced.json') && f.startsWith('year-'))
        .sort();

      console.log(`${this.logPrefix} Loading ${files.length} historical files for timeline data`);

      for (const file of files) {
        const filePath = path.join(enhancedDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const season = file.replace('year-', '').replace('-enhanced.json', '');
        this.historicalData[season] = data;
      }

      const totalMatches = Object.values(this.historicalData)
        .reduce((sum: number, seasonData: any) => sum + Object.keys(seasonData.matches || {}).length, 0);
      
      console.log(`${this.logPrefix} Loaded ${totalMatches} historical matches for timeline analysis`);
    } catch (error) {
      console.error(`${this.logPrefix} Failed to load historical data:`, error);
    }
  }

  /**
   * Set up file watcher for odds-data.json changes
   */
  private setupOddsWatcher() {
    const chokidar = require('chokidar');
    const oddsFilePath = path.join(process.cwd(), 'data', 'v2', 'odds-data.json');
    
    const watcher = chokidar.watch(oddsFilePath, { 
      ignoreInitial: false,
      persistent: true 
    });

    watcher.on('change', async () => {
      if (this.isInitialized) {
        console.log(`${this.logPrefix} Odds data changed, processing enhancements...`);
        await this.processLiveOdds();
      }
    });

    console.log(`${this.logPrefix} Watching ${oddsFilePath} for changes`);
  }

  /**
   * Main enhancement processing triggered by odds data changes
   */
  private async processLiveOdds() {
    try {
      // Read current odds data
      const oddsData = await this.dataFileService.readFile('odds-data.json') as any;
      if (!oddsData?.matches?.length) {
        console.log(`${this.logPrefix} No matches in odds data, skipping enhancement`);
        return;
      }

      console.log(`${this.logPrefix} Enhancing ${oddsData.matches.length} live matches`);

      // Enhance each match
      const enhancedMatches = {};
      for (const match of oddsData.matches) {
        const enhanced = await this.enhanceMatch(match);
        if (enhanced) {
          const key = `${enhanced.preMatch.match.homeTeam}_v_${enhanced.preMatch.match.awayTeam}`;
          enhancedMatches[key] = enhanced;
        }
      }

      // Create enhanced live data structure
      const enhancedData = {
        metadata: {
          totalMatches: Object.keys(enhancedMatches).length,
          matchesWithFBRef: 0, // Will be updated as we get FBRef data
          matchesWithoutFBRef: Object.keys(enhancedMatches).length,
          matchesWithEnhancements: Object.keys(enhancedMatches).length,
          generatedAt: new Date().toISOString(),
          structure: {
            preMatch: 'Predictive analysis available before match',
            postMatch: 'Result-dependent analysis only after match completion',
            timeSeries: 'Team streaks, patterns, and historical performance'
          },
          source: 'live-odds-monitor'
        },
        matches: enhancedMatches
      };

      // Write enhanced live data
      await this.dataFileService.writeFile('enhanced-live-data.json', enhancedData as any);
      console.log(`${this.logPrefix} Generated enhanced data for ${Object.keys(enhancedMatches).length} matches`);

    } catch (error) {
      console.error(`${this.logPrefix} Enhancement processing failed:`, error);
    }
  }

  /**
   * Enhance a single match with all analytics
   */
  private async enhanceMatch(match: any): Promise<any> {
    try {
      // Create base enhanced structure
      const enhanced = {
        preMatch: {
          match: this.normalizeMatchData(match),
          fbref: {}, // Will be populated when FBRef data is available
          enhanced: {},
          marketEfficiency: {}
        },
        postMatch: {
          actualResults: {}, // Only after match completion
          performance: {},
          incidents: {},
          asianHandicapResults: {}
        },
        timeSeries: {
          home: await this.calculateTimeSeriesAnalytics(match.homeTeam),
          away: await this.calculateTimeSeriesAnalytics(match.awayTeam)
        }
      };

      // Calculate pre-match enhancements
      enhanced.preMatch.enhanced = this.calculatePreMatchEnhancements(enhanced.preMatch.match);
      enhanced.preMatch.marketEfficiency = this.calculateMarketEfficiency(enhanced.preMatch.match);

      return enhanced;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to enhance match ${match.homeTeam} vs ${match.awayTeam}:`, error);
      return null;
    }
  }

  /**
   * Normalize match data from odds monitor to enhanced format
   */
  private normalizeMatchData(match: any): any {
    return {
      eventId: match.matchId || `LIVE_${Date.now()}`,
      date: new Date().toISOString(), // Current time for live matches
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      asianHandicapOdds: {
        homeHandicap: match.handicap ? match.handicap.toString() : '0',
        homeOdds: match.homeOdds || 1.90,
        awayHandicap: match.handicap ? (-match.handicap).toString() : '0',
        awayOdds: match.awayOdds || 1.90
      },
      // Default values - will be updated when more data is available
      homeWinOdds: match.homeOdds || 2.50,
      drawOdds: 3.30,
      awayWinOdds: match.awayOdds || 2.50,
      over2_5Odds: 1.70,
      under2_5Odds: 2.10,
      source: 'live-odds-monitor',
      timestamp: match.timestamp || Date.now()
    };
  }

  /**
   * Calculate pre-match enhancements (copied from enhance-asian-handicap.js)
   */
  private calculatePreMatchEnhancements(match: any): any {
    const calculators = this.createEnhancedCalculators();
    const enhancements = {};

    // Calculate available metrics that don't require post-match data
    const preMatchMetrics = [
      'hadCut', 'ouCut', 'homeImpliedProb', 'drawImpliedProb', 'awayImpliedProb',
      'over2_5ImpliedProb', 'under2_5ImpliedProb'
    ];

    preMatchMetrics.forEach(metric => {
      try {
        if (calculators[metric]) {
          enhancements[metric] = calculators[metric]({ match, enhanced: enhancements });
        }
      } catch (error) {
        // Metric calculation failed, skip
      }
    });

    return enhancements;
  }

  /**
   * Calculate market efficiency metrics
   */
  private calculateMarketEfficiency(match: any): any {
    return {
      ahHandicap: this.handicapConverter(match.asianHandicapOdds.homeHandicap),
      efficiency: {
        ahCut: this.findCut([match.asianHandicapOdds.homeOdds, match.asianHandicapOdds.awayOdds]),
        hadCut: this.findCut([match.homeWinOdds, match.drawOdds, match.awayWinOdds]),
        ouCut: this.findCut([match.over2_5Odds, match.under2_5Odds])
      },
      timestamp: Date.now()
    };
  }

  /**
   * Calculate timeline analytics for a team (copied from merge-football-data-json.js)
   */
  private async calculateTimeSeriesAnalytics(teamName: string): Promise<any> {
    try {
      // Initialize team stats structure
      const teamStats = this.initializeTeamStats(teamName);
      
      // Process historical matches to build timeline
      await this.buildTeamTimeline(teamName, teamStats);
      
      // Calculate pre-match analytics
      const analytics = this.calculatePreMatchAnalytics(teamStats);
      
      return analytics;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to calculate timeline for ${teamName}:`, error);
      return this.getDefaultTeamStats();
    }
  }

  /**
   * Initialize team statistics structure
   */
  private initializeTeamStats(teamName: string): any {
    return {
      teamName,
      matches: [],
      currentStreaks: {
        win: 0,
        loss: 0,
        draw: 0,
        homeWin: 0,
        awayWin: 0,
        ahWin: 0,
        ahLoss: 0,
        over2_5: 0,
        under2_5: 0,
        cleanSheet: 0,
        scored: 0
      },
      cumulative: {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        xgFor: 0,
        xgAgainst: 0
      },
      recentForm: {
        last5: [],
        last10: []
      },
      leaguePosition: {
        current: null,
        trend: 'stable'
      }
    };
  }

  /**
   * Build team timeline from historical data
   */
  private async buildTeamTimeline(teamName: string, teamStats: any): Promise<void> {
    // Process matches from all seasons chronologically
    const allMatches = [];
    
    Object.keys(this.historicalData).forEach(season => {
      const seasonData = this.historicalData[season];
      if (seasonData.matches) {
        Object.values(seasonData.matches).forEach((match: any) => {
          if (match.preMatch?.match?.homeTeam === teamName || 
              match.preMatch?.match?.awayTeam === teamName) {
            allMatches.push({
              ...match,
              season,
              isHome: match.preMatch.match.homeTeam === teamName
            });
          }
        });
      }
    });

    // Sort by date
    allMatches.sort((a, b) => {
      const dateA = new Date(a.preMatch?.match?.date || 0);
      const dateB = new Date(b.preMatch?.match?.date || 0);
      return dateA.getTime() - dateB.getTime();
    });

    // Update team stats with each match
    allMatches.forEach(match => {
      this.updateTeamStreaks(teamStats, match);
    });
  }

  /**
   * Update team streaks and cumulative stats
   */
  private updateTeamStreaks(teamStats: any, match: any): void {
    const isHome = match.isHome;
    const homeGoals = match.postMatch?.actualResults?.homeGoals || 0;
    const awayGoals = match.postMatch?.actualResults?.awayGoals || 0;
    
    const teamGoals = isHome ? homeGoals : awayGoals;
    const opponentGoals = isHome ? awayGoals : homeGoals;
    
    // Update cumulative stats
    teamStats.cumulative.played++;
    teamStats.cumulative.goalsFor += teamGoals;
    teamStats.cumulative.goalsAgainst += opponentGoals;
    
    // Determine match result
    let result = 'draw';
    if (teamGoals > opponentGoals) {
      result = 'win';
      teamStats.cumulative.won++;
      teamStats.cumulative.points += 3;
    } else if (teamGoals < opponentGoals) {
      result = 'loss';
      teamStats.cumulative.lost++;
    } else {
      teamStats.cumulative.drawn++;
      teamStats.cumulative.points += 1;
    }
    
    // Update streaks
    this.updateStreakCounters(teamStats.currentStreaks, result, isHome, teamGoals, opponentGoals);
    
    // Update recent form
    teamStats.recentForm.last5.push(result);
    if (teamStats.recentForm.last5.length > 5) {
      teamStats.recentForm.last5.shift();
    }
    
    teamStats.recentForm.last10.push(result);
    if (teamStats.recentForm.last10.length > 10) {
      teamStats.recentForm.last10.shift();
    }
  }

  /**
   * Update streak counters
   */
  private updateStreakCounters(streaks: any, result: string, isHome: boolean, teamGoals: number, opponentGoals: number): void {
    // Reset opposing streaks
    if (result === 'win') {
      streaks.win++;
      streaks.loss = 0;
      streaks.draw = 0;
      if (isHome) streaks.homeWin++;
      else streaks.awayWin++;
    } else if (result === 'loss') {
      streaks.loss++;
      streaks.win = 0;
      streaks.draw = 0;
      streaks.homeWin = 0;
      streaks.awayWin = 0;
    } else {
      streaks.draw++;
      streaks.win = 0;
      streaks.loss = 0;
      streaks.homeWin = 0;
      streaks.awayWin = 0;
    }
    
    // Update goal-related streaks
    if (teamGoals > 0) {
      streaks.scored++;
    } else {
      streaks.scored = 0;
    }
    
    if (opponentGoals === 0) {
      streaks.cleanSheet++;
    } else {
      streaks.cleanSheet = 0;
    }
    
    // Update over/under streaks
    const totalGoals = teamGoals + opponentGoals;
    if (totalGoals > 2.5) {
      streaks.over2_5++;
      streaks.under2_5 = 0;
    } else {
      streaks.under2_5++;
      streaks.over2_5 = 0;
    }
  }

  /**
   * Calculate pre-match analytics from team stats
   */
  private calculatePreMatchAnalytics(teamStats: any): any {
    const stats = teamStats.cumulative;
    const streaks = teamStats.currentStreaks;
    
    return {
      // Form metrics
      currentForm: {
        winStreak: streaks.win,
        lossStreak: streaks.loss,
        drawStreak: streaks.draw,
        homeWinStreak: streaks.homeWin,
        awayWinStreak: streaks.awayWin,
        scoredStreak: streaks.scored,
        cleanSheetStreak: streaks.cleanSheet
      },
      
      // Performance metrics
      performance: {
        played: stats.played,
        winRate: stats.played > 0 ? _.round((stats.won / stats.played) * 100, 1) : 0,
        goalsPerGame: stats.played > 0 ? _.round(stats.goalsFor / stats.played, 2) : 0,
        concededPerGame: stats.played > 0 ? _.round(stats.goalsAgainst / stats.played, 2) : 0,
        pointsPerGame: stats.played > 0 ? _.round(stats.points / stats.played, 2) : 0
      },
      
      // Recent form
      recentForm: {
        last5: teamStats.recentForm.last5,
        last5WinRate: this.calculateFormWinRate(teamStats.recentForm.last5),
        last10WinRate: this.calculateFormWinRate(teamStats.recentForm.last10)
      },
      
      // League context
      leaguePosition: teamStats.leaguePosition,
      
      // Timestamp
      calculatedAt: Date.now()
    };
  }

  /**
   * Calculate win rate from form array
   */
  private calculateFormWinRate(form: string[]): number {
    if (form.length === 0) return 0;
    const wins = form.filter(result => result === 'win').length;
    return _.round((wins / form.length) * 100, 1);
  }

  /**
   * Get default team stats when data is unavailable
   */
  private getDefaultTeamStats(): any {
    return {
      currentForm: { winStreak: 0, lossStreak: 0, drawStreak: 0 },
      performance: { played: 0, winRate: 0, goalsPerGame: 0, concededPerGame: 0 },
      recentForm: { last5: [], last5WinRate: 0, last10WinRate: 0 },
      leaguePosition: { current: null, trend: 'stable' },
      calculatedAt: Date.now()
    };
  }

  /**
   * Enhanced calculators (copied from enhance-asian-handicap.js)
   */
  private createEnhancedCalculators(): any {
    return {
      // Home/Away/Draw cut percentage
      hadCut: (match: any) => {
        const odds = [match.match.homeWinOdds, match.match.drawOdds, match.match.awayWinOdds];
        return this.findCut(odds.filter(o => o && o > 0));
      },

      // Over/Under cut percentage  
      ouCut: (match: any) => {
        const odds = [match.match.over2_5Odds, match.match.under2_5Odds];
        return this.findCut(odds.filter(o => o && o > 0));
      },

      // Implied probabilities from odds
      homeImpliedProb: (match: any) => {
        return match.match.homeWinOdds ? _.round(100 / match.match.homeWinOdds, 2) : null;
      },

      drawImpliedProb: (match: any) => {
        return match.match.drawOdds ? _.round(100 / match.match.drawOdds, 2) : null;
      },

      awayImpliedProb: (match: any) => {
        return match.match.awayWinOdds ? _.round(100 / match.match.awayWinOdds, 2) : null;
      },

      over2_5ImpliedProb: (match: any) => {
        return match.match.over2_5Odds ? _.round(100 / match.match.over2_5Odds, 2) : null;
      },

      under2_5ImpliedProb: (match: any) => {
        return match.match.under2_5Odds ? _.round(100 / match.match.under2_5Odds, 2) : null;
      }
    };
  }

  /**
   * Convert handicap string to numerical value (copied from enhance-asian-handicap.js)
   */
  private handicapConverter(handicap: any): number {
    if (!handicap) return 0;
    
    // If it's already a number, return it
    if (typeof handicap === 'number') return handicap;
    
    // Handle string handicaps like "+0.5/+1", "-0.5/-1", "0", "+0.5", "-0.25", etc.
    let handicapStr = String(handicap);
    
    // Remove brackets if present
    handicapStr = handicapStr.replace(/[\[\]]/g, '');
    
    // Check if it contains a slash (quarter handicap)
    if (handicapStr.includes('/')) {
      // Split on slash and convert each part
      const parts = handicapStr.split('/');
      const numbers = parts.map(part => {
        // Remove + sign and convert to number
        const num = parseFloat(part.replace(/^\+/, ''));
        return isNaN(num) ? 0 : num;
      });
      // Return average of the two handicaps
      return _.mean(numbers);
    } else {
      // Simple handicap - just convert to number
      const num = parseFloat(handicapStr.replace(/^\+/, ''));
      return isNaN(num) ? 0 : num;
    }
  }

  /**
   * Calculate cut percentage for odds (copied from enhance-asian-handicap.js)
   */
  private findCut(values: number[]): number {
    const sum = _.sum(values.map(n => 1 / Number(n)));
    return _.round(100 * (sum - 1), 2);
  }

  /**
   * Public method to get current enhanced live data
   */
  async getEnhancedLiveData(): Promise<any> {
    try {
      return await this.dataFileService.readFile('enhanced-live-data.json');
    } catch (error) {
      console.warn(`${this.logPrefix} No enhanced live data available yet`);
      return null;
    }
  }

  /**
   * Public method to trigger manual enhancement
   */
  async enhanceCurrentOdds(): Promise<void> {
    await this.processLiveOdds();
  }
}