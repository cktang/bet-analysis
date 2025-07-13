import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { OddsMonitorService } from './odds-monitor.service';
import { StrategyDecisionService } from './strategy-decision.service';
import { BettingExecutorService } from './betting-executor.service';
import { ResultsTrackerService } from './results-tracker.service';

@Controller('live-trading')
export class LiveTradingController {
  constructor(
    private readonly oddsMonitorService: OddsMonitorService,
    private readonly strategyDecisionService: StrategyDecisionService,
    private readonly bettingExecutorService: BettingExecutorService,
    private readonly resultsTrackerService: ResultsTrackerService,
  ) {}

  @Get('odds/latest')
  async getLatestOdds() {
    return await this.oddsMonitorService.getLatestOdds();
  }

  @Post('odds/monitor')
  async monitorOdds() {
    const oddsData = await this.oddsMonitorService.monitorOdds();
    return { message: 'Odds monitoring completed', data: oddsData };
  }

  @Get('odds/match')
  async getMatchOdds(@Query('home') homeTeam: string, @Query('away') awayTeam: string) {
    return await this.oddsMonitorService.getMatchOdds(homeTeam, awayTeam);
  }

  @Post('strategies/evaluate')
  async evaluateStrategies(@Body() body: { match: any }) {
    return await this.strategyDecisionService.evaluateStrategiesForMatch(body.match);
  }

  @Post('strategies/evaluate-all')
  async evaluateAllStrategies() {
    return await this.strategyDecisionService.evaluateAllCurrentMatches();
  }

  @Post('betting/execute')
  async executeBet(@Body() signal: any) {
    const result = await this.bettingExecutorService.executeBet(signal);
    
    // Record the bet result
    if (result.status === 'success') {
      await this.resultsTrackerService.recordBet(result);
    }
    
    return result;
  }

  @Post('betting/validate-credentials')
  async validateCredentials() {
    const isValid = await this.bettingExecutorService.validateCredentials();
    return { valid: isValid };
  }

  @Post('results/update')
  async updateResults() {
    await this.resultsTrackerService.manualUpdateResults();
    return { message: 'Results update initiated' };
  }

  @Get('results/system-performance')
  async getSystemPerformance() {
    return await this.resultsTrackerService.getSystemPerformance();
  }

  @Get('results/strategy-performance')
  async getStrategyPerformance(@Query('strategy') strategyName?: string) {
    if (strategyName) {
      return this.resultsTrackerService.getStrategyPerformance(strategyName);
    }
    return this.resultsTrackerService.getAllStrategyPerformances();
  }

  @Get('results/strategy-bets')
  async getStrategyBets(@Query('strategy') strategyName: string) {
    return this.resultsTrackerService.getStrategyBets(strategyName);
  }

  @Get('status')
  getStatus() {
    return {
      oddsMonitor: this.oddsMonitorService.getMonitoringStatus(),
      strategyDecision: this.strategyDecisionService.getDecisionStatus(),
      bettingExecutor: this.bettingExecutorService.getExecutorStatus(),
      resultsTracker: this.resultsTrackerService.getTrackerStatus()
    };
  }

  @Post('automated-trading/start')
  async startAutomatedTrading() {
    // This would start the full automated trading cycle:
    // 1. Monitor odds
    // 2. Evaluate strategies  
    // 3. Execute bets
    // 4. Track results
    
    try {
      // Get latest odds
      const oddsData = await this.oddsMonitorService.monitorOdds();
      
      if (!oddsData || !oddsData.matches || oddsData.matches.length === 0) {
        return { message: 'No matches available for trading' };
      }
      
      // Evaluate strategies for all matches
      const allSignals = await this.strategyDecisionService.evaluateAllCurrentMatches();
      
      if (allSignals.length === 0) {
        return { message: 'No betting signals generated' };
      }
      
      // Execute bets for all signals
      const executionResults = [];
      for (const signal of allSignals) {
        try {
          const result = await this.bettingExecutorService.executeBet(signal);
          executionResults.push(result);
          
          // Record successful bets
          if (result.status === 'success') {
            await this.resultsTrackerService.recordBet(result);
          }
        } catch (error) {
          console.error(`❌ Failed to execute bet for ${signal.homeTeam} vs ${signal.awayTeam}:`, error);
          executionResults.push({
            ...signal,
            status: 'failed',
            error
          });
        }
      }
      
      return {
        message: 'Automated trading cycle completed',
        oddsUpdate: oddsData,
        signals: allSignals,
        executions: executionResults,
        summary: {
          matchesAnalyzed: oddsData.matches.length,
          signalsGenerated: allSignals.length,
          betsExecuted: executionResults.filter(r => r.status === 'success').length,
          betsAttempted: executionResults.length
        }
      };
      
    } catch (error) {
      console.error('❌ Automated trading failed:', error);
      return {
        message: 'Automated trading failed',
        error
      };
    }
  }
}