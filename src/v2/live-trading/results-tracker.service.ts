import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, Page } from 'playwright';
import { DataFileService } from '../core/data-file.service';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

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
  isPaperTrade?: boolean;
  
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

@Injectable()
export class ResultsTrackerService {
  private dataDir: string;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private fileWatcher: chokidar.FSWatcher;
  
  private betRecords: Map<string, BetRecord> = new Map();
  private strategyPerformance: Map<string, StrategyPerformance> = new Map();
  
  private isRunning = false;

  constructor(
    private configService: ConfigService,
    private dataFileService: DataFileService
  ) {
    this.dataDir = path.join(process.cwd(), 'data', 'v2');
  }

  async onModuleInit() {
    console.log('📊 Results Tracker Service initialized - FILE-BASED MODE');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log('📊 Created v2 data directory');
    }
    
    await this.loadExistingData();
    this.setupFileWatcher();
  }

  private setupFileWatcher() {
    // Watch for bet records to track (no longer need intermediate execution results)
    this.fileWatcher = chokidar.watch('./data/v2/bet-record.json');
    this.fileWatcher.on('change', async () => {
      console.log('📊 Bet records updated, refreshing data...');
      await this.loadExistingData(); // Reload to get latest bet records
    });
  }

  async onModuleDestroy() {
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  @Cron('0 0 */12 * * *') // Every 12 hours
  async scheduledResultsUpdate() {
    await this.updateResultsFromHKJC();
  }

  private async loadExistingData(): Promise<void> {
    try {
      // Load bet records
      const betRecordsPath = path.join(this.dataDir, 'bet-record.json');
      if (fs.existsSync(betRecordsPath)) {
        try {
          const fileContent = fs.readFileSync(betRecordsPath, 'utf8').trim();
          if (fileContent) {
            const data = JSON.parse(fileContent);
            // Convert array format to Map if needed
            if (Array.isArray(data)) {
              this.betRecords = new Map(data);
            } else {
              this.betRecords = new Map(Object.entries(data));
            }
            console.log(`📊 Loaded ${this.betRecords.size} bet records`);
          } else {
            console.log('📊 bet-record.json is empty, starting with empty records');
          }
        } catch (parseError) {
          console.log('📊 bet-record.json parsing failed, starting with empty records:', (parseError as Error).message);
        }
      } else {
        console.log('📊 bet-record.json not found, starting with empty records');
      }
      
      // Load strategy performance
      const performancePath = path.join(this.dataDir, 'bet-result.json');
      if (fs.existsSync(performancePath)) {
        try {
          const fileContent = fs.readFileSync(performancePath, 'utf8').trim();
          if (fileContent) {
            const data = JSON.parse(fileContent);
            // Convert array format to Map if needed
            if (Array.isArray(data)) {
              this.strategyPerformance = new Map(data);
            } else {
              this.strategyPerformance = new Map(Object.entries(data));
            }
            console.log(`📊 Loaded performance data for ${this.strategyPerformance.size} strategies`);
          } else {
            console.log('📊 bet-result.json is empty, starting with empty performance data');
          }
        } catch (parseError) {
          console.log('📊 bet-result.json parsing failed, starting with empty performance data:', (parseError as Error).message);
        }
      } else {
        console.log('📊 bet-result.json not found, starting with empty performance data');
      }
      
    } catch (error) {
      console.error('❌ Error loading existing data:', error);
    }
  }

  async recordBet(betResult: any): Promise<void> {
    if (betResult.status !== 'success') {
      return; // Only track successful bets
    }

    const betRecord: BetRecord = {
      betId: betResult.betId,
      strategyName: betResult.strategyName,
      matchId: betResult.matchId,
      homeTeam: betResult.homeTeam,
      awayTeam: betResult.awayTeam,
      betSide: betResult.betSide,
      handicap: betResult.handicap,
      odds: betResult.odds,
      stakeAmount: betResult.stakeAmount,
      placedAt: betResult.timestamp || Date.now(),
      hkjcBetId: betResult.hkjcBetId,
      isPaperTrade: betResult.isPaperTrade || false
    };

    this.betRecords.set(betResult.betId, betRecord);
    this.updateStrategyPerformance(betResult.strategyName);
    await this.saveData();
    
    console.log(`📊 Recorded bet: ${betResult.betId} for strategy ${betResult.strategyName}`);
  }

  async updateResultsFromHKJC(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('📊 Updating results from HKJC...');
    
    try {
      await this.initializeBrowser();
      
      // Get all bets that need result updates
      const pendingBets = Array.from(this.betRecords.values())
        .filter(bet => !bet.outcome);
      
      if (pendingBets.length === 0) {
        console.log('📊 No pending bets to update');
        return;
      }

      console.log(`📊 Updating results for ${pendingBets.length} pending bets`);
      
      for (const bet of pendingBets) {
        try {
          await this.updateBetResult(bet);
          await this.page!.waitForTimeout(1000); // Rate limiting
        } catch (error) {
          console.error(`❌ Error updating result for bet ${bet.betId}:`, error);
        }
      }
      
      // Update all strategy performance metrics
      this.updateAllStrategyPerformance();
      await this.saveData();
      
      console.log('✅ Results update completed');
      
    } catch (error) {
      console.error('❌ Error in results update:', error);
      throw error;
    } finally {
      this.isRunning = false;
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
      }
    }
  }

  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  private async updateBetResult(bet: BetRecord): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      // For paper trades, check if we can find historical match results
      if (bet.isPaperTrade) {
        const matchResult = await this.findHistoricalResult(bet.homeTeam, bet.awayTeam);
        if (matchResult) {
          await this.processBetResult(bet, matchResult);
        }
        return;
      }

      // For live bets, navigate to HKJC results page
      await this.page.goto('https://bet.hkjc.com/en/football/results');
      await this.page.waitForTimeout(2000);

      // Search for the specific match
      const matchResult = await this.searchMatchResult(bet.homeTeam, bet.awayTeam);
      
      if (!matchResult) {
        console.log(`📊 No result found yet for ${bet.homeTeam} vs ${bet.awayTeam}`);
        return;
      }

      await this.processBetResult(bet, matchResult);
      
    } catch (error) {
      console.error(`❌ Error updating bet result for ${bet.betId}:`, error);
    }
  }

  private async processBetResult(bet: BetRecord, matchResult: any): Promise<void> {
    // Calculate bet outcome using Asian Handicap logic
    const outcome = this.calculateAsianHandicapOutcome(
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
    
    console.log(`📊 Updated result for ${bet.homeTeam} vs ${bet.awayTeam}: ${outcome.outcome} (${outcome.profit > 0 ? '+' : ''}${outcome.profit})`);
  }

  private async findHistoricalResult(homeTeam: string, awayTeam: string): Promise<any> {
    // Load enhanced data to find historical results
    try {
      const enhancedDir = path.join(process.cwd(), 'data', 'enhanced');
      const files = fs.readdirSync(enhancedDir).filter(f => f.endsWith('-enhanced.json'));
      
      for (const file of files) {
        const filePath = path.join(enhancedDir, file);
        const seasonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const match = seasonData.find(m => 
          m.homeTeam === homeTeam && m.awayTeam === awayTeam
        );
        
        if (match && typeof match.homeScore === 'number' && typeof match.awayScore === 'number') {
          return {
            homeScore: match.homeScore,
            awayScore: match.awayScore
          };
        }
      }
    } catch (error) {
      console.error('❌ Error finding historical result:', error);
    }
    
    return null;
  }

  private async searchMatchResult(homeTeam: string, awayTeam: string): Promise<{ homeScore: number; awayScore: number } | null> {
    if (!this.page) return null;

    try {
      // Set search date range (last 7 days)
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Search for matches with either team
      const searchResults = await this.page.$$eval('.table-row, .match-result', (rows, teams: any) => {
        return rows.map(row => {
          const text = row.textContent || '';
          if (text.includes(teams.homeTeam) && text.includes(teams.awayTeam)) {
            // Extract score from the row
            const scoreMatch = text.match(/(\d+)\s*[-:]\s*(\d+)/);
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
      }, { homeTeam, awayTeam }) as any;

      return searchResults && (searchResults as any).found ? {
        homeScore: (searchResults as any).homeScore,
        awayScore: (searchResults as any).awayScore
      } : null;
      
    } catch (error) {
      console.error('❌ Error searching match result:', error);
      return null;
    }
  }

  private calculateAsianHandicapOutcome(
    homeScore: number, 
    awayScore: number, 
    handicap: number, 
    betSide: 'home' | 'away', 
    odds: number, 
    stake: number
  ): any {
    // Asian Handicap calculation
    const adjustedHomeScore = homeScore + (betSide === 'home' ? handicap : 0);
    const adjustedAwayScore = awayScore + (betSide === 'away' ? -handicap : 0);
    
    let outcome: string;
    let payout: number;
    let profit: number;
    
    if (betSide === 'home') {
      if (adjustedHomeScore > awayScore) {
        outcome = 'win';
        payout = stake * odds;
        profit = payout - stake;
      } else if (adjustedHomeScore === awayScore) {
        outcome = 'push';
        payout = stake;
        profit = 0;
      } else {
        outcome = 'loss';
        payout = 0;
        profit = -stake;
      }
    } else {
      if (adjustedAwayScore > homeScore) {
        outcome = 'win';
        payout = stake * odds;
        profit = payout - stake;
      } else if (adjustedAwayScore === homeScore) {
        outcome = 'push';
        payout = stake;
        profit = 0;
      } else {
        outcome = 'loss';
        payout = 0;
        profit = -stake;
      }
    }
    
    return { outcome, payout, profit };
  }

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

  private updateAllStrategyPerformance(): void {
    const strategies = new Set(Array.from(this.betRecords.values()).map(bet => bet.strategyName));
    
    for (const strategyName of strategies) {
      this.updateStrategyPerformance(strategyName);
    }
  }

  async getSystemPerformance(): Promise<any> {
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

  getStrategyPerformance(strategyName: string): StrategyPerformance | null {
    return this.strategyPerformance.get(strategyName) || null;
  }

  getAllStrategyPerformances(): StrategyPerformance[] {
    return Array.from(this.strategyPerformance.values());
  }

  getStrategyBets(strategyName: string): BetRecord[] {
    return Array.from(this.betRecords.values())
      .filter(bet => bet.strategyName === strategyName)
      .sort((a, b) => b.placedAt - a.placedAt);
  }

  private async saveData(): Promise<void> {
    try {
      // Ensure v2 data directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      
      // Save bet records to v2 structure
      const betRecordsPath = path.join(this.dataDir, 'bet-record.json');
      const betRecordsData = Array.from(this.betRecords.entries());
      await fs.promises.writeFile(betRecordsPath, JSON.stringify(betRecordsData, null, 2));
      
      // Save strategy performance to v2 structure
      const performancePath = path.join(this.dataDir, 'bet-result.json');
      const performanceData = Array.from(this.strategyPerformance.entries());
      await fs.promises.writeFile(performancePath, JSON.stringify(performanceData, null, 2));
      
      // Save system summary to log
      const systemPerformance = await this.getSystemPerformance();
      const logPath = path.join(this.dataDir, 'log.json');
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'system_summary',
        data: systemPerformance
      };
      
      // Append to log
      let logs = [];
      if (fs.existsSync(logPath)) {
        logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      }
      logs.push(logEntry);
      await fs.promises.writeFile(logPath, JSON.stringify(logs, null, 2));
      
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  }

  async manualUpdateResults(): Promise<void> {
    console.log('📊 Manual results update triggered');
    await this.updateResultsFromHKJC();
  }

  getTrackerStatus(): any {
    const pendingBets = Array.from(this.betRecords.values()).filter(bet => !bet.outcome).length;
    
    return {
      isRunning: this.isRunning,
      totalBets: this.betRecords.size,
      pendingBets,
      strategiesTracked: this.strategyPerformance.size,
      lastUpdate: Date.now()
    };
  }

}