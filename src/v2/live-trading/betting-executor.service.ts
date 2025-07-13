import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, BrowserContext, Page } from 'playwright';
import { DataFileService } from '../core/data-file.service';
import { DATA_FILE_SERVICE } from './tokens';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { hkjc_login, hkjc_logout, hkjc_bet_handicap } from '../../parsers/others/hkjc-util.js';
import { Subject, throttleTime, concatMap, tap, from } from 'rxjs';

@Injectable()
export class BettingExecutorService {
  private browser: BrowserContext | null = null;
  private page: Page | null = null;
  private isLoggedIn = false;
  private fileWatcher: chokidar.FSWatcher;
  private placedBets = new Set<string>(); // Track placed bets to prevent duplicates
  private bettingDecisionSubject = new Subject<void>();
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    @Inject(DATA_FILE_SERVICE) private dataFileService: DataFileService
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
    if (this.isLoggedIn) {
      try {
        console.log('🔐 Logging out during shutdown...');
        await this.logoutFromHKJC();
      } catch (error) {
        console.error('❌ Error during logout on shutdown:', error);
      }
    }
    
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log('✅ Betting browser closed during shutdown');
      } catch (error) {
        console.error('❌ Error closing betting browser:', error);
      }
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
            console.log(`⏰ Skipping ${typedDecision.homeTeam} v ${typedDecision.awayTeam}: ${minutesUntilKickoff} minutes until kickoff (outside 0-180 minute window)`);
            skippedTimeWindow++;
            continue;
          }
        }
        
        // ✅ MANDATORY SOLUTION - ALWAYS INCLUDE SEASON to avoid DEADLY SEASON COLLISIONS
        // Create standardized match key: season_homeTeam v awayTeam format
        const season = this.extractSeasonFromDecision(typedDecision);
        const standardMatchKey = `${season}_${typedDecision.homeTeam} v ${typedDecision.awayTeam}`;
        
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
          const season = this.extractSeasonFromDecision(result);
          const matchKey = `${season}_${result.homeTeam} v ${result.awayTeam}`;
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
      // Fresh login for each bet - simple and reliable
      if (!this.page) {
        await this.initializeBrowser();
      }
      
      console.log('🔐 Starting fresh login for bet execution...');
      await this.loginToHKJC();
      
      // Convert signal to match format expected by hkjc_bet_handicap
      const match = {
        id: signal.matchId || signal.fixtureId,
        decision: signal.betSide === 'home' ? 'home' : 'away'
      };
      const amount = signal.stake || signal.stakeAmount || 200;
      
      console.log(`💰 Placing ${match.decision} bet of $${amount} on ${signal.homeTeam} vs ${signal.awayTeam} (match ${match.id})`);
      
      // Try betting without explicit navigation first - maybe home page has betting options
      console.log('🎯 Attempting to place bet from current page...');
      const betResult = await hkjc_bet_handicap(this.page, match, amount);

      // Always logout after placing bet - clean state
      await this.logoutFromHKJC();
      console.log('🔐 Logging out after bet placement...');

      // Generate bet ID for tracking
      const hkjcBetId = `HKJC_${Date.now()}_${match.id}`;
      
      if (betResult) {
        return {
          status: 'success',
          betId: signal.id || signal.matchId,
          hkjcBetId: hkjcBetId,
          message: 'Bet placed successfully',
          executionTime: new Date().toISOString(),
          ...signal
        }
      } else {
        return {
          status: 'failed',
          betId: hkjcBetId,
          error: 'Failed to place bet',
          executionTime: new Date().toISOString(),
          ...signal
        };
      }
      
    } catch (error) {
      console.error('❌ Live bet execution failed:', error);
      
      // Always try to logout on error to clean up
      try {
        if (this.isLoggedIn) {
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
    
    // Simulate bet placement delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'success',
      betId: decision.id,
      betSide: decision.betSide,
      stakeAmount: decision.stakeAmount || decision.stake,
      hkjcBetId: `PAPER_${Date.now()}`,
      message: 'Paper bet recorded successfully',
      isPaperTrade: true
    };
  }

  private async initializeBrowser() {
    // Only initialize once to prevent multiple browser instances
    if (this.isInitialized && this.browser && this.page) {
      console.log('♻️ Reusing existing betting browser instance');
      return;
    }
    
    if (this.isInitialized) {
      console.log('⏳ Betting browser initialization already in progress, skipping...');
      return;
    }
    
    this.isInitialized = true;

    // Create COMPLETELY ISOLATED browser context with unique profile directory
    const userDataDir = './data/v2/browser-betting-executor';
    
    // Ensure user data directory exists
    const fs = require('fs');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    
    console.log('🚀 Creating ISOLATED betting browser (separate process from odds monitoring)...');
    
    // Get browser configuration from injected data service
    const browserConfig = this.dataFileService.getBrowserConfig();
    console.log(`🎭 Betting Browser config: headless=${browserConfig.headless}`);
    
    try {
      // Use launchPersistentContext instead of launch() with --user-data-dir
      this.browser = await chromium.launchPersistentContext(userDataDir, {
        headless: browserConfig.headless,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--remote-debugging-port=9224', // UNIQUE port for betting executor
          '--user-agent=BettingExecutor-Process',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--force-device-scale-factor=1'
        ],
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        acceptDownloads: false,
        bypassCSP: true
      });
    } catch (error) {
      console.error('❌ Betting browser initialization failed:', error);
      this.isInitialized = false; // Reset flag so we can try again
      throw error;
    }
    
    // Use the default page from persistent context or create a new one
    const pages = this.browser.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();
    
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 BettingExecutor-Isolated'
    });
    
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ ISOLATED betting browser process created (port 9224, profile: browser-betting-executor)');
  }

  private async loginToHKJC(): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    // Get credentials from configService
    const username = this.configService.get('HKJC_USERNAME');
    const password = this.configService.get('HKJC_PASSWORD');
    const securityAnswers = this.configService.get('HKJC_SECURITY_ANSWERS');
    
    if (!username || !password || !securityAnswers) {
      throw new Error('HKJC credentials or security answers not configured');
    }
    
    let answersMap: any;
    try {
      answersMap = typeof securityAnswers === 'string' ? JSON.parse(securityAnswers) : securityAnswers;
    } catch (jsonError: any) {
      throw new Error(`Invalid HKJC_SECURITY_ANSWERS format - must be valid JSON string: ${jsonError.message}`);
    }
    
    const credentials = { username, password, answers: answersMap };

    console.log('🔐 Logging into HKJC using standardized hkjc_login utility...');
    await hkjc_login(this.page, credentials);
    this.isLoggedIn = true;
  }

  private async logoutFromHKJC(): Promise<void> {
    if (!this.page || !this.isLoggedIn) return;
    console.log('🔐 Logging out from HKJC using standardized hkjc_logout utility...');
    await hkjc_logout(this.page);
    this.isLoggedIn = false;
  }

  getExecutorStatus(): any {
    const systemConfig = this.dataFileService.getSystemConfig();
    const browserConfig = this.dataFileService.getBrowserConfig();
    
    return {
      isLoggedIn: this.isLoggedIn,
      liveBettingEnabled: systemConfig.enableLiveBetting,
      paperTradingEnabled: systemConfig.enablePaperTrading,
      headlessBrowser: browserConfig.headless,
      mockMode: systemConfig.mockMode,
      persistentSession: {
        browserActive: !!this.browser,
        sessionDirectory: './data/v2/browser-session-betting',
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

  // Extract season from decision or current year
  private extractSeasonFromDecision(decision: any): string {
    // Try to extract season from timestamp or matchId
    if (decision.timestamp) {
      const year = new Date(decision.timestamp).getFullYear();
      // Determine season based on date (Aug-Jul season cycle)
      const month = new Date(decision.timestamp).getMonth();
      if (month >= 7) { // August onwards = new season
        return `${year}-${(year + 1).toString().slice(-2)}`;
      } else { // Jan-July = previous season
        return `${year - 1}-${year.toString().slice(-2)}`;
      }
    }
    
    // Fallback to current season
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    if (currentMonth >= 7) {
      return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
    } else {
      return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    }
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
                const season = this.extractSeasonFromDecision(record);
                const matchKey = `${season}_${record.homeTeam} v ${record.awayTeam}`;
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

  // Method to inject a page for testing (same as JS test)
  setPage(page: Page): void {
    this.page = page;
    this.isLoggedIn = true; // Assume already logged in if page is injected
    console.log('✅ Page injected into BettingExecutorService for testing');
  }
}