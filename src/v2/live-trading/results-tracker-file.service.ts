import { Injectable } from '@nestjs/common';
import { DataFileService } from '../core/data-file.service';

@Injectable()
export class ResultsTrackerFileService {
  constructor(private dataFileService: DataFileService) {}

  async startResultsTracker() {
    await this.dataFileService.writeLog('info', 'Starting results tracker');
    
    // Track completed matches every 5 minutes
    setInterval(async () => {
      await this.trackCompletedMatches();
    }, 5 * 60 * 1000);
    
    // Initial check
    await this.trackCompletedMatches();
  }

  private async trackCompletedMatches() {
    const betRecords: any[] = await this.dataFileService.getBetRecords();
    const existingResults: any[] = await this.dataFileService.getBetResults();
    const existingResultIds = new Set(existingResults.map((r: any) => r.betId));
    
    for (const bet of betRecords) {
      if (existingResultIds.has(bet.betId)) {
        continue; // Already processed
      }
      
      // Check if match has finished (simple time check for mock)
      const now = new Date();
      const kickoffTime = new Date(bet.fixtureId.includes('fixture_') ? 
        now.getTime() - (2 * 60 * 60 * 1000) : // Mock fixture: assume finished 2 hours ago
        now.getTime() + (1 * 60 * 60 * 1000)   // Real fixture: use actual time
      );
      
      if (now.getTime() > kickoffTime.getTime() + (2 * 60 * 60 * 1000)) { // 2 hours after kickoff
        const result = this.generateMockResult(bet);
        await this.dataFileService.addBetResult(result);
        await this.dataFileService.writeLog('info', `Generated result for bet ${bet.betId}`);
      }
    }
  }

  private generateMockResult(bet: any): any {
    // Generate realistic match result
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 4);
    
    // Calculate handicap result
    const handicapValue = this.parseHandicap(bet.handicap);
    const adjustedHomeScore = homeScore + handicapValue;
    
    let result: 'win' | 'lose' | 'draw';
    let profit = 0;
    
    if (Math.abs(adjustedHomeScore - awayScore) < 0.001) {
      result = 'draw';
      profit = 0; // Stake returned
    } else if (
      (bet.betSide === 'home' && adjustedHomeScore > awayScore) ||
      (bet.betSide === 'away' && adjustedHomeScore < awayScore)
    ) {
      result = 'win';
      profit = (bet.odds - 1) * bet.stake;
    } else {
      result = 'lose';
      profit = -bet.stake;
    }
    
    return {
      betId: bet.betId,
      fixtureId: bet.fixtureId,
      homeScore,
      awayScore,
      result,
      profit,
      roi: (profit / bet.stake) * 100,
      timestamp: new Date().toISOString()
    };
  }

  private parseHandicap(handicap: string): number {
    if (handicap.includes('/')) {
      // Quarter handicap like +0.5/+1 or -0.25/-0.5
      const parts = handicap.split('/');
      return (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
    }
    return parseFloat(handicap) || 0;
  }

  async getPerformanceMetrics() {
    const results: any[] = await this.dataFileService.getBetResults();
    
    if (results.length === 0) {
      return {
        totalBets: 0,
        totalProfit: 0,
        winRate: 0,
        roi: 0
      };
    }
    
    const totalBets = results.length;
    const wins = results.filter((r: any) => r.result === 'win').length;
    const totalProfit = results.reduce((sum: number, r: any) => sum + r.profit, 0);
    const totalStake = results.reduce((sum: number, r: any) => sum + Math.abs(r.profit), 0);
    
    return {
      totalBets,
      wins,
      totalProfit,
      winRate: (wins / totalBets) * 100,
      roi: totalStake > 0 ? (totalProfit / totalStake) * 100 : 0
    };
  }
}