import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DataFileService } from '../core/data-file.service';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { DATA_FILE_SERVICE } from './tokens';
import moment from 'moment-timezone';

@Injectable()
export class BettingDecisionService implements OnModuleInit {
    private oddsWatcher: chokidar.FSWatcher | null = null;

  constructor(
    @Inject(DATA_FILE_SERVICE) private dataFileService: DataFileService
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
    
    // Watch odds-data.json for betting opportunities
    const oddsPath = path.join(process.cwd(), 'data', 'v2', 'odds-data.json');
    this.oddsWatcher = chokidar.watch(oddsPath, {
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
      // Read current odds data
      const oddsData = await this.dataFileService.readFile('odds-data.json');
      if (!oddsData || typeof oddsData !== 'object' || !Array.isArray((oddsData as any).matches)) {
        console.log('🎯 No valid odds data found');
        return;
      }
      
      const matches = (oddsData as any).matches;
      console.log(`🎯 Found ${matches.length} matches in odds data`);
      
      // Get current strategies
      const strategies = await this.dataFileService.getStrategies();
      console.log(`🎯 Evaluating ${strategies.length} strategies against ${matches.length} matches`);
      
      const decisions: any[] = [];
      
      // Evaluate each match against each strategy
      for (const match of matches) {
        for (const strategy of strategies) {
          try {
            const shouldBet = this.evaluateMatchStrategy(match, strategy);
            
            if (shouldBet) {
              // Parse kickoff time - skip if invalid
              const dateStr = match.rawData?.date || match.date;
              const kickoffTime = dateStr ? this.parseMatchDate(dateStr.trim()) : null;
              
              if (!kickoffTime) {
                console.log(`⚠️ Skipping ${match.homeTeam} vs ${match.awayTeam}: Invalid or missing kickoff time (date: ${dateStr})`);
                continue;
              }
              
              const decision = {
                id: `decision_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                matchId: match.matchId,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                strategyName: (strategy as any).name,
                betSide: this.getBetSideForMatch(match, strategy),
                stake: this.calculateStakeForMatch(match, strategy),
                odds: this.getOddsForMatch(match, strategy),
                handicap: match.handicap,
                kickoffTime: kickoffTime,
                timestamp: new Date().toISOString(),
                source: 'odds-monitor'
              };
              
              decisions.push(decision);
              console.log(`🎯BETTING DECISION: ${decision.strategyName} -> ${decision.homeTeam} vs ${decision.awayTeam} -> BET ${decision.betSide.toUpperCase()} @ ${decision.odds}`);
            }
          } catch (error) {
            console.error(`❌ Error evaluating ${match.homeTeam} vs ${match.awayTeam} with strategy ${(strategy as any).name}:`, error);
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

  async stopDecisionEngine(): Promise<void> {
    if (this.oddsWatcher) {
      await this.oddsWatcher.close();
      this.oddsWatcher = null;
    }
    await this.dataFileService.writeLog('info', 'Stopped betting decision engine');
  }
}