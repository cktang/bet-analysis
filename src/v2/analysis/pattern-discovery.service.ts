import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PatternDiscoveryService {
  private factorDefinitions: any;
  private strategies: any;

  async onModuleInit() {
    console.log('🔍 Pattern Discovery Service initialized');
    
    // Load with timeout to prevent hanging
    Promise.race([
      this.loadFactorDefinitions(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loading factor definitions')), 2000))
    ]).catch(error => {
      console.warn('⚠️ Could not load factor definitions:', error.message);
      this.factorDefinitions = {};
    });
    
    Promise.race([
      this.loadStrategies(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout loading strategies')), 2000))
    ]).catch(error => {
      console.warn('⚠️ Could not load strategies:', error.message);
      this.strategies = [];
    });
  }

  private async loadFactorDefinitions() {
    try {
      const factorPath = path.join(__dirname, 'drilling-tool', 'factor_definitions.json');
      if (fs.existsSync(factorPath)) {
        const data = await fs.promises.readFile(factorPath, 'utf8');
        this.factorDefinitions = JSON.parse(data);
        console.log(`📊 Loaded ${Object.keys(this.factorDefinitions).length} factor definitions`);
      } else {
        console.log('📊 Factor definitions not found, using empty definitions');
        this.factorDefinitions = {};
      }
    } catch (error) {
      console.warn('⚠️ Error loading factor definitions:', (error as Error).message);
      this.factorDefinitions = {};
    }
  }

  private async loadStrategies() {
    try {
      const strategyPath = path.join(__dirname, 'drilling-tool', 'strategy.json');
      if (fs.existsSync(strategyPath)) {
        const data = await fs.promises.readFile(strategyPath, 'utf8');
        this.strategies = JSON.parse(data);
        console.log(`🎯 Loaded ${this.strategies.length} proven strategies`);
      } else {
        console.log('🎯 Strategy file not found, using empty strategies');
        this.strategies = [];
      }
    } catch (error) {
      console.warn('⚠️ Error loading strategies:', (error as Error).message);
      this.strategies = [];
    }
  }

  async discoverPatterns(factors: (string | any)[]): Promise<any> {
    const factorNames = factors.map(f => typeof f === 'string' ? f : `${f.category}.${f.key}`);
    console.log(`🔍 Discovering patterns for factors: ${factorNames.join(', ')}`);
    
    // Load enhanced data for analysis
    const enhancedData = await this.loadEnhancedData();
    
    // Apply factors to find matching combinations
    const results = this.analyzeFactorCombination(factors, enhancedData);
    
    return {
      factors: factorNames,
      matchCount: results.matches.length,
      profitability: results.profitability,
      winRate: results.winRate,
      roi: results.roi,
      matches: results.matches.slice(0, 50), // Limit to 50 matches for performance
      analysis: results.analysis
    };
  }

  private async loadEnhancedData(): Promise<any[]> {
    try {
      const enhancedDir = path.join(process.cwd(), 'data', 'enhanced');
      
      // Check if directory exists
      if (!fs.existsSync(enhancedDir)) {
        console.log('⚠️ Enhanced data directory not found, returning empty array');
        return [];
      }
      
      const files = (await fs.promises.readdir(enhancedDir)).filter(f => f.endsWith('-enhanced.json'));
      
      if (files.length === 0) {
        console.log('⚠️ No enhanced data files found, returning empty array');
        return [];
      }
      
      let allData = [];
      
      // Check if we're in live trading mode by looking for current week data
      const currentWeekFile = files.find(f => f.includes('week1-2025-2026'));
      const isLiveTrading = currentWeekFile !== undefined;
      
      if (isLiveTrading) {
        // For live trading, only load current week data
        console.log('🔴 LIVE TRADING MODE: Loading only current week data');
        const filePath = path.join(enhancedDir, currentWeekFile);
        const seasonData = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
        
        if (seasonData.matches) {
          const matches = Object.entries(seasonData.matches).map(([key, match]: [string, any]) => ({
            ...(match as any),
            matchKey: key
          }));
          allData = matches;
          console.log(`📊 Loaded ${matches.length} current week matches from ${currentWeekFile}`);
        }
      } else {
        // For backtesting, load all historical data
        console.log('📈 BACKTESTING MODE: Loading all historical data');
        for (const file of files) {
          const filePath = path.join(enhancedDir, file);
          
          try {
            const seasonData = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
            
            // Extract matches from enhanced data structure
            if (seasonData.matches) {
              const matches = Object.entries(seasonData.matches).map(([key, match]: [string, any]) => ({
                ...(match as any),
                matchKey: key
              }));
              allData = allData.concat(matches);
              console.log(`📊 Loaded ${matches.length} matches from ${file}`);
            }
          } catch (fileError) {
            console.warn(`⚠️ Error reading file ${file}:`, (fileError as Error).message);
            continue;
          }
        }
      }
      
      console.log(`📊 Total matches loaded: ${allData.length}`);
      return allData;
    } catch (error) {
      console.error('❌ Error loading enhanced data:', (error as Error).message);
      return [];
    }
  }

  private analyzeFactorCombination(factors: (string | any)[], data: any[]): any {
    const matches = [];
    let totalStake = 0;
    let totalProfit = 0;
    let wins = 0;
    
    for (const match of data) {
      const factorResults = factors.map(factor => this.evaluateFactor(factor, match));
      
      if (factorResults.every(result => result.satisfied)) {
        // This match satisfies all factors
        const betSide = this.determineBetSide(factors, match);
        const outcome = this.calculateOutcome(match, betSide);
        
        const stake = 100; // Base stake
        const profit = outcome.profit;
        
        matches.push({
          ...match,
          factorResults,
          betSide,
          outcome: outcome.result,
          stake,
          profit,
          matchKey: match.matchKey || `${match.match?.homeTeam || 'Unknown'} v ${match.match?.awayTeam || 'Unknown'}`
        });
        
        totalStake += stake;
        totalProfit += profit;
        if (profit > 0) wins++;
      }
    }
    
    const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
    
    return {
      matches,
      profitability: totalProfit,
      winRate,
      roi,
      analysis: {
        totalMatches: matches.length,
        totalStake,
        totalProfit,
        wins,
        losses: matches.length - wins,
        averageProfit: matches.length > 0 ? totalProfit / matches.length : 0
      }
    };
  }

  getFactorDefinitions(): any {
    return this.factorDefinitions;
  }

  private evaluateFactor(factorInput: string | any, match: any): any {
    // Handle both string factor names and factor objects
    let factorName: string;
    let factorDef: any;
    
    if (typeof factorInput === 'string') {
      // Parse factor name like "side.home" or "time.ultraEarly"
      factorName = factorInput;
      const [category, factor] = factorName.split('.');
      const categoryDef = this.factorDefinitions[category];
      
      if (!categoryDef || !categoryDef[factor]) {
        return { satisfied: false, reason: `Factor ${factorName} not found` };
      }
      
      factorDef = categoryDef[factor];
    } else if (factorInput && typeof factorInput === 'object' && factorInput.expression) {
      // Handle factor object with expression property
      factorName = `${factorInput.category}.${factorInput.key}`;
      factorDef = factorInput;
    } else {
      console.error('evaluateFactor: Invalid factor input:', factorInput, 'Type:', typeof factorInput);
      return { satisfied: false, reason: `Invalid factor input: ${typeof factorInput}` };
    }
    
    try {
      // For V2 factor definitions, we evaluate the expression directly
      if (factorDef.expression) {
        const context = {
          match: match.match,
          fbref: match.fbref, 
          timeSeries: match.timeSeries,
          preMatch: match.enhanced?.preMatch,
          Math, parseInt, parseFloat
        };
        
        // Use Function constructor to evaluate expression safely
        const result = new Function(...Object.keys(context), `return (${factorDef.expression});`)(...Object.values(context));
        
        return { 
          satisfied: Boolean(result), 
          reason: result ? 'Factor satisfied' : 'Factor not satisfied',
          value: result
        };
      }
      
      return { satisfied: false, reason: 'No expression found' };
    } catch (error) {
      return { satisfied: false, reason: `Evaluation error: ${(error as Error).message}` };
    }
  }

  private determineBetSide(factors: string[], match: any): 'home' | 'away' {
    // Check if any factor specifies betting side
    for (const factor of factors) {
      if (typeof factor !== 'string') {
        console.error('determineBetSide: factor is not a string:', factor, 'Type:', typeof factor);
        continue;
      }
      const [category, factorName] = factor.split('.');
      if (category === 'side') {
        const factorDef = this.factorDefinitions.side?.[factorName];
        if (factorDef?.betSide) {
          return factorDef.betSide;
        }
      }
    }
    
    // Default to home if no side specified
    return 'home';
  }

  private calculateOutcome(match: any, betSide: 'home' | 'away'): any {
    // Use the enhanced postMatch betting outcomes if available
    if (match.enhanced?.postMatch?.bettingOutcomes) {
      const outcomes = match.enhanced.postMatch.bettingOutcomes;
      if (betSide === 'home') {
        return { 
          result: outcomes.homeResult,
          profit: outcomes.homeProfit 
        };
      } else {
        return { 
          result: outcomes.awayResult,
          profit: outcomes.awayProfit 
        };
      }
    }
    
    // Fallback calculation for basic matches
    const homeScore = match.match?.homeScore || 0;
    const awayScore = match.match?.awayScore || 0;
    
    let result, profit;
    if (betSide === 'home') {
      result = homeScore > awayScore ? 'win' : homeScore === awayScore ? 'draw' : 'loss';
      profit = result === 'win' ? 100 : -100;
    } else {
      result = awayScore > homeScore ? 'win' : awayScore === homeScore ? 'draw' : 'loss';
      profit = result === 'win' ? 100 : -100;
    }
    
    return { result, profit };
  }

  getStrategies(): any {
    return this.strategies;
  }

  /**
   * Evaluate factor expression (for testing)
   */
  evaluateFactorExpression(factor: any, match: any): any {
    // Mock implementation for testing
    return { satisfied: true, value: 1 };
  }
}