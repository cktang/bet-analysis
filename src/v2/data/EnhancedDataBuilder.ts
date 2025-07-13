import fs from 'fs';
import path from 'path';
import { eventBus } from '../coordinator/EventBus';
import { OddsSnapshot } from '../monitoring/OddsMonitor';

export interface EnhancedMatch {
  match: {
    eventId: string;
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    asianHandicapOdds: {
      homeHandicap: string;
      homeOdds: number;
      awayHandicap: string;
      awayOdds: number;
    };
    homeWinOdds?: number;
    drawOdds?: number;
    awayWinOdds?: number;
    over2_5Odds?: number;
    under2_5Odds?: number;
    filePath?: string;
  };
  fbref?: any;
  enhanced: {
    preMatch: any;
    postMatch?: any;
  };
  timeSeries?: any;
}

export interface EnhancedDataFile {
  metadata: {
    totalMatches: number;
    matchesWithFBRef: number;
    matchesWithoutFBRef: number;
    matchesWithEnhancements: number;
    generatedAt: string;
    structure: {
      preMatch: string;
      postMatch: string;
      timeSeries: string;
    };
  };
  matches: Record<string, EnhancedMatch>;
}

/**
 * Enhanced Data Builder for real-time enhanced data generation
 * Creates data compatible with existing strategy system
 */
export class EnhancedDataBuilder {
  private dataDir: string;
  private templateData: EnhancedDataFile | null = null;
  private liveMatches: Map<string, EnhancedMatch> = new Map();

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.loadTemplate();
    
    // Listen for odds updates
    eventBus.onOddsUpdate(this.handleOddsUpdate.bind(this));
    
    eventBus.emitModuleStatus({
      moduleName: 'EnhancedDataBuilder',
      status: 'online',
      message: 'Enhanced data builder initialized'
    });
  }

  /**
   * Load existing enhanced data as template
   */
  private async loadTemplate(): Promise<void> {
    try {
      // Load the most recent enhanced data file as template
      const enhancedDir = path.join(this.dataDir, 'enhanced');
      const files = fs.readdirSync(enhancedDir)
        .filter(f => f.endsWith('-enhanced.json'))
        .sort()
        .reverse();

      if (files.length > 0) {
        const templatePath = path.join(enhancedDir, files[0]);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        this.templateData = JSON.parse(templateContent);
        console.log(`Loaded template from: ${files[0]}`);
      }
    } catch (error) {
      console.error('Error loading template data:', error);
      eventBus.emitSystemAlert({
        severity: 'warning',
        message: 'Could not load enhanced data template',
        details: error,
        source: 'EnhancedDataBuilder'
      });
    }
  }

  /**
   * Handle odds update events
   */
  private handleOddsUpdate(event: any): void {
    try {
      this.updateLiveMatch(event);
      this.generateLiveEnhancedData();
    } catch (error) {
      console.error('Error handling odds update:', error);
      eventBus.emitSystemAlert({
        severity: 'error',
        message: 'Failed to process odds update',
        details: error,
        source: 'EnhancedDataBuilder'
      });
    }
  }

  /**
   * Update live match data
   */
  private updateLiveMatch(oddsEvent: any): void {
    const matchKey = `${oddsEvent.homeTeam} v ${oddsEvent.awayTeam}`;
    
    let liveMatch = this.liveMatches.get(matchKey);
    
    if (!liveMatch) {
      // Create new live match based on template structure
      liveMatch = this.createLiveMatchFromOdds(oddsEvent);
    } else {
      // Update existing match odds
      liveMatch.match.asianHandicapOdds = {
        homeHandicap: this.formatHandicap(oddsEvent.odds.homeHandicap),
        homeOdds: oddsEvent.odds.homeOdds,
        awayHandicap: this.formatHandicap(oddsEvent.odds.awayHandicap),
        awayOdds: oddsEvent.odds.awayOdds
      };
    }

    this.liveMatches.set(matchKey, liveMatch);
    
    console.log(`Updated live match: ${matchKey}`);
  }

  /**
   * Create live match from odds data using template structure
   */
  private createLiveMatchFromOdds(oddsEvent: any): EnhancedMatch {
    const now = new Date();
    const matchKey = `${oddsEvent.homeTeam} v ${oddsEvent.awayTeam}`;

    // Generate enhanced pre-match data using template patterns
    const preMatchData = this.generatePreMatchData(oddsEvent);

    return {
      match: {
        eventId: oddsEvent.matchId,
        date: oddsEvent.kickoffTime || now.toISOString(),
        homeTeam: oddsEvent.homeTeam,
        awayTeam: oddsEvent.awayTeam,
        asianHandicapOdds: {
          homeHandicap: this.formatHandicap(oddsEvent.odds.homeHandicap),
          homeOdds: oddsEvent.odds.homeOdds,
          awayHandicap: this.formatHandicap(oddsEvent.odds.awayHandicap),
          awayOdds: oddsEvent.odds.awayOdds
        }
      },
      enhanced: {
        preMatch: preMatchData
      },
      timeSeries: this.generateTimeSeriesData(oddsEvent.homeTeam, oddsEvent.awayTeam)
    };
  }

  /**
   * Generate pre-match data using template patterns and historical data
   */
  private generatePreMatchData(oddsEvent: any): any {
    if (!this.templateData) {
      return this.createBasicPreMatchData(oddsEvent);
    }

    // Find similar matches in template for pattern extraction
    const templateMatches = Object.values(this.templateData.matches);
    const homeTemplateMatch = templateMatches.find(m => 
      m.match.homeTeam === oddsEvent.homeTeam || m.match.awayTeam === oddsEvent.homeTeam
    );
    const awayTemplateMatch = templateMatches.find(m => 
      m.match.homeTeam === oddsEvent.awayTeam || m.match.awayTeam === oddsEvent.awayTeam
    );

    // Extract pre-match structure from template
    let preMatchTemplate = templateMatches[0]?.enhanced?.preMatch || {};
    
    if (homeTemplateMatch?.enhanced?.preMatch) {
      preMatchTemplate = { ...preMatchTemplate, ...homeTemplateMatch.enhanced.preMatch };
    }

    // Generate live pre-match data
    return {
      match: {
        league: 'Premier League',
        season: '2024-25',
        gameweek: this.getCurrentGameweek(),
        venue: 'TBD',
        referee: 'TBD',
        asianHandicapOdds: {
          homeHandicap: this.formatHandicap(oddsEvent.odds.homeHandicap),
          homeOdds: oddsEvent.odds.homeOdds,
          awayHandicap: this.formatHandicap(oddsEvent.odds.awayHandicap),
          awayOdds: oddsEvent.odds.awayOdds
        }
      },
      analysis: {
        marketAnalysis: this.analyzeMarket(oddsEvent),
        formAnalysis: this.generateFormAnalysis(oddsEvent.homeTeam, oddsEvent.awayTeam),
        headToHead: this.generateHeadToHeadAnalysis(oddsEvent.homeTeam, oddsEvent.awayTeam),
        predictions: this.generatePredictions(oddsEvent)
      },
      factors: this.generateFactors(oddsEvent),
      ...preMatchTemplate
    };
  }

  /**
   * Generate basic pre-match data when no template is available
   */
  private createBasicPreMatchData(oddsEvent: any): any {
    return {
      match: {
        league: 'Premier League',
        season: '2024-25',
        gameweek: this.getCurrentGameweek(),
        asianHandicapOdds: {
          homeHandicap: this.formatHandicap(oddsEvent.odds.homeHandicap),
          homeOdds: oddsEvent.odds.homeOdds,
          awayHandicap: this.formatHandicap(oddsEvent.odds.awayHandicap),
          awayOdds: oddsEvent.odds.awayOdds
        }
      },
      analysis: {
        marketAnalysis: this.analyzeMarket(oddsEvent),
        timestamp: Date.now()
      },
      factors: this.generateFactors(oddsEvent)
    };
  }

  /**
   * Generate time series data from historical records
   */
  private generateTimeSeriesData(homeTeam: string, awayTeam: string): any {
    if (!this.templateData) {
      return {
        [homeTeam]: { recentForm: [], seasonStats: {} },
        [awayTeam]: { recentForm: [], seasonStats: {} }
      };
    }

    // Extract time series data from template for these teams
    const timeSeriesData: any = {};
    
    Object.values(this.templateData.matches).forEach(match => {
      if (match.timeSeries) {
        if (match.match.homeTeam === homeTeam || match.match.awayTeam === homeTeam) {
          timeSeriesData[homeTeam] = match.timeSeries[homeTeam] || {};
        }
        if (match.match.homeTeam === awayTeam || match.match.awayTeam === awayTeam) {
          timeSeriesData[awayTeam] = match.timeSeries[awayTeam] || {};
        }
      }
    });

    return timeSeriesData;
  }

  /**
   * Analyze market conditions
   */
  private analyzeMarket(oddsEvent: any): any {
    const homeImpliedProb = 1 / oddsEvent.odds.homeOdds;
    const awayImpliedProb = 1 / oddsEvent.odds.awayOdds;
    const totalProb = homeImpliedProb + awayImpliedProb;
    const margin = totalProb - 1;

    return {
      homeImpliedProbability: homeImpliedProb,
      awayImpliedProbability: awayImpliedProb,
      bookmakerMargin: margin,
      handicapType: this.classifyHandicap(oddsEvent.odds.homeHandicap),
      marketEfficiency: this.assessMarketEfficiency(oddsEvent),
      timestamp: Date.now()
    };
  }

  /**
   * Generate form analysis
   */
  private generateFormAnalysis(homeTeam: string, awayTeam: string): any {
    // This would typically pull from historical data
    // For now, return placeholder structure
    return {
      homeForm: { recent: [], trend: 'neutral' },
      awayForm: { recent: [], trend: 'neutral' },
      comparative: { advantage: 'neutral' }
    };
  }

  /**
   * Generate head-to-head analysis
   */
  private generateHeadToHeadAnalysis(homeTeam: string, awayTeam: string): any {
    return {
      lastMeetings: [],
      homeAdvantage: 0,
      trends: []
    };
  }

  /**
   * Generate predictions
   */
  private generatePredictions(oddsEvent: any): any {
    return {
      outcome: 'uncertain',
      confidence: 0.5,
      factors: ['odds_analysis']
    };
  }

  /**
   * Generate factors for strategy evaluation
   */
  private generateFactors(oddsEvent: any): any {
    const handicap = oddsEvent.odds.homeHandicap;
    
    return {
      handicapLevel: this.classifyHandicap(handicap),
      oddsLevel: this.classifyOdds(oddsEvent.odds.homeOdds),
      marketType: this.determineMarketType(handicap),
      isQuarterHandicap: this.isQuarterHandicap(handicap),
      favorite: handicap < 0 ? 'home' : 'away',
      underdog: handicap < 0 ? 'away' : 'home'
    };
  }

  /**
   * Format handicap for display
   */
  private formatHandicap(handicap: number): string {
    if (handicap === 0) return '0';
    if (handicap % 1 === 0) return handicap.toString();
    
    // Handle quarter handicaps
    if (Math.abs(handicap % 0.5) < 0.01) {
      const whole = Math.floor(Math.abs(handicap));
      const sign = handicap >= 0 ? '+' : '-';
      
      if (whole === 0) {
        return handicap > 0 ? '+0.5' : '-0.5';
      } else {
        return `${sign}${whole}/+${whole + 0.5}`;
      }
    }
    
    return handicap.toString();
  }

  /**
   * Classify handicap type
   */
  private classifyHandicap(handicap: number): string {
    const absHandicap = Math.abs(handicap);
    
    if (absHandicap === 0) return 'level';
    if (absHandicap <= 0.5) return 'quarter';
    if (absHandicap <= 1) return 'half_one';
    if (absHandicap <= 1.5) return 'one_onehalf';
    return 'strong';
  }

  /**
   * Classify odds level
   */
  private classifyOdds(odds: number): string {
    if (odds <= 1.5) return 'very_low';
    if (odds <= 1.8) return 'low';
    if (odds <= 2.2) return 'medium';
    if (odds <= 3.0) return 'high';
    return 'very_high';
  }

  /**
   * Determine market type
   */
  private determineMarketType(handicap: number): string {
    if (Math.abs(handicap % 0.25) < 0.01) return 'quarter_handicap';
    if (Math.abs(handicap % 0.5) < 0.01) return 'half_handicap';
    return 'full_handicap';
  }

  /**
   * Check if quarter handicap
   */
  private isQuarterHandicap(handicap: number): boolean {
    return Math.abs(handicap % 0.25) < 0.01 && Math.abs(handicap % 0.5) >= 0.01;
  }

  /**
   * Assess market efficiency
   */
  private assessMarketEfficiency(oddsEvent: any): string {
    const margin = (1 / oddsEvent.odds.homeOdds) + (1 / oddsEvent.odds.awayOdds) - 1;
    
    if (margin < 0.03) return 'efficient';
    if (margin < 0.06) return 'moderate';
    return 'inefficient';
  }

  /**
   * Get current gameweek
   */
  private getCurrentGameweek(): number {
    // Simple calculation - would be more sophisticated in production
    const seasonStart = new Date('2024-08-15');
    const now = new Date();
    const weeksSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSinceStart + 1, 1), 38);
  }

  /**
   * Generate live enhanced data file
   */
  public async generateLiveEnhancedData(): Promise<void> {
    if (this.liveMatches.size === 0) {
      return;
    }

    const enhancedData: EnhancedDataFile = {
      metadata: {
        totalMatches: this.liveMatches.size,
        matchesWithFBRef: 0,
        matchesWithoutFBRef: this.liveMatches.size,
        matchesWithEnhancements: this.liveMatches.size,
        generatedAt: new Date().toISOString(),
        structure: {
          preMatch: "Live predictive analysis available before match",
          postMatch: "Result-dependent analysis only after match completion",
          timeSeries: "Team streaks, patterns, and historical performance"
        }
      },
      matches: {}
    };

    // Convert live matches to enhanced format
    for (const [matchKey, match] of this.liveMatches) {
      enhancedData.matches[matchKey] = match;
    }

    // Save to live enhanced data file
    const today = new Date().toISOString().split('T')[0];
    const filePath = path.join(this.dataDir, 'enhanced', `live-${today}.json`);
    
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(enhancedData, null, 2));
      console.log(`Generated live enhanced data: ${filePath}`);
      
      // Also save to live directory for quick access
      const liveFilePath = path.join(this.dataDir, 'live', 'live-enhanced.json');
      await fs.promises.writeFile(liveFilePath, JSON.stringify(enhancedData, null, 2));
      
    } catch (error) {
      console.error('Error saving live enhanced data:', error);
      eventBus.emitSystemAlert({
        severity: 'error',
        message: 'Failed to save live enhanced data',
        details: error,
        source: 'EnhancedDataBuilder'
      });
    }
  }

  /**
   * Get current live enhanced data
   */
  public getLiveEnhancedData(): EnhancedDataFile | null {
    if (this.liveMatches.size === 0) {
      return null;
    }

    const enhancedData: EnhancedDataFile = {
      metadata: {
        totalMatches: this.liveMatches.size,
        matchesWithFBRef: 0,
        matchesWithoutFBRef: this.liveMatches.size,
        matchesWithEnhancements: this.liveMatches.size,
        generatedAt: new Date().toISOString(),
        structure: {
          preMatch: "Live predictive analysis available before match",
          postMatch: "Result-dependent analysis only after match completion",
          timeSeries: "Team streaks, patterns, and historical performance"
        }
      },
      matches: {}
    };

    for (const [matchKey, match] of this.liveMatches) {
      enhancedData.matches[matchKey] = match;
    }

    return enhancedData;
  }

  /**
   * Clear old live matches
   */
  public clearOldMatches(): void {
    // Clear matches older than 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const [matchKey, match] of this.liveMatches) {
      const matchTime = new Date(match.match.date).getTime();
      if (matchTime < cutoff) {
        this.liveMatches.delete(matchKey);
      }
    }
  }
}