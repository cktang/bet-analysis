/**
 * StrategyGeneratorService - Generates random factor combinations and evaluates them
 * 
 * Uses DrillAnalysisService to test different factor combinations and find profitable strategies
 */
import { Injectable } from '@nestjs/common';
import { DrillAnalysisService } from './drill-analysis.service';

type SelectedFactor = {
  category: string;
  key: string;
  expression: string;
  description: string;
  betSide?: string;
  mandatory?: boolean;
};

type GeneratedStrategy = {
  factors: SelectedFactor[];
  betSide: any;
  size: any;
  performance: {
    roi: number;
    totalBets: number;
    winRate: number;
    totalProfit: number;
    totalStake: number;
    wins: number;
    losses: number;
    pushes: number;
  };
  matchCount: number;
};

@Injectable()
export class StrategyGeneratorService {
  private factorDefinitions: any = {};
  private allFactors: SelectedFactor[] = [];

  constructor(
    private drillAnalysisService: DrillAnalysisService,
  ) {}

  async onModuleInit() {
    console.log('🎲 Strategy Generator Service initialized');
    await this.loadFactors();
  }

  private async loadFactors() {
    try {
      this.factorDefinitions = await this.drillAnalysisService.loadFactorDefinitions();
      
      // Convert factor definitions to flat array for easier random selection
      this.allFactors = [];
      for (const [categoryName, category] of Object.entries(this.factorDefinitions)) {
        for (const [factorKey, factorDef] of Object.entries(category as any)) {
          this.allFactors.push({
            category: categoryName,
            key: factorKey,
            expression: (factorDef as any).expression,
            description: (factorDef as any).description,
            betSide: (factorDef as any).betSide
          });
        }
      }
      
      console.log(`🎲 Loaded ${this.allFactors.length} factors across ${Object.keys(this.factorDefinitions).length} categories`);
    } catch (error) {
      console.error('Error loading factors:', error);
    }
  }

  /**
   * Create a specific strategy with provided factors
   * @param factorKeys - Array of factor keys in format ['category.key', 'side.home', 'time.midSeason']
   * @param betSide - Betting side configuration (e.g., {betSide: 'home', description: 'Bet on home team'})
   * @param size - Stake size configuration (e.g., {expression: '1500', description: '$1500', stakingMethod: 'fixed'})
   * @returns Generated strategy with performance metrics
   */
  async createSpecificStrategy(factorKeys: string[], betSide: any, size: any): Promise<GeneratedStrategy | null> {
    const startTime = Date.now();
    
    // Ensure factors are loaded
    if (this.allFactors.length === 0) {
      await this.loadFactors();
    }

    if (this.allFactors.length === 0) {
      console.error('No factors available for strategy generation');
      return null;
    }

    // Convert factor keys to factor objects
    const selectedFactors = this.getFactorsByKeys(factorKeys);
    
    if (selectedFactors.length === 0) {
      console.error('No valid factors found for keys:', factorKeys);
      return null;
    }

    try {
      // Analyze the strategy using DrillAnalysisService
      const results = await this.drillAnalysisService.analyzeStrategy(selectedFactors, betSide, size);
      
      const strategy: GeneratedStrategy = {
        factors: selectedFactors,
        betSide: betSide,
        size: size,
        performance: results.summary,
        matchCount: results.summary.totalBets
      };

      // Reduced logging to avoid console bottleneck  
      // const serverTime = Date.now() - startTime;
      // console.log(`🖥️  Server: ${serverTime}ms for [${factorKeys.join(', ')}] -> ${results.summary.totalBets} matches`);
      
      return strategy;
    } catch (error) {
      const serverTime = Date.now() - startTime;
      console.error(`Error analyzing specific strategy after ${serverTime}ms:`, error);
      return null;
    }
  }

  /**
   * Create a random strategy by selecting random factors
   * @param betSide - Betting side configuration (e.g., {betSide: 'home', description: 'Bet on home team'})
   * @param size - Stake size configuration (e.g., {expression: '1500', description: '$1500', stakingMethod: 'fixed'})
   * @param noOfFactors - Number of factors to randomly select
   * @returns Generated strategy with performance metrics
   */
  async createRandomStrategy(betSide: any, size: any, noOfFactors: number): Promise<GeneratedStrategy | null> {
    // Ensure factors are loaded
    if (this.allFactors.length === 0) {
      await this.loadFactors();
    }

    if (this.allFactors.length === 0) {
      console.error('No factors available for strategy generation');
      return null;
    }

    if (noOfFactors > this.allFactors.length) {
      console.warn(`Requested ${noOfFactors} factors but only ${this.allFactors.length} available. Using all available factors.`);
      noOfFactors = this.allFactors.length;
    }

    // Randomly select factors without replacement
    const selectedFactors = this.selectRandomFactors(noOfFactors);
    
    try {
      // Analyze the strategy using DrillAnalysisService
      const results = await this.drillAnalysisService.analyzeStrategy(selectedFactors, betSide, size);
      
      const strategy: GeneratedStrategy = {
        factors: selectedFactors,
        betSide: betSide,
        size: size,
        performance: results.summary,
        matchCount: results.summary.totalBets
      };

      // Print results
      this.printStrategy(strategy);
      
      return strategy;
    } catch (error) {
      console.error('Error analyzing random strategy:', error);
      return null;
    }
  }

  /**
   * Generate multiple random strategies and find the best ones
   * @param betSide - Betting side configuration
   * @param size - Stake size configuration
   * @param noOfFactors - Number of factors per strategy
   * @param numberOfStrategies - How many random strategies to generate
   * @param minMatches - Minimum number of matches required
   * @returns Array of strategies sorted by ROI descending
   */
  async generateRandomStrategies(
    betSide: any, 
    size: any, 
    noOfFactors: number, 
    numberOfStrategies: number = 10,
    minMatches: number = 15
  ): Promise<GeneratedStrategy[]> {
    console.log(`\n🎲 Generating ${numberOfStrategies} random strategies with ${noOfFactors} factors each...`);
    
    const strategies: GeneratedStrategy[] = [];
    
    for (let i = 0; i < numberOfStrategies; i++) {
      console.log(`\n--- Strategy ${i + 1}/${numberOfStrategies} ---`);
      
      const strategy = await this.createRandomStrategy(betSide, size, noOfFactors);
      
      if (strategy && strategy.matchCount >= minMatches) {
        strategies.push(strategy);
      } else if (strategy) {
        console.log(`❌ Strategy rejected: Only ${strategy.matchCount} matches (minimum: ${minMatches})`);
      }
    }

    // Sort by ROI descending
    strategies.sort((a, b) => b.performance.roi - a.performance.roi);
    
    console.log(`\n🏆 Generated ${strategies.length} valid strategies (${strategies.length}/${numberOfStrategies} passed minimum match requirement)`);
    
    if (strategies.length > 0) {
      console.log('\n📊 TOP 3 STRATEGIES:');
      strategies.slice(0, 3).forEach((strategy, index) => {
        console.log(`\n${index + 1}. ROI: ${strategy.performance.roi.toFixed(2)}% | Matches: ${strategy.matchCount} | Win Rate: ${strategy.performance.winRate.toFixed(1)}%`);
        console.log(`   Factors: ${strategy.factors.map(f => `${f.category}.${f.key}`).join(' + ')}`);
      });
    }
    
    return strategies;
  }

  /**
   * Randomly select factors without replacement, ensuring no duplicate categories
   * @param count - Number of factors to select
   * @returns Array of selected factors
   */
  private selectRandomFactors(count: number): SelectedFactor[] {
    const selected: SelectedFactor[] = [];
    const usedCategories = new Set<string>();
    const availableFactors = [...this.allFactors];
    
    while (selected.length < count && availableFactors.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableFactors.length);
      const factor = availableFactors[randomIndex];
      
      // Remove from available factors
      availableFactors.splice(randomIndex, 1);
      
      // Skip if we already have a factor from this category (optional constraint)
      // Comment out the next 3 lines if you want to allow multiple factors from same category
      if (usedCategories.has(factor.category)) {
        continue;
      }
      
      selected.push(factor);
      usedCategories.add(factor.category);
    }
    
    return selected;
  }

  /**
   * Print strategy details to console
   * @param strategy - Strategy to print
   */
  private printStrategy(strategy: GeneratedStrategy) {
    console.log('\n🎯 GENERATED STRATEGY:');
    console.log('─'.repeat(50));
    
    console.log('📋 FACTORS:');
    strategy.factors.forEach((factor, index) => {
      console.log(`  ${index + 1}. [${factor.category}] ${factor.key}: ${factor.description}`);
    });
    
    console.log('\n💰 BET CONFIGURATION:');
    console.log(`  Side: ${strategy.betSide.description || strategy.betSide.betSide}`);
    console.log(`  Size: ${strategy.size.description || strategy.size.expression}`);
    
    console.log('\n📊 PERFORMANCE:');
    console.log(`  🎯 ROI: ${strategy.performance.roi.toFixed(2)}%`);
    console.log(`  📈 Total Bets: ${strategy.performance.totalBets}`);
    console.log(`  🏆 Win Rate: ${strategy.performance.winRate.toFixed(1)}%`);
    console.log(`  💵 Total Profit: $${strategy.performance.totalProfit.toFixed(2)}`);
    console.log(`  💰 Total Stake: $${strategy.performance.totalStake.toFixed(2)}`);
    console.log(`  ✅ Wins: ${strategy.performance.wins}`);
    console.log(`  ❌ Losses: ${strategy.performance.losses}`);
    console.log(`  ⚪ Pushes: ${strategy.performance.pushes}`);
    
    // Evaluate strategy quality
    const quality = this.evaluateStrategyQuality(strategy);
    console.log(`\n🏅 STRATEGY QUALITY: ${quality.rating} (${quality.description})`);
    
    console.log('─'.repeat(50));
  }

  /**
   * Evaluate the quality of a strategy based on multiple metrics
   * @param strategy - Strategy to evaluate
   * @returns Quality rating and description
   */
  private evaluateStrategyQuality(strategy: GeneratedStrategy): { rating: string; description: string } {
    const { roi, winRate, totalBets } = strategy.performance;
    
    // Quality scoring based on multiple factors
    let score = 0;
    
    // ROI scoring (0-40 points)
    if (roi >= 20) score += 40;
    else if (roi >= 15) score += 35;
    else if (roi >= 10) score += 30;
    else if (roi >= 5) score += 20;
    else if (roi >= 0) score += 10;
    
    // Win rate scoring (0-30 points)
    if (winRate >= 60) score += 30;
    else if (winRate >= 55) score += 25;
    else if (winRate >= 50) score += 20;
    else if (winRate >= 45) score += 15;
    else if (winRate >= 40) score += 10;
    
    // Sample size scoring (0-30 points)
    if (totalBets >= 100) score += 30;
    else if (totalBets >= 50) score += 25;
    else if (totalBets >= 30) score += 20;
    else if (totalBets >= 20) score += 15;
    else if (totalBets >= 15) score += 10;
    else if (totalBets >= 10) score += 5;
    
    // Determine rating
    if (score >= 90) return { rating: '🥇 EXCELLENT', description: 'Outstanding strategy with great potential' };
    if (score >= 75) return { rating: '🥈 VERY GOOD', description: 'Strong strategy worth considering' };
    if (score >= 60) return { rating: '🥉 GOOD', description: 'Solid strategy with decent performance' };
    if (score >= 45) return { rating: '👍 FAIR', description: 'Reasonable strategy but room for improvement' };
    if (score >= 30) return { rating: '⚠️ POOR', description: 'Below average performance' };
    return { rating: '❌ VERY POOR', description: 'Strategy needs significant improvement' };
  }

  /**
   * Convert factor keys to factor objects
   * @param factorKeys - Array of factor keys in format ['category.key', 'side.home', 'time.midSeason']
   * @returns Array of selected factors
   */
  private getFactorsByKeys(factorKeys: string[]): SelectedFactor[] {
    const selectedFactors: SelectedFactor[] = [];
    
    for (const factorKey of factorKeys) {
      const dotIndex = factorKey.indexOf('.');
      if (dotIndex === -1) {
        console.warn(`Invalid factor key format: ${factorKey}. Expected format: 'category.key'`);
        continue;
      }
      
      const category = factorKey.substring(0, dotIndex);
      const key = factorKey.substring(dotIndex + 1);
      
      if (!category || !key) {
        console.warn(`Invalid factor key format: ${factorKey}. Expected format: 'category.key'`);
        continue;
      }
      
      const factor = this.allFactors.find(f => f.category === category && f.key === key);
      
      if (factor) {
        selectedFactors.push(factor);
      } else {
        console.warn(`Factor not found: ${factorKey}`);
      }
    }
    
    return selectedFactors;
  }

  /**
   * Get available factor categories and counts
   * @returns Object with category names and factor counts
   */
  getFactorSummary(): { [category: string]: number } {
    const summary: { [category: string]: number } = {};
    
    for (const factor of this.allFactors) {
      summary[factor.category] = (summary[factor.category] || 0) + 1;
    }
    
    return summary;
  }

  /**
   * Get all available factors in a structured format
   * @returns Object with category names and their factors
   */
  getAllAvailableFactors(): { [category: string]: string[] } {
    const factorsByCategory: { [category: string]: string[] } = {};
    
    for (const factor of this.allFactors) {
      if (!factorsByCategory[factor.category]) {
        factorsByCategory[factor.category] = [];
      }
      factorsByCategory[factor.category].push(`${factor.category}.${factor.key} - ${factor.description}`);
    }
    
    return factorsByCategory;
  }

  /**
   * Evaluate multiple specific strategies in batch for better performance
   * @param strategiesConfig - Array of strategy configurations to evaluate
   * @returns Array of generated strategies with performance metrics
   */
  async evaluateMultipleStrategies(strategiesConfig: Array<{
    factorKeys: string[];
    betSide: any;
    size: any;
  }>): Promise<(GeneratedStrategy | null)[]> {
    const startTime = Date.now();
    
    // Ensure factors are loaded
    if (this.allFactors.length === 0) {
      await this.loadFactors();
    }

    if (this.allFactors.length === 0) {
      console.error('No factors available for batch strategy evaluation');
      return strategiesConfig.map(() => null);
    }

    console.log(`🔄 Evaluating ${strategiesConfig.length} strategies in batch...`);

    const results: (GeneratedStrategy | null)[] = [];
    
    // Process strategies with frequent yielding to prevent blocking
    for (let i = 0; i < strategiesConfig.length; i++) {
      const config = strategiesConfig[i];
      
      try {
        // Yield to event loop before each strategy to prevent blocking
        await new Promise(resolve => setImmediate(resolve));
        
        const selectedFactors = this.getFactorsByKeys(config.factorKeys);
        
        if (selectedFactors.length === 0) {
          results.push(null);
          continue;
        }

        console.log(`   Evaluating strategy ${i + 1}/${strategiesConfig.length}: [${config.factorKeys.join(', ')}]`);
        
        // Analyze the strategy using DrillAnalysisService with timeout
        const analysisResults = await Promise.race([
          this.drillAnalysisService.analyzeStrategy(selectedFactors, config.betSide, config.size),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Strategy evaluation timeout')), 30000))
        ]) as any;
        
        const strategy: GeneratedStrategy = {
          factors: selectedFactors,
          betSide: config.betSide,
          size: config.size,
          performance: analysisResults.summary,
          matchCount: analysisResults.summary.totalBets
        };

        results.push(strategy);
        console.log(`   ✅ Strategy ${i + 1}: ${analysisResults.summary.totalBets} matches, ${analysisResults.summary.roi.toFixed(2)}% ROI`);
        
      } catch (error) {
        console.error(`Error in batch evaluation for strategy ${i + 1}:`, error);
        results.push(null);
      }
    }

    const serverTime = Date.now() - startTime;
    console.log(`🖥️  Batch evaluation completed: ${serverTime}ms for ${strategiesConfig.length} strategies`);
    
    return results;
  }

  /**
   * Get the loaded factor definitions
   * @returns Factor definitions object
   */
  getFactorDefinitions(): any {
    return this.factorDefinitions;
  }
}