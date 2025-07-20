import { Injectable } from '@nestjs/common';
import { Page } from 'playwright';
import { hkjc_bet_handicap } from '../../utils/hkjc-util.js';

export interface BetRequest {
  betId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  betSide: 'home' | 'away';
  handicap: number;
  odds: number;
  stakeAmount: number;
  strategyName?: string;
}

export interface BetResult {
  betId: string;
  success: boolean;
  hkjcBetId?: string;
  error?: string;
  actualOdds?: number;
  actualStake?: number;
  placedAt: number;
  executionTime: string;
}

export interface MatchOdds {
  homeOdds: number;
  awayOdds: number;
  handicap: number;
  timestamp: number;
  matchId?: string;
  homeTeam?: string;
  awayTeam?: string;
}

@Injectable()
export class BettingUtilitiesService {

  /**
   * Place a bet using the standardized HKJC utility
   */
  async placeBet(page: Page, betRequest: BetRequest): Promise<BetResult> {
    const result: BetResult = {
      betId: betRequest.betId,
      success: false,
      placedAt: Date.now(),
      executionTime: new Date().toISOString()
    };

    try {
      console.log(`💰 Placing ${betRequest.betSide} bet of $${betRequest.stakeAmount} on ${betRequest.homeTeam} vs ${betRequest.awayTeam}`);
      
      // Convert betRequest to format expected by hkjc_bet_handicap
      const match = {
        id: betRequest.matchId,
        decision: betRequest.betSide
      };

      // Use the standardized betting utility
      const betResult = await hkjc_bet_handicap(page, match, betRequest.stakeAmount);

      if (betResult) {
        result.success = true;
        result.hkjcBetId = `HKJC_${Date.now()}_${betRequest.matchId}`;
        result.actualOdds = betRequest.odds; // Would need to extract from betResult if available
        result.actualStake = betRequest.stakeAmount;
        
        console.log(`✅ Bet placed successfully: ${result.hkjcBetId}`);
      } else {
        result.error = 'Failed to place bet - hkjc_bet_handicap returned false';
        console.error(`❌ Bet placement failed: ${result.error}`);
      }

    } catch (error) {
      result.error = (error as Error).message;
      console.error(`❌ Bet placement error: ${result.error}`);
    }

    return result;
  }

  /**
   * Execute a paper bet (simulation)
   */
  async executePaperBet(betRequest: BetRequest): Promise<BetResult> {
    console.log(`📝 Paper trading bet: ${betRequest.matchId} (${betRequest.betSide}) - $${betRequest.stakeAmount}`);
    
    // Simulate bet placement delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      betId: betRequest.betId,
      success: true,
      hkjcBetId: `PAPER_${Date.now()}_${betRequest.matchId}`,
      actualOdds: betRequest.odds,
      actualStake: betRequest.stakeAmount,
      placedAt: Date.now(),
      executionTime: new Date().toISOString()
    };
  }

  /**
   * Parse odds from match data
   */
  parseMatchOdds(match: any): MatchOdds | null {
    try {
      if (!match || !match.homeOdds || !match.awayOdds) {
        return null;
      }

      return {
        homeOdds: parseFloat(match.homeOdds),
        awayOdds: parseFloat(match.awayOdds),
        handicap: this.parseHandicap(match.handicap),
        timestamp: match.timestamp || Date.now(),
        matchId: match.matchId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam
      };
    } catch (error) {
      console.error('Error parsing match odds:', error);
      return null;
    }
  }

  /**
   * Parse handicap string to number (handles quarter handicaps)
   */
  parseHandicap(handicapStr: string | number): number {
    if (typeof handicapStr === 'number') {
      return handicapStr;
    }

    if (!handicapStr) return 0;
    
    // Handle quarter handicaps like "0/+0.5" or "-0.5/-1"
    if (handicapStr.includes('/')) {
      const parts = handicapStr.split('/');
      const num1 = parseFloat(parts[0].replace(/[^\d\-\.]/g, ''));
      const num2 = parseFloat(parts[1].replace(/[^\d\-\.]/g, ''));
      return (num1 + num2) / 2;
    }
    
    return parseFloat(handicapStr.replace(/[^\d\-\.]/g, '')) || 0;
  }

  /**
   * Get odds for specific bet side
   */
  getOddsForSide(match: any, betSide: 'home' | 'away'): number {
    return betSide === 'home' ? match.homeOdds : match.awayOdds;
  }

  /**
   * Validate bet request
   */
  validateBetRequest(betRequest: BetRequest): { valid: boolean; error?: string } {
    if (!betRequest.matchId) {
      return { valid: false, error: 'Match ID is required' };
    }

    if (!betRequest.homeTeam || !betRequest.awayTeam) {
      return { valid: false, error: 'Team names are required' };
    }

    if (!['home', 'away'].includes(betRequest.betSide)) {
      return { valid: false, error: 'Invalid bet side' };
    }

    if (!betRequest.stakeAmount || betRequest.stakeAmount <= 0) {
      return { valid: false, error: 'Invalid stake amount' };
    }

    if (!betRequest.odds || betRequest.odds <= 1) {
      return { valid: false, error: 'Invalid odds' };
    }

    return { valid: true };
  }

  /**
   * Extract season from decision data to prevent season collisions
   */
  extractSeasonFromDecision(decision: any): string {
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

  /**
   * Generate match key with season to prevent collisions
   */
  generateMatchKey(homeTeam: string, awayTeam: string, season: string): string {
    return `${season}_${homeTeam} v ${awayTeam}`;
  }

  /**
   * Generate unique bet ID
   */
  generateBetId(matchId: string, strategy?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const prefix = strategy ? `${strategy}_` : '';
    return `${prefix}bet_${timestamp}_${matchId}_${random}`;
  }

  /**
   * Calculate confidence based on odds and historical performance
   */
  calculateConfidence(odds: number, winRate?: number, roi?: number): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on odds (prefer 1.8-2.2 range)
    if (odds >= 1.8 && odds <= 2.2) {
      confidence += 0.1;
    } else if (odds >= 1.6 && odds <= 2.5) {
      confidence += 0.05;
    } else if (odds < 1.5 || odds > 3.0) {
      confidence -= 0.1;
    }

    // Adjust based on historical performance if available
    if (winRate) {
      confidence += (winRate - 50) / 200; // +/- 0.25 for 100% win rate difference
    }

    if (roi) {
      confidence += Math.min(roi / 100, 0.2); // Cap ROI boost at 20%
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }
}