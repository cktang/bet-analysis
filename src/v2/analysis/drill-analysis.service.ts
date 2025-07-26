/**
 * DrillAnalysisService - Core drilling functionality for factor-based betting analysis
 * 
 * Core capabilities:
 * - Load and evaluate factor expressions against match data
 * - Filter matches by factor combinations with performance caching  
 * - Calculate betting results using Asian Handicap calculator
 * - Analyze complete strategies with ROI, win rate, and P&L metrics
 */
import { Injectable } from '@nestjs/common';
import { PatternDiscoveryService } from './pattern-discovery.service';

import * as AsianHandicapCalculator from '../utils/drilling/AsianHandicapCalculator.js';
import * as UtilityHelper from '../utils/drilling/UtilityHelper.js';
const CalculationEngine = require('../utils/drilling/CalculationEngine.js');
const DataLoader = require('../utils/drilling/DataLoader.js');

type FactorDefinition = {
  expression: string;
  description: string;
  betSide?: string;
  stakingMethod?: string;
  displayExpression?: string[];
};

type FactorCategory = {
  [key: string]: FactorDefinition;
};

type FactorDefinitions = {
  [category: string]: FactorCategory;
};

type SelectedFactor = {
  category: string;
  key: string;
  expression: string;
  description: string;
  betSide?: string;
  mandatory?: boolean;
};

type BettingResult = {
  summary: {
    roi: number;
    totalBets: number;
    winRate: number;
    totalProfit: number;
    totalStake: number;
    totalPayout: number;
    wins: number;
    losses: number;
    pushes: number;
  };
  records: any[];
};

@Injectable()
export class DrillAnalysisService {
  // Core drilling analysis service - evaluates factor expressions and calculates betting results
  // PERFORMANCE OPTIMIZATION: Caching system - direct copy from frontend
  private performanceCache = {
    // Cache for factor expression evaluations: "matchKey|expression" -> boolean
    factorEvaluations: new Map<string, boolean>(),
    
    // Cache for Asian Handicap calculations: "homeScore|awayScore|handicap|betSide|odds|stake" -> result
    asianHandicapResults: new Map<string, any>(),
    
    // Cache for filtered matches by factor combination
    filteredMatches: new Map<string, any[]>(),
    
    // Cache for complete betting results
    bettingResults: new Map<string, BettingResult>(),
    
    // Performance tracking
    stats: {
      factorEvalHits: 0,
      factorEvalMisses: 0,
      asianHandicapHits: 0,
      asianHandicapMisses: 0,
      matchFilterHits: 0,
      matchFilterMisses: 0,
      bettingResultHits: 0,
      bettingResultMisses: 0
    },
    
    getHitRates: function() {
      return {
        factorEval: this.stats.factorEvalHits + this.stats.factorEvalMisses > 0 ? 
          Math.round((this.stats.factorEvalHits / (this.stats.factorEvalHits + this.stats.factorEvalMisses)) * 100) : 0,
        asianHandicap: this.stats.asianHandicapHits + this.stats.asianHandicapMisses > 0 ? 
          Math.round((this.stats.asianHandicapHits / (this.stats.asianHandicapHits + this.stats.asianHandicapMisses)) * 100) : 0,
        matchFilter: this.stats.matchFilterHits + this.stats.matchFilterMisses > 0 ? 
          Math.round((this.stats.matchFilterHits / (this.stats.matchFilterHits + this.stats.matchFilterMisses)) * 100) : 0,
        bettingResult: this.stats.bettingResultHits + this.stats.bettingResultMisses > 0 ? 
          Math.round((this.stats.bettingResultHits / (this.stats.bettingResultHits + this.stats.bettingResultMisses)) * 100) : 0,
      };
    },
    
    clearAll: function() {
      this.factorEvaluations.clear();
      this.asianHandicapResults.clear();
      this.filteredMatches.clear();
      this.bettingResults.clear();
      this.stats = {
        factorEvalHits: 0,
        factorEvalMisses: 0,
        asianHandicapHits: 0,
        asianHandicapMisses: 0,
        matchFilterHits: 0,
        matchFilterMisses: 0,
        bettingResultHits: 0,
        bettingResultMisses: 0
      };
    }
  };

  private factorDefinitions: FactorDefinitions = {};
  private allMatches: any[] = [];

  constructor(
    private patternDiscoveryService: PatternDiscoveryService,
  ) {}

  // Load factor definitions - direct copy from frontend
  async loadFactorDefinitions(): Promise<FactorDefinitions> {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const factorPath = path.join(process.cwd(), 'src/v2/utils/drilling/factor_definitions.json');
      const factorData = fs.readFileSync(factorPath, 'utf8');
      this.factorDefinitions = JSON.parse(factorData);
      return this.factorDefinitions;
    } catch (error) {
      console.error('Error loading factor definitions:', error);
      return {};
    }
  }

  // Load match data - using the shared DataLoader utility (same as drilling app)
  async loadMatchData(): Promise<any[]> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const dataFiles = [
        'data/enhanced/year-2022-2023-enhanced.json',
        'data/enhanced/year-2023-2024-enhanced.json',
        'data/enhanced/year-2024-2025-enhanced.json'
      ];
      
      // Create file reader function for Node.js environment
      const fileReader = (filePath: string) => {
        const fullPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${fullPath}`);
        }
        return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      };
      
      this.allMatches = await DataLoader.loadEnhancedData(dataFiles, fileReader);
      return this.allMatches;
    } catch (error) {
      console.error('Error loading match data:', error);
      return [];
    }
  }

  // Factor expression evaluation - using refactored UtilityHelper
  evaluateFactorExpression(match: any, expression: string): boolean {
    return UtilityHelper.evaluateFactorExpression(match, expression, this.performanceCache.factorEvaluations);
  }

  // Evaluate betSide expression to get "home" or "away"
  evaluateBetSideExpression(match: any, betSideExpression: string): string {
    try {
      // Use the same simple context as factor evaluation
      const preMatch = match.preMatch || {};
      const timeSeries = match.timeSeries || {};
      const fbref = preMatch.fbref || {};
      const enhanced = preMatch.enhanced || {};
      
      // Safely evaluate the expression
      const func = new Function('preMatch', 'timeSeries', 'fbref', 'enhanced', 'Math', `return ${betSideExpression}`);
      const result = func(preMatch, timeSeries, fbref, enhanced, Math);
      
      if (result !== 'home' && result !== 'away') {
        throw new Error(`BetSide expression must evaluate to "home" or "away", got: ${result}`);
      }
      
      return result;
    } catch (error) {
      console.warn('Error evaluating betSide expression:', betSideExpression, error, match.matchKey);
      return 'home'; // Default fallback
    }
  }

  // PERFORMANCE: Cached match filtering - using refactored CalculationEngine
  async getFilteredMatches(factors: SelectedFactor[]): Promise<any[]> {
    const calculationEngine = new CalculationEngine();
    return calculationEngine.getFilteredMatches(this.allMatches, factors);
  }

  // PERFORMANCE: Generate hash for betting configuration - using refactored UtilityHelper
  private getBettingConfigHash(matches: any[], sideSelection: any, sizeSelection: any): string {
    return UtilityHelper.getBettingConfigHash(matches, sideSelection, sizeSelection);
  }

  // Calculate betting results - using refactored CalculationEngine
  async calculateBettingResults(matches: any[], sideSelection: any, sizeSelection: any): Promise<BettingResult> {
    // Check cache first
    const configHash = this.getBettingConfigHash(matches, sideSelection, sizeSelection);
    if (this.performanceCache.bettingResults.has(configHash)) {
      this.performanceCache.stats.bettingResultHits++;
      return this.performanceCache.bettingResults.get(configHash);
    }
    
    console.log(`   Processing ${matches.length} matches for betting calculation...`);
    
    // Use refactored CalculationEngine for core calculation
    const calculationEngine = new CalculationEngine();
    const result = calculationEngine.calculateBettingResults(matches, sideSelection, sizeSelection);
    
    // Cache the result
    this.performanceCache.bettingResults.set(configHash, result);
    this.performanceCache.stats.bettingResultMisses++;
    
    return result;
  }

  // Analyze strategy with given factors
  async analyzeStrategy(factors: SelectedFactor[], sideSelection: any, sizeSelection: any): Promise<BettingResult> {
    // Ensure data is loaded
    if (this.allMatches.length === 0) {
      await this.loadMatchData();
    }
    if (Object.keys(this.factorDefinitions).length === 0) {
      await this.loadFactorDefinitions();
    }

    // Get filtered matches
    const filteredMatches = await this.getFilteredMatches(factors);
    
    // Calculate betting results
    return await this.calculateBettingResults(filteredMatches, sideSelection, sizeSelection);
  }


  // Get performance cache stats
  getCacheStats() {
    return {
      hitRates: this.performanceCache.getHitRates(),
      cacheSize: {
        factorEvaluations: this.performanceCache.factorEvaluations.size,
        asianHandicapResults: this.performanceCache.asianHandicapResults.size,
        filteredMatches: this.performanceCache.filteredMatches.size,
        bettingResults: this.performanceCache.bettingResults.size
      },
      stats: this.performanceCache.stats
    };
  }

  // Clear all caches
  clearCache() {
    this.performanceCache.clearAll();
  }
}