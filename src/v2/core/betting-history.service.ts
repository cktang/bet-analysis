import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DataFileService } from './data-file.service';

export interface BettingSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalMatches: number;
  totalBets: number;
  totalStake: number;
  totalProfit: number;
  winRate: number;
  roi: number;
  status: 'active' | 'completed';
}

export interface BettingRecord {
  betId: string;
  matchId: string;
  strategy: string;
  betSide: 'home' | 'away';
  stake: number;
  odds: number;
  handicap: string;
  timestamp: Date;
  status: 'pending' | 'won' | 'lost' | 'draw';
  profit?: number;
  actualResult?: string;
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  asianHandicapResult: 'home' | 'away' | 'draw';
  actualResult: 'home' | 'away' | 'draw';
  timestamp: Date;
}

@Injectable()
export class BettingHistoryService {
  private readonly dataDir = path.join(process.cwd(), 'data', 'v2');
  private readonly sessionsFile = path.join(this.dataDir, 'bet-session.json');
  private readonly recordsFile = path.join(this.dataDir, 'bet-record.json');
  private readonly resultsFile = path.join(this.dataDir, 'bet-result.json');
  
  private currentSession: BettingSession | null = null;

  constructor(private readonly dataFileService: DataFileService) {
    this.ensureDataDirectory();
    this.loadCurrentSession();
  }

  /**
   * Start a new betting session
   */
  startNewSession(): BettingSession {
    if (this.currentSession?.status === 'active') {
      this.endCurrentSession();
    }

    this.currentSession = {
      sessionId: `SESSION_${Date.now()}`,
      startTime: new Date(),
      totalMatches: 0,
      totalBets: 0,
      totalStake: 0,
      totalProfit: 0,
      winRate: 0,
      roi: 0,
      status: 'active'
    };

    this.saveSession();
    console.log(`📊 Started new betting session: ${this.currentSession.sessionId}`);
    return this.currentSession;
  }

  /**
   * Record a real betting decision (not mock)
   */
  recordBettingDecision(bettingRecord: BettingRecord): void {
    if (!this.currentSession || this.currentSession.status !== 'active') {
      this.startNewSession();
    }

    // Save betting record
    this.saveBettingRecord(bettingRecord);
    
    // Update session stats
    if (this.currentSession) {
      this.currentSession.totalBets++;
      this.currentSession.totalStake += bettingRecord.stake;
      this.saveSession();
    }

    console.log(`💰 Recorded betting decision: ${bettingRecord.betId}`);
  }

  /**
   * Record match result and update betting records
   */
  recordMatchResult(matchResult: MatchResult): void {
    // Find betting records for this match
    const bettingRecords = this.loadBettingRecords();
    const matchBets = bettingRecords.filter(bet => bet.matchId === matchResult.matchId);

    // Update each betting record with result
    matchBets.forEach(bet => {
      this.updateBettingRecordWithResult(bet, matchResult);
    });

    // Save match result
    this.saveMatchResult(matchResult);
    
    console.log(`⚽ Recorded match result: ${matchResult.matchId} (${matchResult.homeScore}-${matchResult.awayScore})`);
  }

  /**
   * Get current session
   */
  getCurrentSession(): BettingSession | null {
    return this.currentSession;
  }

  /**
   * Get all betting records
   */
  getAllBettingRecords(): BettingRecord[] {
    return this.loadBettingRecords();
  }

  /**
   * Get betting records for a specific match
   */
  getBettingRecordsForMatch(matchId: string): BettingRecord[] {
    return this.loadBettingRecords().filter(bet => bet.matchId === matchId);
  }

  /**
   * Get dashboard data
   */
  getDashboardData(): any {
    const session = this.getCurrentSession();
    const records = this.getAllBettingRecords();
    
    return {
      session: session || {
        sessionId: 'none',
        startTime: new Date(),
        totalBets: 0,
        totalStake: 0,
        totalProfit: 0,
        winRate: 0,
        roi: 0,
        status: 'inactive'
      },
      recentBets: records.slice(-10), // Last 10 bets
      totalRecords: records.length
    };
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(): any {
    const session = this.getCurrentSession();
    const records = this.getAllBettingRecords();
    
    if (!session) {
      return {
        activeBets: 0,
        completedBets: 0,
        totalProfit: 0,
        winRate: 0,
        roi: 0
      };
    }

    const completedBets = records.filter(bet => bet.status !== 'pending');
    const wonBets = completedBets.filter(bet => bet.status === 'won');
    
    return {
      activeBets: records.filter(bet => bet.status === 'pending').length,
      completedBets: completedBets.length,
      totalProfit: session.totalProfit,
      winRate: completedBets.length > 0 ? (wonBets.length / completedBets.length) * 100 : 0,
      roi: session.roi
    };
  }

  private updateBettingRecordWithResult(bet: BettingRecord, result: MatchResult): void {
    let status: 'won' | 'lost' | 'draw';
    let profit: number;

    if (result.asianHandicapResult === 'draw') {
      status = 'draw';
      profit = 0; // Stake returned
    } else if (result.asianHandicapResult === bet.betSide) {
      status = 'won';
      profit = (bet.odds - 1) * bet.stake;
    } else {
      status = 'lost';
      profit = -bet.stake;
    }

    bet.status = status;
    bet.profit = profit;
    bet.actualResult = `${result.homeScore}-${result.awayScore}`;

    // Update session stats
    if (this.currentSession && this.currentSession.status === 'active') {
      this.currentSession.totalProfit += profit;
      
      // Recalculate win rate and ROI
      const completedBets = this.loadBettingRecords().filter(b => b.status !== 'pending');
      const wonBets = completedBets.filter(b => b.status === 'won');
      
      this.currentSession.winRate = completedBets.length > 0 ? 
        (wonBets.length / completedBets.length) * 100 : 0;
      
      this.currentSession.roi = this.currentSession.totalStake > 0 ? 
        (this.currentSession.totalProfit / this.currentSession.totalStake) * 100 : 0;
      
      this.saveSession();
    }

    this.saveBettingRecord(bet);
  }

  private endCurrentSession(): void {
    if (this.currentSession) {
      this.currentSession.status = 'completed';
      this.currentSession.endTime = new Date();
      this.saveSession();
      console.log(`📊 Ended betting session: ${this.currentSession.sessionId}`);
    }
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadCurrentSession(): void {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const sessions = JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'));
        this.currentSession = sessions.find((s: BettingSession) => s.status === 'active') || null;
      }
    } catch (error) {
      console.error('Error loading current session:', error);
      this.currentSession = null;
    }
  }

  private saveSession(): void {
    try {
      let sessions: BettingSession[] = [];
      
      if (fs.existsSync(this.sessionsFile)) {
        sessions = JSON.parse(fs.readFileSync(this.sessionsFile, 'utf8'));
      }

      if (this.currentSession) {
        const existingIndex = sessions.findIndex(s => s.sessionId === this.currentSession!.sessionId);
        if (existingIndex >= 0) {
          sessions[existingIndex] = this.currentSession;
        } else {
          sessions.push(this.currentSession);
        }

        fs.writeFileSync(this.sessionsFile, JSON.stringify(sessions, null, 2));
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private loadBettingRecords(): BettingRecord[] {
    try {
      if (fs.existsSync(this.recordsFile)) {
        return JSON.parse(fs.readFileSync(this.recordsFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading betting records:', error);
    }
    return [];
  }

  private saveBettingRecord(record: BettingRecord): void {
    try {
      let records = this.loadBettingRecords();
      
      const existingIndex = records.findIndex(r => r.betId === record.betId);
      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.push(record);
      }

      fs.writeFileSync(this.recordsFile, JSON.stringify(records, null, 2));
    } catch (error) {
      console.error('Error saving betting record:', error);
    }
  }

  private saveMatchResult(result: MatchResult): void {
    try {
      let results: MatchResult[] = [];
      
      if (fs.existsSync(this.resultsFile)) {
        results = JSON.parse(fs.readFileSync(this.resultsFile, 'utf8'));
      }

      const existingIndex = results.findIndex(r => r.matchId === result.matchId);
      if (existingIndex >= 0) {
        results[existingIndex] = result;
      } else {
        results.push(result);
      }

      fs.writeFileSync(this.resultsFile, JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('Error saving match result:', error);
    }
  }
}