import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DataFileService } from '../core/data-file.service';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { DATA_FILE_SERVICE } from './tokens';
import { LiveEnhancementService } from './live-enhancement.service';
import moment from 'moment-timezone';

@Injectable()
export class BettingDecisionService implements OnModuleInit {
    private oddsWatcher: chokidar.FSWatcher | null = null;

  constructor(
    @Inject(DATA_FILE_SERVICE) private dataFileService: DataFileService,
    private liveEnhancementService: LiveEnhancementService
  ) {}

  async onModuleInit(): Promise<void> {
    console.log('🎯 BettingDecisionService: Starting decision engine automatically on module init');
    await this.startDecisionEngine();
  }

  // Parse HKJC local time (Hong Kong timezone) and convert to UTC
  private parseMatchDate(dateString: string): string | null {
    // console.log(`🕐 Parsing HKJC local time: "${dateString}"`);
    // Parse as Hong Kong time (UTC+8)
    const parsed = moment.tz(dateString, 'DD/MM/YYYY HH:mm', 'Asia/Hong_Kong');
    
    if (parsed.isValid()) {
      const utcTime = parsed.utc().toISOString();
      // console.log(`✅ Parsed HK time "${dateString}" to UTC: ${utcTime}`);
      return utcTime;
    } else {
      console.log(`❌ Failed to parse "${dateString}", returning null`);
      return null;
    }
  }

  async startDecisionEngine(): Promise<void> {
    await this.dataFileService.writeLog('info', 'Starting betting decision engine');
    
    // Watch enhanced-live-data.json for betting opportunities
    const enhancedPath = path.join(process.cwd(), 'data', 'v2', 'enhanced-live-data.json');
    this.oddsWatcher = chokidar.watch(enhancedPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    });

    this.oddsWatcher.on('change', async () => {
      console.log('🎯 🚨 ODDS DATA UPDATED - EVALUATING BETTING OPPORTUNITIES! 🚨');
      await this.processOddsUpdate();
    });
    
    // Initial processing - check for immediate betting opportunities
    await this.processOddsUpdate();
    
    // Process every minute using real odds data
    setInterval(async () => {
      await this.processOddsUpdate();
    }, 60 * 1000);
  }

  private async processOddsUpdate(): Promise<void> {
    console.log('🎯 processOddsUpdate() called - evaluating all current matches for betting opportunities');
    
    try {
      // Read enhanced live data
      const enhancedData = await this.liveEnhancementService.getEnhancedLiveData();
      if (!enhancedData || !enhancedData.matches) {
        console.log('🎯 No enhanced live data found, trying to generate it...');
        await this.liveEnhancementService.enhanceCurrentOdds();
        return; // Will be triggered again when enhanced data is created
      }
      
      const matches = Object.values(enhancedData.matches);
      console.log(`🎯 Found ${matches.length} enhanced matches`);
      
      // Get current strategies
      const strategies = await this.dataFileService.getStrategies();
      console.log(`🎯 Evaluating ${strategies.length} strategies against ${matches.length} matches`);
      
      const decisions: any[] = [];
      
      // Evaluate each match against each strategy
      for (const match of matches) {
        for (const strategy of strategies) {
          try {
            const enhancedMatch = match as any;
            const shouldBet = this.evaluateEnhancedMatchStrategy(enhancedMatch, strategy);
            
            if (shouldBet) {
              const matchData = enhancedMatch.preMatch.match;
              
              // Use current time as kickoff for live matches (will be updated when real schedule data is available)
              const kickoffTime = matchData.date || new Date().toISOString();
              
              const decision = {
                id: `decision_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                matchId: matchData.eventId,
                homeTeam: matchData.homeTeam,
                awayTeam: matchData.awayTeam,
                strategyName: (strategy as any).name,
                betSide: this.getBetSideForEnhancedMatch(enhancedMatch, strategy),
                stake: this.calculateStakeForEnhancedMatch(enhancedMatch, strategy),
                odds: this.getOddsForEnhancedMatch(enhancedMatch, strategy),
                handicap: enhancedMatch.preMatch.marketEfficiency.ahHandicap,
                kickoffTime: kickoffTime,
                timestamp: new Date().toISOString(),
                source: 'enhanced-live-data'
              };
              
              decisions.push(decision);
              console.log(`🎯BETTING DECISION: ${decision.strategyName} -> ${decision.homeTeam} vs ${decision.awayTeam} -> BET ${decision.betSide.toUpperCase()} @ ${decision.odds}`);
            }
          } catch (error) {
            const enhancedMatch = match as any;
            console.error(`❌ Error evaluating ${enhancedMatch.preMatch?.match?.homeTeam} vs ${enhancedMatch.preMatch?.match?.awayTeam} with strategy ${(strategy as any).name}:`, error);
          }
        }
      }
      
      if (decisions.length > 0) {
        await this.dataFileService.setBetDecisions(decisions);
        console.log(`🎯 Successfully saved ${decisions.length} betting decisions`);
      } else {
        console.log('🎯 No betting opportunities found in current matches');
      }
      
    } catch (error) {
      console.error('❌ Error processing odds update:', error);
    }
  }

  private evaluateMatchStrategy(match: any, strategy: any): boolean {
    try {
      // Simple evaluation for odds-based matches (mock strategies work with match ID patterns)
      for (const factor of strategy.factors || []) {
        // Create evaluation context with match data
        const context = {
          match,
          parseInt,
          Math,
          // Add match properties directly for easier access
          ...match
        };
        
        try {
          // Safely evaluate the expression
          const func = new Function(...Object.keys(context), `return ${factor.expression}`);
          const result = func(...Object.values(context));
          
          if (!result) {
            return false;
          }
        } catch (evalError) {
          console.error(`Factor evaluation failed for ${factor.expression}:`, evalError);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error(`Strategy evaluation failed:`, error);
      return false;
    }
  }

  private getBetSideForMatch(match: any, strategy: any): string {
    if (strategy.side.betSide === 'home' || strategy.side.betSide === 'away') {
      return strategy.side.betSide;
    }
    
    // For dynamic side (higherOdds)
    if (strategy.side.key === 'higherOdds') {
      return match.homeOdds > match.awayOdds ? 'home' : 'away';
    }
    
    return 'home';
  }

  private calculateStakeForMatch(match: any, strategy: any): number {
    if (strategy.size.stakingMethod === 'fixed') {
      return parseInt(strategy.size.expression);
    }
    
    if (strategy.size.stakingMethod === 'variable') {
      try {
        const context = { match, parseInt, Math, ...match };
        const func = new Function(...Object.keys(context), `return ${strategy.size.expression}`);
        return func(...Object.values(context));
      } catch (error) {
        return 200; // Default stake
      }
    }
    
    return 200;
  }

  private getOddsForMatch(match: any, strategy: any): number {
    const betSide = this.getBetSideForMatch(match, strategy);
    return betSide === 'home' ? match.homeOdds : match.awayOdds;
  }

  // Enhanced match evaluation methods
  private evaluateEnhancedMatchStrategy(match: any, strategy: any): boolean {
    try {
      // Evaluate using enhanced data structure
      for (const factor of strategy.factors || []) {
        // Create evaluation context with enhanced match data
        const context = {
          match: match.preMatch.match,
          enhanced: match.preMatch.enhanced,
          marketEfficiency: match.preMatch.marketEfficiency,
          timeSeries: match.timeSeries,
          home: match.timeSeries.home,
          away: match.timeSeries.away,
          parseInt,
          Math,
          // Flattened access for easier factor expression writing
          homeTeam: match.preMatch.match.homeTeam,
          awayTeam: match.preMatch.match.awayTeam,
          homeOdds: match.preMatch.match.asianHandicapOdds.homeOdds,
          awayOdds: match.preMatch.match.asianHandicapOdds.awayOdds,
          handicap: match.preMatch.marketEfficiency.ahHandicap,
          // Add enhanced metrics
          homeImpliedProb: match.preMatch.enhanced.homeImpliedProb,
          awayImpliedProb: match.preMatch.enhanced.awayImpliedProb,
          hadCut: match.preMatch.enhanced.hadCut,
          // Add timeline metrics
          homeWinStreak: match.timeSeries.home.currentForm?.winStreak || 0,
          awayWinStreak: match.timeSeries.away.currentForm?.winStreak || 0,
          homeWinRate: match.timeSeries.home.performance?.winRate || 0,
          awayWinRate: match.timeSeries.away.performance?.winRate || 0,
          homeGoalsPerGame: match.timeSeries.home.performance?.goalsPerGame || 0,
          awayGoalsPerGame: match.timeSeries.away.performance?.goalsPerGame || 0
        };
        
        try {
          // Safely evaluate the expression
          const func = new Function(...Object.keys(context), `return ${factor.expression}`);
          const result = func(...Object.values(context));
          
          if (!result) {
            return false;
          }
        } catch (evalError) {
          console.error(`Enhanced factor evaluation failed for ${factor.expression}:`, evalError);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error(`Enhanced strategy evaluation failed:`, error);
      return false;
    }
  }

  private getBetSideForEnhancedMatch(match: any, strategy: any): string {
    if (strategy.side.betSide === 'home' || strategy.side.betSide === 'away') {
      return strategy.side.betSide;
    }
    
    // For dynamic side (higherOdds)
    if (strategy.side.key === 'higherOdds') {
      const homeOdds = match.preMatch.match.asianHandicapOdds.homeOdds;
      const awayOdds = match.preMatch.match.asianHandicapOdds.awayOdds;
      return homeOdds > awayOdds ? 'home' : 'away';
    }
    
    return 'home';
  }

  private calculateStakeForEnhancedMatch(match: any, strategy: any): number {
    if (strategy.size.stakingMethod === 'fixed') {
      return parseInt(strategy.size.expression);
    }
    
    if (strategy.size.stakingMethod === 'dynamic') {
      try {
        // Create context for dynamic staking calculation
        const context = {
          match: match.preMatch.match,
          enhanced: match.preMatch.enhanced,
          timeSeries: match.timeSeries,
          homeOdds: match.preMatch.match.asianHandicapOdds.homeOdds,
          awayOdds: match.preMatch.match.asianHandicapOdds.awayOdds,
          parseInt,
          Math
        };
        
        const func = new Function(...Object.keys(context), `return ${strategy.size.expression}`);
        return func(...Object.values(context));
      } catch (error) {
        return 200; // Default stake
      }
    }
    
    return 200;
  }

  private getOddsForEnhancedMatch(match: any, strategy: any): number {
    const betSide = this.getBetSideForEnhancedMatch(match, strategy);
    const homeOdds = match.preMatch.match.asianHandicapOdds.homeOdds;
    const awayOdds = match.preMatch.match.asianHandicapOdds.awayOdds;
    return betSide === 'home' ? homeOdds : awayOdds;
  }

  async stopDecisionEngine(): Promise<void> {
    if (this.oddsWatcher) {
      await this.oddsWatcher.close();
      this.oddsWatcher = null;
    }
    await this.dataFileService.writeLog('info', 'Stopped betting decision engine');
  }
}