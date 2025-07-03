/**
 * BettingService - Example service showing how to use the core architecture
 * Demonstrates event-driven communication and dependency injection
 */

import { BaseService } from '../core/BaseService';
import { IContainer } from '../core/Container';

export interface BetRequest {
  matchId: string;
  betType: 'handicap' | 'overunder' | 'win';
  amount: number;
  odds: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
}

export interface BetResult {
  betId: string;
  status: 'placed' | 'failed' | 'pending';
  message: string;
  timestamp: Date;
}

export class BettingService extends BaseService {
  public readonly name = 'BettingService';
  private activeBets = new Map<string, BetRequest>();
  private betHistory: BetResult[] = [];

  constructor(container: IContainer) {
    super(container);
  }

  protected async onInitialize(): Promise<void> {
    this.log('info', 'Setting up betting service...');
    
    // Listen for relevant events
    this.on<any>('match.updated', this.handleMatchUpdate.bind(this));
    this.on<any>('user.betRequest', this.handleBetRequest.bind(this));
    this.on<any>('system.shutdown', this.handleSystemShutdown.bind(this));
    
    // Load betting configuration
    const bettingConfig = this.getConfig('betting');
    this.log('info', `Loaded ${Object.keys(bettingConfig.leagues).length} leagues`);
    
    // Initialize betting history
    await this.loadBettingHistory();
    
    this.log('info', 'Betting service ready');
  }

  protected async onShutdown(): Promise<void> {
    this.log('info', 'Shutting down betting service...');
    
    // Save any pending bets
    await this.savePendingBets();
    
    // Clean up resources
    this.activeBets.clear();
    
    this.log('info', 'Betting service shutdown complete');
  }

  async placeBet(request: BetRequest): Promise<BetResult> {
    const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.log('info', `Placing bet: ${betId}`, request);
      
      // Validate bet request
      await this.validateBetRequest(request);
      
      // Check if teams exist in configuration
      const teams = this.config?.getTeams(request.league, '2024-2025');
      if (!teams || !teams[request.homeTeam] || !teams[request.awayTeam]) {
        throw new Error(`Invalid teams for league ${request.league}`);
      }
      
      // Store active bet
      this.activeBets.set(betId, request);
      
      // Simulate bet placement (in real implementation, this would call betting API)
      const success = await this.simulateBetPlacement(request);
      
      const result: BetResult = {
        betId,
        status: success ? 'placed' : 'failed',
        message: success ? 'Bet placed successfully' : 'Failed to place bet',
        timestamp: new Date()
      };
      
      // Store in history
      this.betHistory.push(result);
      
      // Emit event for other services
      await this.emit('bet.placed', { betId, request, result });
      
      this.log('info', `Bet ${betId} ${result.status}: ${result.message}`);
      
      return result;
      
    } catch (error) {
      const result: BetResult = {
        betId,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      
      this.betHistory.push(result);
      await this.emit('bet.failed', { betId, request, error });
      
      this.log('error', `Bet ${betId} failed:`, error);
      return result;
    }
  }

  async getBetHistory(limit: number = 50): Promise<BetResult[]> {
    return this.betHistory.slice(-limit);
  }

  async getActiveBets(): Promise<BetRequest[]> {
    return Array.from(this.activeBets.values());
  }

  // Private methods
  private async validateBetRequest(request: BetRequest): Promise<void> {
    if (!request.matchId || !request.betType || !request.amount || !request.odds) {
      throw new Error('Invalid bet request: missing required fields');
    }
    
    if (request.amount <= 0) {
      throw new Error('Bet amount must be positive');
    }
    
    if (request.odds <= 0) {
      throw new Error('Odds must be positive');
    }
    
    const bettingConfig = this.getConfig('betting');
    if (!bettingConfig.leagues[request.league]) {
      throw new Error(`Unsupported league: ${request.league}`);
    }
  }

  private async simulateBetPlacement(request: BetRequest): Promise<boolean> {
    // Simulate API call with retry logic
    return await this.retry(async () => {
      // Simulate random success/failure
      const success = Math.random() > 0.2; // 80% success rate
      if (!success) {
        throw new Error('Betting API temporarily unavailable');
      }
      return true;
    }, 3, 1000);
  }

  private async loadBettingHistory(): Promise<void> {
    // In real implementation, load from database
    this.log('debug', 'Loading betting history from storage...');
    // this.betHistory = await database.getBetHistory();
  }

  private async savePendingBets(): Promise<void> {
    if (this.activeBets.size > 0) {
      this.log('info', `Saving ${this.activeBets.size} pending bets...`);
      // In real implementation, save to database
      // await database.savePendingBets(Array.from(this.activeBets.values()));
    }
  }

  // Event handlers
  private async handleMatchUpdate(data: any): Promise<void> {
    this.log('debug', 'Match updated:', data);
    // Handle match updates that might affect active bets
  }

  private async handleBetRequest(data: any): Promise<void> {
    this.log('debug', 'Bet request received:', data);
    // Handle external bet requests
    if (data.request) {
      await this.placeBet(data.request);
    }
  }

  private async handleSystemShutdown(): Promise<void> {
    this.log('info', 'System shutdown requested, preparing betting service...');
    // Prepare for shutdown
  }
}