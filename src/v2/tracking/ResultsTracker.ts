import fs from 'fs';
import path from 'path';
import { chromium, Browser, Page } from 'playwright';
import { eventBus, BetPlacedEvent } from '../coordinator/EventBus';
import { AsianHandicapCalculator } from '../../utils/AsianHandicapCalculator';

export interface BetRecord {
  betId: string;
  strategyName: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  betSide: 'home' | 'away';
  handicap: number;
  odds: number;
  stakeAmount: number;
  placedAt: number;
  hkjcBetId?: string;
  
  // Result data (populated after match completion)
  homeScore?: number;
  awayScore?: number;
  outcome?: 'win' | 'loss' | 'push' | 'half_win' | 'half_loss';
  payout?: number;
  profit?: number;
  resultedAt?: number;
}

export interface StrategyPerformance {
  strategyName: string;
  totalBets: number;
  activeBets: number;
  completedBets: number;
  
  // Financial metrics
  totalStaked: number;
  totalPayout: number;
  totalProfit: number;
  roi: number;
  
  // Win/loss breakdown
  wins: number;
  losses: number;
  pushes: number;
  halfWins: number;
  halfLosses: number;
  winRate: number;
  
  // Time-based metrics
  lastBetAt: number;
  lastResultAt: number;
  
  // Recent performance (last 10 bets)
  recentROI: number;
  recentWinRate: number;
}

export interface SystemPerformance {
  totalStrategies: number;
  totalBets: number;
  activeBets: number;
  
  // Overall financial performance
  totalStaked: number;
  totalProfit: number;
  systemROI: number;
  
  // Best and worst performers
  bestStrategy: {
    name: string;
    roi: number;
  };
  worstStrategy: {
    name: string;
    roi: number;
  };
  
  // Daily performance
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  
  lastUpdated: number;
}

/**
 * Results Tracker for P&L monitoring and performance analysis
 * Tracks bet outcomes and updates strategy performance metrics
 */
export class ResultsTracker {
  private dataDir: string;
  private browser: Browser | null = null;
  private page: Page | null = null;
  
  private betRecords: Map<string, BetRecord> = new Map();
  private strategyPerformance: Map<string, StrategyPerformance> = new Map();
  
  private isRunning = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  
  // Update frequency (twice daily as requested)
  private readonly UPDATE_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.loadExistingData();
    
    // Listen for bet placement events
    eventBus.onBetPlaced(this.handleBetPlaced.bind(this));
    
    eventBus.emitModuleStatus({
      moduleName: 'ResultsTracker',
      status: 'offline',
      message: 'Initialized but not started'
    });
  }

  /**
   * Load existing bet records and performance data
   */
  private loadExistingData(): void {
    try {
      // Load bet records
      const betRecordsPath = path.join(this.dataDir, 'results', 'bet_records.json');
      if (fs.existsSync(betRecordsPath)) {
        const data = JSON.parse(fs.readFileSync(betRecordsPath, 'utf8'));
        this.betRecords = new Map(data);
        console.log(`Loaded ${this.betRecords.size} bet records`);
      }
      
      // Load strategy performance
      const performancePath = path.join(this.dataDir, 'results', 'strategy_performance.json');
      if (fs.existsSync(performancePath)) {
        const data = JSON.parse(fs.readFileSync(performancePath, 'utf8'));
        this.strategyPerformance = new Map(data);
        console.log(`Loaded performance data for ${this.strategyPerformance.size} strategies`);
      }
      
    } catch (error) {
      console.error('Error loading existing data:', error);
      eventBus.emitSystemAlert({
        severity: 'warning',
        message: 'Could not load existing tracking data',
        details: error,
        source: 'ResultsTracker'
      });
    }
  }

  /**
   * Start the results tracking service
   */
  public start(): void {
    if (this.isRunning) {
      console.log('ResultsTracker is already running');
      return;
    }

    this.isRunning = true;
    
    eventBus.emitModuleStatus({
      moduleName: 'ResultsTracker',
      status: 'online',
      message: 'Started results tracking'
    });

    // Set up periodic result checking (twice daily)
    this.trackingInterval = setInterval(async () => {
      try {
        await this.updateResultsFromHKJC();
      } catch (error) {
        console.error('Error in periodic results update:', error);
        eventBus.emitSystemAlert({
          severity: 'error',
          message: 'Failed periodic results update',
          details: error,
          source: 'ResultsTracker'
        });
      }
    }, this.UPDATE_INTERVAL_MS);

    // Initial update
    this.updateResultsFromHKJC();
    
    console.log('ResultsTracker started');
  }

  /**
   * Stop the results tracking service
   */
  public stop(): void {
    this.isRunning = false;
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    if (this.browser) {
      this.browser.close();
      this.browser = null;
      this.page = null;
    }

    eventBus.emitModuleStatus({
      moduleName: 'ResultsTracker',
      status: 'offline',
      message: 'Stopped results tracking'
    });

    console.log('ResultsTracker stopped');
  }

  /**
   * Handle bet placed events
   */
  private handleBetPlaced(event: BetPlacedEvent): void {
    if (event.status !== 'success') {
      return; // Only track successful bets
    }

    const betRecord: BetRecord = {
      betId: event.betId,
      strategyName: event.strategyName,
      matchId: event.matchId,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      betSide: event.betSide,
      handicap: event.handicap,
      odds: event.odds,
      stakeAmount: event.stakeAmount,
      placedAt: event.timestamp,
      hkjcBetId: event.hkjcBetId
    };

    this.betRecords.set(event.betId, betRecord);
    this.updateStrategyPerformance(event.strategyName);
    this.saveData();
    
    console.log(`Recorded bet: ${event.betId} for strategy ${event.strategyName}`);
  }

  /**
   * Update results from HKJC (twice daily)
   */
  private async updateResultsFromHKJC(): Promise<void> {
    console.log('Updating results from HKJC...');
    
    try {
      await this.initializeBrowser();
      
      // Get all bets that need result updates
      const pendingBets = Array.from(this.betRecords.values())
        .filter(bet => !bet.outcome);
      
      if (pendingBets.length === 0) {
        console.log('No pending bets to update');
        return;
      }

      console.log(`Updating results for ${pendingBets.length} pending bets`);
      
      for (const bet of pendingBets) {
        try {
          await this.updateBetResult(bet);
          await this.page!.waitForTimeout(1000); // Rate limiting
        } catch (error) {
          console.error(`Error updating result for bet ${bet.betId}:`, error);
        }
      }
      
      // Update all strategy performance metrics
      this.updateAllStrategyPerformance();
      this.saveData();
      
      console.log('Results update completed');
      
    } catch (error) {
      console.error('Error in results update:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    }
  }

  /**
   * Initialize browser for results checking
   */
  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  /**
   * Update result for a specific bet
   */
  private async updateBetResult(bet: BetRecord): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      // Navigate to HKJC results page
      await this.page.goto('https://bet.hkjc.com/en/football/results');
      await this.page.waitForTimeout(2000);

      // Search for the specific match
      const matchResult = await this.searchMatchResult(bet.homeTeam, bet.awayTeam);
      
      if (!matchResult) {
        console.log(`No result found yet for ${bet.homeTeam} vs ${bet.awayTeam}`);
        return;
      }

      // Calculate bet outcome using Asian Handicap Calculator
      const outcome = AsianHandicapCalculator.calculate(
        matchResult.homeScore,
        matchResult.awayScore,
        bet.handicap,
        bet.betSide,
        bet.odds,
        bet.stakeAmount
      );

      // Update bet record
      bet.homeScore = matchResult.homeScore;
      bet.awayScore = matchResult.awayScore;
      bet.outcome = outcome.outcome;
      bet.payout = outcome.payout;
      bet.profit = outcome.profit;
      bet.resultedAt = Date.now();

      this.betRecords.set(bet.betId, bet);
      
      // Emit bet result event
      eventBus.emitBetResult({
        betId: bet.betId,
        strategyName: bet.strategyName,
        matchId: bet.matchId,
        homeScore: matchResult.homeScore,
        awayScore: matchResult.awayScore,
        outcome: outcome.outcome,
        payout: outcome.payout,
        profit: outcome.profit
      });

      console.log(`Updated result for ${bet.homeTeam} vs ${bet.awayTeam}: ${outcome.outcome} (${outcome.profit > 0 ? '+' : ''}${outcome.profit})`);
      
    } catch (error) {
      console.error(`Error updating bet result for ${bet.betId}:`, error);
    }
  }

  /**
   * Search for match result on HKJC
   */
  private async searchMatchResult(homeTeam: string, awayTeam: string): Promise<{ homeScore: number; awayScore: number } | null> {
    if (!this.page) return null;

    try {
      // Set search date range (last 7 days)
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Use the search functionality
      await this.page.click('.searchBoxExpand');
      await this.page.waitForTimeout(500);
      
      // Set date range
      // (Implementation would depend on HKJC's specific date picker interface)
      
      // Search for matches with either team
      const searchResults = await this.page.$$eval('.table-row', (rows, homeTeam, awayTeam) => {
        return rows.map(row => {
          const text = row.textContent || '';
          if (text.includes(homeTeam) && text.includes(awayTeam)) {
            // Extract score from the row
            const scoreMatch = text.match(/(\d+)\s*-\s*(\d+)/);
            if (scoreMatch) {
              return {
                homeScore: parseInt(scoreMatch[1]),
                awayScore: parseInt(scoreMatch[2]),
                found: true
              };
            }
          }
          return { found: false };
        }).find(result => result.found);
      }, homeTeam, awayTeam);

      return searchResults && searchResults.found ? {
        homeScore: searchResults.homeScore,
        awayScore: searchResults.awayScore
      } : null;
      
    } catch (error) {
      console.error('Error searching match result:', error);
      return null;
    }
  }

  /**
   * Update strategy performance metrics
   */
  private updateStrategyPerformance(strategyName: string): void {
    const strategyBets = Array.from(this.betRecords.values())
      .filter(bet => bet.strategyName === strategyName);
    
    const completedBets = strategyBets.filter(bet => bet.outcome);
    const activeBets = strategyBets.filter(bet => !bet.outcome);
    
    // Calculate financial metrics
    const totalStaked = strategyBets.reduce((sum, bet) => sum + bet.stakeAmount, 0);
    const totalPayout = completedBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
    const totalProfit = completedBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
    
    // Calculate win/loss breakdown
    const wins = completedBets.filter(bet => bet.outcome === 'win').length;
    const losses = completedBets.filter(bet => bet.outcome === 'loss').length;
    const pushes = completedBets.filter(bet => bet.outcome === 'push').length;
    const halfWins = completedBets.filter(bet => bet.outcome === 'half_win').length;
    const halfLosses = completedBets.filter(bet => bet.outcome === 'half_loss').length;
    
    const winRate = completedBets.length > 0 ? 
      ((wins + halfWins * 0.5) / completedBets.length) * 100 : 0;
    
    // Calculate recent performance (last 10 completed bets)
    const recentBets = completedBets
      .sort((a, b) => (b.resultedAt || 0) - (a.resultedAt || 0))
      .slice(0, 10);
    
    const recentStaked = recentBets.reduce((sum, bet) => sum + bet.stakeAmount, 0);
    const recentProfit = recentBets.reduce((sum, bet) => sum + (bet.profit || 0), 0);
    const recentROI = recentStaked > 0 ? (recentProfit / recentStaked) * 100 : 0;
    
    const recentWins = recentBets.filter(bet => bet.outcome === 'win' || bet.outcome === 'half_win').length;
    const recentWinRate = recentBets.length > 0 ? (recentWins / recentBets.length) * 100 : 0;
    
    // Get timing info
    const lastBetAt = Math.max(...strategyBets.map(bet => bet.placedAt));
    const lastResultAt = Math.max(...completedBets.map(bet => bet.resultedAt || 0));

    const performance: StrategyPerformance = {
      strategyName,
      totalBets: strategyBets.length,
      activeBets: activeBets.length,
      completedBets: completedBets.length,
      
      totalStaked,
      totalPayout,
      totalProfit,
      roi,
      
      wins,
      losses,
      pushes,
      halfWins,
      halfLosses,
      winRate,
      
      lastBetAt,
      lastResultAt,
      
      recentROI,
      recentWinRate
    };

    this.strategyPerformance.set(strategyName, performance);
  }

  /**
   * Update all strategy performance metrics
   */
  private updateAllStrategyPerformance(): void {
    const strategies = new Set(Array.from(this.betRecords.values()).map(bet => bet.strategyName));
    
    for (const strategyName of strategies) {
      this.updateStrategyPerformance(strategyName);
    }
  }

  /**
   * Get system-wide performance summary
   */
  public getSystemPerformance(): SystemPerformance {
    const allPerformances = Array.from(this.strategyPerformance.values());
    
    const totalBets = allPerformances.reduce((sum, p) => sum + p.totalBets, 0);
    const activeBets = allPerformances.reduce((sum, p) => sum + p.activeBets, 0);
    const totalStaked = allPerformances.reduce((sum, p) => sum + p.totalStaked, 0);
    const totalProfit = allPerformances.reduce((sum, p) => sum + p.totalProfit, 0);
    const systemROI = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
    
    // Find best and worst strategies
    const bestStrategy = allPerformances.reduce((best, current) => 
      current.roi > best.roi ? current : best, allPerformances[0] || { strategyName: 'None', roi: 0 });
    
    const worstStrategy = allPerformances.reduce((worst, current) => 
      current.roi < worst.roi ? current : worst, allPerformances[0] || { strategyName: 'None', roi: 0 });
    
    // Calculate time-based profits
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;
    
    const allBets = Array.from(this.betRecords.values()).filter(bet => bet.outcome);
    
    const dailyProfit = allBets
      .filter(bet => (bet.resultedAt || 0) > now - dayMs)
      .reduce((sum, bet) => sum + (bet.profit || 0), 0);
    
    const weeklyProfit = allBets
      .filter(bet => (bet.resultedAt || 0) > now - weekMs)
      .reduce((sum, bet) => sum + (bet.profit || 0), 0);
    
    const monthlyProfit = allBets
      .filter(bet => (bet.resultedAt || 0) > now - monthMs)
      .reduce((sum, bet) => sum + (bet.profit || 0), 0);

    return {
      totalStrategies: allPerformances.length,
      totalBets,
      activeBets,
      totalStaked,
      totalProfit,
      systemROI,
      
      bestStrategy: {
        name: bestStrategy.strategyName,
        roi: bestStrategy.roi
      },
      worstStrategy: {
        name: worstStrategy.strategyName,
        roi: worstStrategy.roi
      },
      
      dailyProfit,
      weeklyProfit,
      monthlyProfit,
      
      lastUpdated: Date.now()
    };
  }

  /**
   * Get strategy performance by name
   */
  public getStrategyPerformance(strategyName: string): StrategyPerformance | null {
    return this.strategyPerformance.get(strategyName) || null;
  }

  /**
   * Get all strategy performances
   */
  public getAllStrategyPerformances(): StrategyPerformance[] {
    return Array.from(this.strategyPerformance.values());
  }

  /**
   * Get bet records for a strategy
   */
  public getStrategyBets(strategyName: string): BetRecord[] {
    return Array.from(this.betRecords.values())
      .filter(bet => bet.strategyName === strategyName)
      .sort((a, b) => b.placedAt - a.placedAt);
  }

  /**
   * Save data to files
   */
  private async saveData(): Promise<void> {
    try {
      const resultsDir = path.join(this.dataDir, 'results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      // Save bet records
      const betRecordsPath = path.join(resultsDir, 'bet_records.json');
      const betRecordsData = Array.from(this.betRecords.entries());
      await fs.promises.writeFile(betRecordsPath, JSON.stringify(betRecordsData, null, 2));
      
      // Save strategy performance
      const performancePath = path.join(resultsDir, 'strategy_performance.json');
      const performanceData = Array.from(this.strategyPerformance.entries());
      await fs.promises.writeFile(performancePath, JSON.stringify(performanceData, null, 2));
      
      // Save system summary
      const systemPerformance = this.getSystemPerformance();
      const summaryPath = path.join(resultsDir, 'system_summary.json');
      await fs.promises.writeFile(summaryPath, JSON.stringify(systemPerformance, null, 2));
      
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  /**
   * Manual result update trigger
   */
  public async manualUpdateResults(): Promise<void> {
    console.log('Manual results update triggered');
    await this.updateResultsFromHKJC();
  }

  /**
   * Get tracker status
   */
  public getStatus(): {
    isRunning: boolean;
    totalBets: number;
    pendingBets: number;
    lastUpdate: number;
  } {
    const pendingBets = Array.from(this.betRecords.values()).filter(bet => !bet.outcome).length;
    
    return {
      isRunning: this.isRunning,
      totalBets: this.betRecords.size,
      pendingBets,
      lastUpdate: Date.now()
    };
  }
}