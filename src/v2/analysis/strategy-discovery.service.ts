import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PatternDiscoveryService } from './pattern-discovery.service';

type DiscoveryOptions = {
  maxFactors?: number;
  minROI?: number;
  minSampleSize?: number;
  maxCombinations?: number;
  timeoutMs?: number;
  batchSize?: number;
  onProgress?: (progress: any) => void;
  onStrategyFound?: (strategy: DiscoveredStrategy) => void;
};

type DiscoveryResult = {
  strategies: DiscoveredStrategy[];
  totalCombinationsTested: number;
  executionTimeMs: number;
  cacheStats: {
    hitRate: number;
    totalEvaluations: number;
    cacheHits: number;
  };
  topPerformers: DiscoveredStrategy[];
};

type DiscoveredStrategy = {
  name: string;
  side: any;
  size: any;
  factors: any[];
  performance: {
    roi: number;
    totalBets: number;
    winRate: number;
    totalProfit: number;
    // Consistency metrics
    volatility: number;
    maxDrawdown: number;
    sharpeRatio: number;
    consistencyScore: number;
    smoothnessScore: number;
  };
  combinationKey: string;
};

@Injectable()
export class StrategyDiscoveryService implements OnModuleInit {
  private factorDefinitions: any = {};
  
  // Performance cache system (similar to drill app)
  private performanceCache = {
    // Cache for factor expression evaluations: "matchKey|expression" -> boolean
    factorEvaluations: new Map<string, boolean>(),
    
    // Cache for strategy evaluations: "combinationKey" -> strategy
    strategyEvaluations: new Map<string, DiscoveredStrategy>(),
    
    // Cache for filtered match lists: "factorCombinationHash" -> matchArray
    filteredMatches: new Map<string, any[]>(),
    
    // Cache statistics
    stats: {
      factorEvalHits: 0,
      factorEvalMisses: 0,
      strategyEvalHits: 0,
      strategyEvalMisses: 0,
      matchFilterHits: 0,
      matchFilterMisses: 0
    },
    
    // Clear all caches
    clearAll() {
      this.factorEvaluations.clear();
      this.filteredMatches.clear();
      this.strategyEvaluations.clear();
      this.stats = {
        factorEvalHits: 0,
        factorEvalMisses: 0,
        strategyEvalHits: 0,
        strategyEvalMisses: 0,
        matchFilterHits: 0,
        matchFilterMisses: 0
      };
      console.log('🧹 Performance cache cleared');
    },
    
    // Get cache hit rates
    getHitRates() {
      const factorEvalTotal = this.stats.factorEvalHits + this.stats.factorEvalMisses;
      const strategyEvalTotal = this.stats.strategyEvalHits + this.stats.strategyEvalMisses;
      const matchFilterTotal = this.stats.matchFilterHits + this.stats.matchFilterMisses;
      
      return {
        factorEval: factorEvalTotal > 0 ? this.stats.factorEvalHits / factorEvalTotal : 0,
        strategyEval: strategyEvalTotal > 0 ? this.stats.strategyEvalHits / strategyEvalTotal : 0,
        matchFilter: matchFilterTotal > 0 ? this.stats.matchFilterHits / matchFilterTotal : 0
      };
    }
  };

  constructor(private patternDiscoveryService: PatternDiscoveryService) {}

  async onModuleInit() {
    console.log('🚀 Strategy Discovery Service initialized');
    await this.loadFactorDefinitions();
  }

  private async loadFactorDefinitions() {
    try {
      const factorPath = path.join(__dirname, '..', 'utils', 'drilling', 'factor_definitions.json');
      if (fs.existsSync(factorPath)) {
        const data = await fs.promises.readFile(factorPath, 'utf8');
        this.factorDefinitions = JSON.parse(data);
        console.log(`📊 Loaded ${Object.keys(this.factorDefinitions).length} factor categories for discovery`);
      } else {
        console.warn('⚠️ Factor definitions not found, using PatternDiscoveryService fallback');
        this.factorDefinitions = this.patternDiscoveryService.getFactorDefinitions() || {};
      }
    } catch (error) {
      console.warn('⚠️ Error loading factor definitions:', (error as Error).message);
      this.factorDefinitions = this.patternDiscoveryService.getFactorDefinitions() || {};
    }
  }

  async discoverOptimalStrategies(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const {
      maxFactors = 3,
      minROI = 10,
      minSampleSize = 20,
      maxCombinations = 1000,
      timeoutMs = 300000, // 5 minutes
      batchSize = 50
    } = options;

    console.log(`🔍 Starting strategy discovery: maxFactors=${maxFactors}, minROI=${minROI}%, minSample=${minSampleSize}, batchSize=${batchSize}`);

    const discoveredStrategies: DiscoveredStrategy[] = [];
    let combinationsTested = 0;

    try {
      // Generate factor combinations in batches to prevent memory issues
      const combinationGenerator = this.generateFactorCombinationsBatched(maxFactors, batchSize);
      console.log(`📊 Generated factor combination generator for batched processing`);

      // Process combinations in batches
      for (const batch of combinationGenerator) {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          console.log(`⏰ Discovery timeout reached after ${combinationsTested} combinations`);
          break;
        }

        // Check combination limit
        if (combinationsTested >= maxCombinations) {
          console.log(`📊 Reached max combinations limit: ${maxCombinations}`);
          break;
        }

        // Process batch
        for (const combination of batch) {
          const strategy = await this.evaluateStrategy(combination);
          combinationsTested++;

          // Log progress every 100 combinations
          if (combinationsTested % 100 === 0) {
            console.log(`📈 Progress: ${combinationsTested} combinations tested, ${discoveredStrategies.length} strategies found`);
          }

          // Filter strategies that meet criteria
          if (strategy && 
              strategy.performance.roi >= minROI && 
              strategy.performance.totalBets >= minSampleSize) {
            discoveredStrategies.push(strategy);
            console.log(`✅ Found strategy: ${strategy.name} (ROI: ${strategy.performance.roi.toFixed(2)}%, Bets: ${strategy.performance.totalBets})`);
          }
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Sort by ROI descending
      discoveredStrategies.sort((a, b) => b.performance.roi - a.performance.roi);
      
      const topPerformers = discoveredStrategies.slice(0, 10);
      const executionTime = Date.now() - startTime;
      const hitRates = this.performanceCache.getHitRates();

      console.log(`🎯 Discovery complete: Found ${discoveredStrategies.length} qualifying strategies in ${executionTime}ms`);
      console.log(`💨 Cache performance: Strategy eval ${(hitRates.strategyEval * 100).toFixed(1)}% hit rate`);
      
      return {
        strategies: discoveredStrategies,
        totalCombinationsTested: combinationsTested,
        executionTimeMs: executionTime,
        cacheStats: {
          hitRate: hitRates.strategyEval,
          totalEvaluations: this.performanceCache.stats.strategyEvalHits + this.performanceCache.stats.strategyEvalMisses,
          cacheHits: this.performanceCache.stats.strategyEvalHits
        },
        topPerformers
      };

    } catch (error) {
      console.error('❌ Error in strategy discovery:', (error as Error).message);
      throw error;
    }
  }

  async discoverOptimalStrategiesWithProgress(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    const startTime = Date.now();
    const {
      maxFactors = 3,
      minROI = 5,  // Lower default from 10 to 5
      minSampleSize = 5,  // Lower default from 20 to 5
      maxCombinations = 1000,
      timeoutMs = 300000, // 5 minutes
      batchSize = 50,
      onProgress,
      onStrategyFound
    } = options;

    console.log(`🔍 Starting strategy discovery with progress: maxFactors=${maxFactors}, minROI=${minROI}%, minSample=${minSampleSize}, batchSize=${batchSize}`);

    const discoveredStrategies: DiscoveredStrategy[] = [];
    let combinationsTested = 0;
    let totalEvaluated = 0;

    try {
      // Generate factor combinations in batches to prevent memory issues
      const combinationGenerator = this.generateFactorCombinationsBatched(maxFactors, batchSize);
      console.log(`📊 Generated factor combination generator for batched processing`);

      // Process combinations in batches
      for (const batch of combinationGenerator) {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          console.log(`⏰ Discovery timeout reached after ${combinationsTested} combinations`);
          break;
        }

        // Check combination limit
        if (combinationsTested >= maxCombinations) {
          console.log(`📊 Reached max combinations limit: ${maxCombinations}`);
          break;
        }

        // Process batch
        for (const combination of batch) {
          const strategy = await this.evaluateStrategy(combination);
          combinationsTested++;
          totalEvaluated++;

          // Debug: Log some strategies to see what's happening
          if (strategy && totalEvaluated % 100 === 0) {
            console.log(`🔍 Sample strategy: ${strategy.name} - ROI: ${strategy.performance.roi.toFixed(2)}%, Bets: ${strategy.performance.totalBets}`);
          }

          // Send progress update
          if (onProgress && combinationsTested % 10 === 0) {
            const hitRates = this.performanceCache.getHitRates();
            onProgress({
              combinationsTested,
              strategiesFound: discoveredStrategies.length,
              maxCombinations,
              cacheHitRate: hitRates.strategyEval
            });
          }

          // Filter strategies that meet criteria
          if (strategy && 
              strategy.performance.roi >= minROI && 
              strategy.performance.totalBets >= minSampleSize) {
            discoveredStrategies.push(strategy);
            
            // Send strategy found callback
            if (onStrategyFound) {
              onStrategyFound(strategy);
            }
            
            console.log(`✅ Found strategy: ${strategy.name} (ROI: ${strategy.performance.roi.toFixed(2)}%, Bets: ${strategy.performance.totalBets})`);
          }
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Sort by ROI descending
      discoveredStrategies.sort((a, b) => b.performance.roi - a.performance.roi);
      
      const topPerformers = discoveredStrategies.slice(0, 10);
      const executionTime = Date.now() - startTime;
      const hitRates = this.performanceCache.getHitRates();

      console.log(`🎯 Discovery complete: Found ${discoveredStrategies.length} qualifying strategies in ${executionTime}ms`);
      console.log(`💨 Cache performance: Strategy eval ${(hitRates.strategyEval * 100).toFixed(1)}% hit rate`);
      
      return {
        strategies: discoveredStrategies,
        totalCombinationsTested: combinationsTested,
        executionTimeMs: executionTime,
        cacheStats: {
          hitRate: hitRates.strategyEval,
          totalEvaluations: this.performanceCache.stats.strategyEvalHits + this.performanceCache.stats.strategyEvalMisses,
          cacheHits: this.performanceCache.stats.strategyEvalHits
        },
        topPerformers
      };

    } catch (error) {
      console.error('❌ Error in strategy discovery:', (error as Error).message);
      throw error;
    }
  }

  // Memory-efficient generator for factor combinations
  private *generateFactorCombinationsBatched(maxFactors: number, batchSize: number): Generator<any[], void, unknown> {
    const sides = Object.keys(this.factorDefinitions.side || {});
    const sizes = Object.keys(this.factorDefinitions.size || {});
    const optionalFactors = this.getOptionalFactors();

    console.log(`🔧 Factor pool: ${sides.length} sides, ${sizes.length} sizes, ${optionalFactors.length} optional factors`);

    let batch: any[] = [];
    let totalCombinations = 0;

    // Generate combinations for each side and size
    for (const sideKey of sides) {
      for (const sizeKey of sizes) {
        const sideDefinition = this.factorDefinitions.side[sideKey];
        const sizeDefinition = this.factorDefinitions.size[sizeKey];

        // Base combination (no optional factors)
        batch.push({
          side: { key: sideKey, ...sideDefinition },
          size: { key: sizeKey, ...sizeDefinition },
          factors: []
        });
        totalCombinations++;

        // Add combinations with 1 to maxFactors optional factors
        for (let factorCount = 1; factorCount <= maxFactors; factorCount++) {
          const factorCombinations = this.getCombinations(optionalFactors, factorCount);
          
          for (const factorCombo of factorCombinations) {
            batch.push({
              side: { key: sideKey, ...sideDefinition },
              size: { key: sizeKey, ...sizeDefinition },
              factors: factorCombo
            });
            totalCombinations++;

            // Yield batch when it reaches the batch size
            if (batch.length >= batchSize) {
              yield batch;
              batch = [];
            }
          }
        }
      }
    }

    // Yield remaining combinations
    if (batch.length > 0) {
      yield batch;
    }

    console.log(`📊 Total combinations generated: ${totalCombinations}`);
  }

  private getOptionalFactors(): any[] {
    const optional = [];
    for (const [category, factors] of Object.entries(this.factorDefinitions)) {
      if (category !== 'side' && category !== 'size') {
        for (const [key, definition] of Object.entries(factors as any)) {
          optional.push({ 
            category, 
            key, 
            ...(definition as any)
          });
        }
      }
    }
    return optional;
  }

  private getCombinations<T>(array: T[], size: number): T[][] {
    if (size === 0) return [[]];
    if (size > array.length) return [];
    
    const result: T[][] = [];
    
    for (let i = 0; i <= array.length - size; i++) {
      const head = array[i];
      const tailCombos = this.getCombinations(array.slice(i + 1), size - 1);
      
      for (const combo of tailCombos) {
        result.push([head, ...combo]);
      }
    }
    
    return result;
  }

  async evaluateStrategy(combination: any): Promise<DiscoveredStrategy | null> {
    const combinationKey = this.getCombinationKey(combination);
    
    // TEMPORARILY DISABLE CACHE TO DEBUG
    // this.performanceCache.stats.strategyEvalMisses++;
    // if (this.performanceCache.strategyEvaluations.has(combinationKey)) {
    //   this.performanceCache.stats.strategyEvalHits++;
    //   this.performanceCache.stats.strategyEvalMisses--;
    //   return this.performanceCache.strategyEvaluations.get(combinationKey);
    // }

    try {
      // Build factor array for PatternDiscoveryService (convert objects to strings with category prefix)
      const factors = [
        `side.${combination.side.key}`, // Convert side object to "side.away" format
        `size.${combination.size.key}`, // Convert size object to "size.dynamic" format
        ...combination.factors.map((f: any) => `${f.category}.${f.key}`) // Convert factor objects to category.key format
      ];

      // Use existing PatternDiscoveryService to evaluate
      const result = await this.patternDiscoveryService.discoverPatterns(factors);
      
      if (result && result.matchCount && result.matchCount > 0) {
        const strategy: DiscoveredStrategy = {
          name: this.generateStrategyName(combination),
          side: combination.side,
          size: combination.size,
          factors: combination.factors,
          performance: {
            roi: result.roi || 0,
            totalBets: result.matchCount || 0,
            winRate: result.winRate || 0,
            totalProfit: result.profitability || 0,
            // Add consistency metrics
            volatility: result.consistency?.volatility || 0,
            maxDrawdown: result.consistency?.maxDrawdown || 0,
            sharpeRatio: result.consistency?.sharpeRatio || 0,
            consistencyScore: result.consistency?.consistencyScore || 0,
            smoothnessScore: result.consistency?.smoothnessScore || 0
          },
          combinationKey
        };

        // TEMPORARILY DISABLE CACHE TO DEBUG
        // this.performanceCache.strategyEvaluations.set(combinationKey, strategy);
        return strategy;
      }

      return null;
    } catch (error) {
      console.warn('Strategy evaluation failed:', error);
      return null;
    }
  }

  getCombinationKey(combination: any): string {
    const sideKey = combination.side.key;
    const sizeKey = combination.size.key;
    const factorKeys = combination.factors.map((f: any) => `${f.category}.${f.key}`).sort();
    return `${sideKey}|${sizeKey}|${factorKeys.join(',')}`;
  }

  generateStrategyName(combination: any): string {
    const sideName = combination.side.key;
    const sizeName = combination.size.key;
    const factorNames = combination.factors.map((f: any) => f.key).join('+');
    return `${sideName}-${sizeName}-${factorNames || 'base'}`;
  }

  async quickDiscovery(): Promise<DiscoveryResult> {
    return this.discoverOptimalStrategies({
      maxFactors: 2,
      minROI: 15,
      minSampleSize: 20,
      maxCombinations: 500,
      batchSize: 25
    });
  }

  async deepDiscovery(): Promise<DiscoveryResult> {
    return this.discoverOptimalStrategies({
      maxFactors: 3,
      minROI: 10,
      minSampleSize: 15,
      maxCombinations: 2000,
      batchSize: 50
    });
  }

  getCacheStats() {
    const hitRates = this.performanceCache.getHitRates();
    return {
      hitRate: hitRates.strategyEval,
      totalEvaluations: this.performanceCache.stats.strategyEvalHits + this.performanceCache.stats.strategyEvalMisses,
      cacheHits: this.performanceCache.stats.strategyEvalHits,
      cacheSize: this.performanceCache.strategyEvaluations.size
    };
  }

  clearCache() {
    this.performanceCache.clearAll();
  }

  getFactorDefinitions() {
    return this.factorDefinitions;
  }
}