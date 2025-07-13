import fs from 'fs';
import path from 'path';
import { eventBus } from '../coordinator/EventBus';
import { EnhancedDataBuilder } from '../data/EnhancedDataBuilder';

export interface Strategy {
  name: string;
  timestamp: number;
  side: {
    category: string;
    key: string;
    expression: string;
    description: string;
    betSide: string;
  };
  size: {
    category: string;
    key: string;
    expression: string;
    description: string;
    stakingMethod: string;
  };
  factors: Array<{
    category: string;
    key: string;
    expression: string;
    description: string;
    displayExpression?: any;
  }>;
  performance: {
    roi: number;
    totalBets: number;
    winRate: number;
    totalProfit: number;
  };
}

export interface BettingDecision {
  strategyName: string;
  shouldBet: boolean;
  betSide: 'home' | 'away';
  stakeAmount: number;
  odds: number;
  handicap: number;
  confidence: number;
  factors: Record<string, any>;
  reason: string;
}

/**
 * Strategy Decision Engine
 * Evaluates each strategy independently and makes betting decisions 5-10 minutes before kickoff
 */
export class StrategyDecisionEngine {
  private strategies: Strategy[] = [];
  private enhancedDataBuilder: EnhancedDataBuilder;
  private isRunning = false;
  private decisionInterval: NodeJS.Timeout | null = null;
  private factorDefinitions: any = null;
  
  // Timing configuration
  private readonly DECISION_WINDOW_MINUTES = 10; // Minutes before kickoff to make decisions
  private readonly CHECK_INTERVAL_MS = 60000; // Check every minute

  constructor(enhancedDataBuilder: EnhancedDataBuilder) {
    this.enhancedDataBuilder = enhancedDataBuilder;
    this.loadStrategies();
    this.loadFactorDefinitions();
    
    eventBus.emitModuleStatus({
      moduleName: 'StrategyDecisionEngine',
      status: 'offline',
      message: 'Initialized but not started'
    });
  }

  /**
   * Load all strategies from strategy files
   */
  private loadStrategies(): void {
    try {
      const strategyPath = path.join(process.cwd(), 'src/pattern-discovery/strategy.json');
      
      if (fs.existsSync(strategyPath)) {
        const strategyData = fs.readFileSync(strategyPath, 'utf8');
        this.strategies = JSON.parse(strategyData);
        console.log(`Loaded ${this.strategies.length} strategies`);
      } else {
        console.warn('No strategy file found, creating empty strategy list');
        this.strategies = [];
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
      eventBus.emitSystemAlert({
        severity: 'error',
        message: 'Failed to load strategies',
        details: error,
        source: 'StrategyDecisionEngine'
      });
    }
  }

  /**
   * Load factor definitions for expression evaluation
   */
  private loadFactorDefinitions(): void {
    try {
      const factorPath = path.join(process.cwd(), 'src/pattern-discovery/factor_definitions.json');
      
      if (fs.existsSync(factorPath)) {
        const factorData = fs.readFileSync(factorPath, 'utf8');
        this.factorDefinitions = JSON.parse(factorData);
        console.log('Loaded factor definitions');
      } else {
        console.warn('No factor definitions found');
      }
    } catch (error) {
      console.error('Error loading factor definitions:', error);
    }
  }

  /**
   * Start the decision engine
   */
  public start(): void {
    if (this.isRunning) {
      console.log('StrategyDecisionEngine is already running');
      return;
    }

    this.isRunning = true;
    
    eventBus.emitModuleStatus({
      moduleName: 'StrategyDecisionEngine',
      status: 'online',
      message: `Started with ${this.strategies.length} strategies`
    });

    // Set up periodic decision making
    this.decisionInterval = setInterval(async () => {
      try {
        await this.evaluateAllStrategies();
      } catch (error) {
        console.error('Error in strategy evaluation:', error);
        eventBus.emitSystemAlert({
          severity: 'error',
          message: 'Failed strategy evaluation cycle',
          details: error,
          source: 'StrategyDecisionEngine'
        });
      }
    }, this.CHECK_INTERVAL_MS);

    console.log(`StrategyDecisionEngine started with ${this.CHECK_INTERVAL_MS}ms interval`);
  }

  /**
   * Stop the decision engine
   */
  public stop(): void {
    this.isRunning = false;
    
    if (this.decisionInterval) {
      clearInterval(this.decisionInterval);
      this.decisionInterval = null;
    }

    eventBus.emitModuleStatus({
      moduleName: 'StrategyDecisionEngine',
      status: 'offline',
      message: 'Stopped decision engine'
    });

    console.log('StrategyDecisionEngine stopped');
  }

  /**
   * Evaluate all strategies for upcoming matches
   */
  private async evaluateAllStrategies(): Promise<void> {
    const liveData = this.enhancedDataBuilder.getLiveEnhancedData();
    
    if (!liveData || Object.keys(liveData.matches).length === 0) {
      return;
    }

    const now = new Date();
    
    // Check each match for betting decisions
    for (const [matchKey, match] of Object.entries(liveData.matches)) {
      const kickoffTime = new Date(match.match.date);
      const minutesUntilKickoff = (kickoffTime.getTime() - now.getTime()) / (1000 * 60);
      
      // Make decisions 5-10 minutes before kickoff
      if (minutesUntilKickoff > 5 && minutesUntilKickoff <= this.DECISION_WINDOW_MINUTES) {
        await this.evaluateMatchForAllStrategies(matchKey, match);
      }
    }
  }

  /**
   * Evaluate a specific match against all strategies
   */
  private async evaluateMatchForAllStrategies(matchKey: string, match: any): Promise<void> {
    console.log(`Evaluating strategies for: ${matchKey}`);
    
    for (const strategy of this.strategies) {
      try {
        const decision = await this.evaluateStrategy(strategy, match);
        
        if (decision.shouldBet) {
          console.log(`Strategy ${strategy.name} signals BET for ${matchKey}`);
          
          // Emit betting signal
          eventBus.emitBettingSignal({
            strategyName: strategy.name,
            matchId: match.match.eventId,
            homeTeam: match.match.homeTeam,
            awayTeam: match.match.awayTeam,
            kickoffTime: match.match.date,
            decision: {
              betSide: decision.betSide,
              handicap: decision.handicap,
              odds: decision.odds,
              stakeAmount: decision.stakeAmount,
              confidence: decision.confidence
            },
            preMatchFactors: decision.factors
          });
        }
      } catch (error) {
        console.error(`Error evaluating strategy ${strategy.name}:`, error);
      }
    }
  }

  /**
   * Evaluate a single strategy against a match
   */
  private async evaluateStrategy(strategy: Strategy, match: any): Promise<BettingDecision> {
    const decision: BettingDecision = {
      strategyName: strategy.name,
      shouldBet: false,
      betSide: 'home',
      stakeAmount: 0,
      odds: 0,
      handicap: 0,
      confidence: 0,
      factors: {},
      reason: 'Not evaluated'
    };

    try {
      // Create evaluation context
      const context = this.createEvaluationContext(match);
      
      // Evaluate all factors
      const factorResults: Record<string, boolean> = {};
      let allFactorsSatisfied = true;

      // Evaluate main factors
      for (const factor of strategy.factors) {
        const result = this.evaluateExpression(factor.expression, context);
        factorResults[`${factor.category}_${factor.key}`] = result;
        
        if (!result) {
          allFactorsSatisfied = false;
        }
      }

      // Store factor evaluation results
      decision.factors = factorResults;

      if (!allFactorsSatisfied) {
        decision.reason = 'Not all factors satisfied';
        return decision;
      }

      // Determine bet side
      const betSide = this.evaluateBetSide(strategy.side, context);
      if (!betSide) {
        decision.reason = 'Could not determine bet side';
        return decision;
      }

      // Calculate stake amount
      const stakeAmount = this.evaluateStakeAmount(strategy.size, context);
      if (stakeAmount <= 0) {
        decision.reason = 'Invalid stake amount';
        return decision;
      }

      // Get odds and handicap based on bet side
      const { odds, handicap } = this.getOddsAndHandicap(match, betSide);

      // Calculate confidence based on strategy performance and current odds
      const confidence = this.calculateConfidence(strategy, odds);

      // All checks passed - strategy signals a bet
      decision.shouldBet = true;
      decision.betSide = betSide;
      decision.stakeAmount = stakeAmount;
      decision.odds = odds;
      decision.handicap = handicap;
      decision.confidence = confidence;
      decision.reason = 'All factors satisfied';

      return decision;

    } catch (error) {
      console.error(`Error evaluating strategy ${strategy.name}:`, error);
      decision.reason = `Evaluation error: ${error.message}`;
      return decision;
    }
  }

  /**
   * Create evaluation context for expressions
   */
  private createEvaluationContext(match: any): any {
    return {
      match: match.match,
      fbref: match.fbref || {},
      timeSeries: match.timeSeries || {},
      preMatch: match.enhanced?.preMatch || {},
      postMatch: match.enhanced?.postMatch || {},
      enhanced: match.enhanced || {},
      Math: Math,
      parseFloat: parseFloat,
      parseInt: parseInt
    };
  }

  /**
   * Evaluate expression safely
   */
  private evaluateExpression(expression: string, context: any): any {
    try {
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return func(...Object.values(context));
    } catch (error) {
      console.warn(`Error evaluating expression "${expression}":`, error);
      return false;
    }
  }

  /**
   * Evaluate bet side for strategy
   */
  private evaluateBetSide(sideConfig: any, context: any): 'home' | 'away' | null {
    try {
      if (typeof sideConfig.betSide === 'string' && !sideConfig.betSide.includes('match.')) {
        return sideConfig.betSide as 'home' | 'away';
      }
      
      // Dynamic evaluation
      const result = this.evaluateExpression(sideConfig.betSide, context);
      return result === 'home' || result === 'away' ? result : null;
    } catch (error) {
      console.warn('Error evaluating bet side:', error);
      return null;
    }
  }

  /**
   * Evaluate stake amount for strategy
   */
  private evaluateStakeAmount(sizeConfig: any, context: any): number {
    try {
      const result = this.evaluateExpression(sizeConfig.expression, context);
      return typeof result === 'number' && result > 0 ? result : 0;
    } catch (error) {
      console.warn('Error evaluating stake amount:', error);
      return 0;
    }
  }

  /**
   * Get odds and handicap for bet side
   */
  private getOddsAndHandicap(match: any, betSide: 'home' | 'away'): { odds: number; handicap: number } {
    const ahOdds = match.match.asianHandicapOdds;
    
    if (betSide === 'home') {
      return {
        odds: ahOdds.homeOdds,
        handicap: this.parseHandicap(ahOdds.homeHandicap)
      };
    } else {
      return {
        odds: ahOdds.awayOdds,
        handicap: this.parseHandicap(ahOdds.awayHandicap)
      };
    }
  }

  /**
   * Parse handicap string to number
   */
  private parseHandicap(handicapStr: string): number {
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
   * Calculate confidence based on strategy performance and current conditions
   */
  private calculateConfidence(strategy: Strategy, currentOdds: number): number {
    const baseConfidence = Math.min(strategy.performance.roi / 100, 0.8); // Cap at 80%
    const winRateBonus = (strategy.performance.winRate - 50) / 100; // Bonus for > 50% win rate
    const oddsAdjustment = this.getOddsConfidenceAdjustment(currentOdds);
    
    return Math.max(0.1, Math.min(0.95, baseConfidence + winRateBonus + oddsAdjustment));
  }

  /**
   * Get confidence adjustment based on odds level
   */
  private getOddsConfidenceAdjustment(odds: number): number {
    // Prefer odds in the sweet spot (1.8-2.2)
    if (odds >= 1.8 && odds <= 2.2) return 0.1;
    if (odds >= 1.6 && odds <= 2.5) return 0.05;
    if (odds < 1.5 || odds > 3.0) return -0.1;
    return 0;
  }

  /**
   * Add new strategy
   */
  public addStrategy(strategy: Strategy): void {
    this.strategies.push(strategy);
    console.log(`Added strategy: ${strategy.name}`);
  }

  /**
   * Remove strategy
   */
  public removeStrategy(strategyName: string): void {
    this.strategies = this.strategies.filter(s => s.name !== strategyName);
    console.log(`Removed strategy: ${strategyName}`);
  }

  /**
   * Get all strategies
   */
  public getStrategies(): Strategy[] {
    return [...this.strategies];
  }

  /**
   * Get strategy by name
   */
  public getStrategy(strategyName: string): Strategy | null {
    return this.strategies.find(s => s.name === strategyName) || null;
  }

  /**
   * Manual strategy evaluation for testing
   */
  public async manualEvaluateStrategy(strategyName: string, matchKey: string): Promise<BettingDecision | null> {
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      console.error(`Strategy not found: ${strategyName}`);
      return null;
    }

    const liveData = this.enhancedDataBuilder.getLiveEnhancedData();
    if (!liveData || !liveData.matches[matchKey]) {
      console.error(`Match not found: ${matchKey}`);
      return null;
    }

    return await this.evaluateStrategy(strategy, liveData.matches[matchKey]);
  }

  /**
   * Get decision engine status
   */
  public getStatus(): {
    isRunning: boolean;
    strategiesLoaded: number;
    lastEvaluation: number;
  } {
    return {
      isRunning: this.isRunning,
      strategiesLoaded: this.strategies.length,
      lastEvaluation: Date.now()
    };
  }
}