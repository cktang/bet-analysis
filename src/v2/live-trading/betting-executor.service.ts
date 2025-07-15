import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Page } from 'playwright';
import { DataFileService } from '../core/data-file.service';
import { SharedBrowserService, BrowserConfig } from '../core/shared-browser.service';
import { BettingUtilitiesService, BetRequest } from '../core/betting-utilities.service';
import { DATA_FILE_SERVICE } from './tokens';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { Subject, throttleTime, concatMap, tap, from } from 'rxjs';

@Injectable()
export class BettingExecutorService {
  private fileWatcher: chokidar.FSWatcher;
  private placedBets = new Set<string>(); // Track placed bets to prevent duplicates
  private bettingDecisionSubject = new Subject<void>();
  private readonly serviceName = 'BettingExecutor';

  constructor(
    private configService: ConfigService,
    @Inject(DATA_FILE_SERVICE) private dataFileService: DataFileService,
    private sharedBrowserService: SharedBrowserService,
    private bettingUtilitiesService: BettingUtilitiesService
  ) {}

  async onModuleInit() {
    console.log('💰 Betting Executor Service initialized - FILE-BASED MODE');
    this.loadPlacedBets(); // Load previously placed bets
    this.setupRxJSProcessing();
    this.setupFileWatcher();
    
    // Staggered browser initialization to prevent conflicts (after odds monitor)
    setTimeout(async () => {
      try {
        console.log('💰 Starting DELAYED betting executor browser initialization...');
        await this.initializeBrowser();
      } catch (error) {
        console.error('❌ Delayed betting browser initialization failed:', error);
      }
    }, 3000); // 3 second delay after odds monitor
  }

  async onModuleDestroy() {
    console.log('🔄 BettingExecutorService shutting down...');
    
    // Complete RxJS subject
    this.bettingDecisionSubject.complete();
    
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
    
    // Close dedicated betting browser on shutdown
    try {
      await this.sharedBrowserService.cleanupService(this.serviceName);
      console.log('✅ Betting browser closed during shutdown');
    } catch (error) {
      console.error('❌ Error closing betting browser:', error);
    }
    
    console.log('✅ BettingExecutorService shutdown complete');
  }

  private setupRxJSProcessing() {
    // Set up RxJS stream with throttling and sequential processing
    this.bettingDecisionSubject.pipe(
      tap(() => console.log('📡 Betting decision signal received')),
      throttleTime(2000), // Throttle to max once every 2 seconds
      tap(() => console.log('⏳ Processing betting decisions (throttled)')),
      concatMap(() => from(this.processBettingDecisions())), // Sequential processing with concatMap
      tap(() => console.log('✅ Betting decisions processing completed'))
    ).subscribe({
      error: (error) => console.error('❌ RxJS betting processing error:', error)
    });
  }

  private setupFileWatcher() {
    // Watch for betting decisions to execute
    this.fileWatcher = chokidar.watch('./data/v2/betting-decisions.json');
    this.fileWatcher.on('change', () => {
      console.log('💰 Betting decisions file changed, emitting signal...');
      this.bettingDecisionSubject.next(); // Emit signal to RxJS stream
    });
  }

  private async processBettingDecisions() {
    try {
      const decisions = await this.dataFileService.readFile('betting-decisions.json');
      
      if (decisions.length === 0) {
        console.log('📝 No betting decisions to process');
        return;
      }
      
      const executionResults = [];
      let skippedDuplicates = 0;
      let skippedTimeWindow = 0;
      
      for (const decision of decisions) {
        // Type check to ensure decision has required properties
        if (!decision || typeof decision !== 'object' || !(decision as any).homeTeam || !(decision as any).awayTeam) {
          console.warn('⚠️ Invalid decision format, skipping:', decision);
          continue;
        }
        
        const typedDecision = decision as any;
        
        // Simple time check: skip if not within 0-3 hours of kickoff
        if (typedDecision.kickoffTime) {
          const now = new Date();
          const kickoffTime = new Date(typedDecision.kickoffTime);
          const minutesUntilKickoff = Math.round((kickoffTime.getTime() - now.getTime()) / (1000 * 60));
          
          // before 10 minutes of kickoff, skip
          if (minutesUntilKickoff < 0 || minutesUntilKickoff > 10) {
            console.log(`⏰ Skipping ${typedDecision.homeTeam} v ${typedDecision.awayTeam}: ${minutesUntilKickoff} minutes until kickoff (>10m)`);
            skippedTimeWindow++;
            continue;
          }
        }
        
        // ✅ MANDATORY SOLUTION - ALWAYS INCLUDE SEASON to avoid DEADLY SEASON COLLISIONS
        // Create standardized match key: season_homeTeam v awayTeam format
        const season = this.bettingUtilitiesService.extractSeasonFromDecision(typedDecision);
        const standardMatchKey = this.bettingUtilitiesService.generateMatchKey(typedDecision.homeTeam, typedDecision.awayTeam, season);
        
        if (this.placedBets.has(standardMatchKey)) {
          console.log(`⚠️ Already placed bet for ${standardMatchKey}, skipping duplicate`);
          skippedDuplicates++;
          continue;
        }
        
        console.log(`🎯 About to execute bet for ${typedDecision.homeTeam} vs ${typedDecision.awayTeam}`);
        const result = await this.executeBet(decision);
        console.log(`🎯 Bet execution completed with status: ${result.status}`);
        
        // 🚨 CRITICAL: Record bet IMMEDIATELY after execution (don't wait for batch)
        console.log(`📝 Recording bet execution result immediately: ${result.status}`);
        const betRecord = {
          timestamp: new Date().toISOString(),
          ...result // This contains all the signal data plus execution details
        };
        
        console.log(`💾 Saving bet record to bet-record.json IMMEDIATELY`);
        await this.dataFileService.addBetRecord(betRecord);
        console.log(`✅ Bet record saved successfully for ${result.homeTeam} vs ${result.awayTeam}`);
        
        executionResults.push(result);
        
        // Only add to placed bets if execution was successful
        if (result.status === 'success') {
          // Create match key from the result data (which contains ...signal data)
          const season = this.bettingUtilitiesService.extractSeasonFromDecision(result);
          const matchKey = this.bettingUtilitiesService.generateMatchKey(result.homeTeam, result.awayTeam, season);
          this.placedBets.add(matchKey);
          console.log(`✅ Added ${matchKey} to placed bets tracking`);
          this.savePlacedBets(); // Save to file for persistence
        }
      }
      
      // Batch recording removed - each bet is now recorded immediately after execution
      
      // Clear processed decisions
      await this.dataFileService.writeFile('betting-decisions.json', []);
      
      console.log(`💰 Executed ${executionResults.length} betting decisions, skipped ${skippedDuplicates} duplicates, ${skippedTimeWindow} outside time window, recorded to bet-record.json`);
    } catch (error) {
      console.error('❌ Error processing betting decisions:', error);
    }
  }

  async executeBet(signal: any): Promise<any> {
    console.log(`💰 Executing bet: ${signal.homeTeam} vs ${signal.awayTeam} (${signal.betSide})`);
    
    const systemConfig = this.dataFileService.getSystemConfig();
    
    if (systemConfig.enableLiveBetting) {
      return await this.executeLiveBet(signal);
    } else if (systemConfig.enablePaperTrading) {
      return await this.executePaperBet(signal);
    } else {
      throw new Error('Both live betting and paper trading are disabled');
    }
  }

  private async executeLiveBet(signal: any): Promise<any> {
    console.log(`📝 Live trading bet: ${signal.matchId || signal.fixtureId} (${signal.betSide}) - $${signal.stakeAmount || signal.stake}`);
    try {
      // Initialize browser if needed
      await this.initializeBrowser();
      
      console.log('🔐 Starting fresh login for bet execution...');
      await this.loginToHKJC();
      
      // Create bet request using utilities
      const betRequest: BetRequest = {
        betId: this.bettingUtilitiesService.generateBetId(signal.matchId || signal.fixtureId, signal.strategyName),
        matchId: signal.matchId || signal.fixtureId,
        homeTeam: signal.homeTeam,
        awayTeam: signal.awayTeam,
        betSide: signal.betSide,
        handicap: signal.handicap || 0,
        odds: signal.odds || 1.95,
        stakeAmount: signal.stake || signal.stakeAmount || 200,
        strategyName: signal.strategyName
      };
      
      // Validate bet request
      const validation = this.bettingUtilitiesService.validateBetRequest(betRequest);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      console.log(`💰 Placing ${betRequest.betSide} bet of $${betRequest.stakeAmount} on ${betRequest.homeTeam} vs ${betRequest.awayTeam}`);
      
      // Get page instance and place bet
      const page = await this.sharedBrowserService.getPageInstance(this.serviceName, {
        headless: this.dataFileService.getBrowserConfig().headless,
        timeout: 30000,
        userDataDir: './data/v2/browser-betting-executor',
        debuggingPort: 9224,
        userAgent: 'BettingExecutor-Process'
      });
      
      const betResult = await this.bettingUtilitiesService.placeBet(page, betRequest);

      // Always logout after placing bet - clean state
      await this.logoutFromHKJC();
      console.log('🔐 Logging out after bet placement...');
      
      return {
        status: betResult.success ? 'success' : 'failed',
        betId: betResult.betId,
        hkjcBetId: betResult.hkjcBetId,
        message: betResult.success ? 'Bet placed successfully' : 'Failed to place bet',
        error: betResult.error,
        executionTime: betResult.executionTime,
        ...signal
      };
      
    } catch (error) {
      console.error('❌ Live bet execution failed:', error);
      
      // Always try to logout on error to clean up
      try {
        if (this.sharedBrowserService.isLoggedIn(this.serviceName)) {
          await this.logoutFromHKJC();
        }
      } catch (logoutError) {
        console.error('❌ Error during cleanup logout:', logoutError);
      }
      
      return {
        status: 'failed',
        betId: signal.id || signal.matchId,
        error: (error as Error).message,
        executionTime: new Date().toISOString(),
        ...signal
      };
    }
  }

  private async executePaperBet(decision: any): Promise<any> {
    console.log(`📝 Paper trading bet: ${decision.matchId || decision.fixtureId} (${decision.betSide}) - $${decision.stakeAmount || decision.stake}`);
    
    // Create bet request using utilities
    const betRequest: BetRequest = {
      betId: this.bettingUtilitiesService.generateBetId(decision.matchId || decision.fixtureId, decision.strategyName),
      matchId: decision.matchId || decision.fixtureId,
      homeTeam: decision.homeTeam,
      awayTeam: decision.awayTeam,
      betSide: decision.betSide,
      handicap: decision.handicap || 0,
      odds: decision.odds || 1.95,
      stakeAmount: decision.stakeAmount || decision.stake || 200,
      strategyName: decision.strategyName
    };
    
    const result = await this.bettingUtilitiesService.executePaperBet(betRequest);
    
    return {
      status: result.success ? 'success' : 'failed',
      betId: result.betId,
      hkjcBetId: result.hkjcBetId,
      message: 'Paper bet recorded successfully',
      executionTime: result.executionTime,
      isPaperTrade: true,
      ...decision
    };
  }

  private async initializeBrowser() {
    // Get browser configuration from injected data service
    const browserConfig = this.dataFileService.getBrowserConfig();
    console.log(`🎭 Betting Browser config: headless=${browserConfig.headless}`);
    
    const config: BrowserConfig = {
      headless: browserConfig.headless,
      timeout: 30000,
      userDataDir: './data/v2/browser-betting-executor',
      debuggingPort: 9224,
      userAgent: 'BettingExecutor-Process'
    };
    
    // Initialize browser through shared service
    await this.sharedBrowserService.getPageInstance(this.serviceName, config);
    console.log('✅ ISOLATED betting browser process created (port 9224, profile: browser-betting-executor)');
  }

  private async loginToHKJC(): Promise<void> {
    const credentials = this.sharedBrowserService.getHKJCCredentials();
    await this.sharedBrowserService.loginToHKJC(this.serviceName, credentials);
  }

  private async logoutFromHKJC(): Promise<void> {
    await this.sharedBrowserService.logoutFromHKJC(this.serviceName);
  }

  getExecutorStatus(): any {
    const systemConfig = this.dataFileService.getSystemConfig();
    const browserConfig = this.dataFileService.getBrowserConfig();
    const browserStatus = this.sharedBrowserService.getStatus();
    
    return {
      isLoggedIn: this.sharedBrowserService.isLoggedIn(this.serviceName),
      liveBettingEnabled: systemConfig.enableLiveBetting,
      paperTradingEnabled: systemConfig.enablePaperTrading,
      headlessBrowser: browserConfig.headless,
      mockMode: systemConfig.mockMode,
      persistentSession: {
        browserActive: browserStatus.services.includes(this.serviceName),
        sessionDirectory: './data/v2/browser-betting-executor',
        description: 'Dedicated browser context for betting operations, isolated from odds monitoring'
      },
      duplicatePrevention: {
        enabled: true,
        placedBetsCount: this.placedBets.size,
        placedBets: Array.from(this.placedBets),
        description: 'Prevents multiple bets on the same match using season_homeTeam v awayTeam key',
        persistenceFile: './data/v2/bet-record.json'
      }
    };
  }

  // Method to get placed bets for debugging
  getPlacedBets(): string[] {
    return Array.from(this.placedBets);
  }

  // Method to clear placed bets (useful for testing or reset)
  clearPlacedBets(): void {
    this.placedBets.clear();
    console.log('🔄 Cleared placed bets tracking (persisted automatically via bet-record.json)');
  }

  // Method to show current placed bets for debugging
  showPlacedBets(): void {
    console.log(`📊 Current placed bets (${this.placedBets.size}):`, Array.from(this.placedBets));
    console.log(`📁 These are loaded from bet-record.json on service startup`);
  }


  // Load placed bets from bet-record.json (single source of truth)
  private loadPlacedBets(): void {
    try {
      this.placedBets = new Set(); // Start fresh
      
      const betRecordFile = path.join(process.cwd(), 'data', 'v2', 'bet-record.json');
      if (fs.existsSync(betRecordFile)) {
        const data = fs.readFileSync(betRecordFile, 'utf8');
        if (data.trim()) {
          const betRecords = JSON.parse(data);
          if (Array.isArray(betRecords)) {
            for (const record of betRecords) {
              // Generate match key from bet record data (homeTeam, awayTeam, timestamp)
              if (record.homeTeam && record.awayTeam && record.status === 'success') {
                const season = this.bettingUtilitiesService.extractSeasonFromDecision(record);
                const matchKey = this.bettingUtilitiesService.generateMatchKey(record.homeTeam, record.awayTeam, season);
                this.placedBets.add(matchKey);
              }
            }
            console.log(`📁 Loaded ${this.placedBets.size} placed bets from bet-record.json`);
          }
        }
      } else {
        console.log('📁 No bet-record.json found, starting with empty placed bets');
      }
      
    } catch (error) {
      console.error('❌ Error loading placed bets:', error);
      this.placedBets = new Set(); // Reset to empty set on error
    }
  }

  // Save placed bets - automatically persisted through bet-record.json
  private savePlacedBets(): void {
    // No separate file needed - placed bets are tracked via bet-record.json
    console.log(`📁 Placed bets (${this.placedBets.size}) tracked in memory, persisted via bet-record.json`);
  }

  // Method to inject a page for testing (not needed with shared browser service)
  setPage(_page: Page): void {
    console.log('✅ Page injection not needed with shared browser service');
  }
}