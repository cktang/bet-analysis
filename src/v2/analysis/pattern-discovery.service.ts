import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Import the working drilling app calculation engine
const CalculationEngine = require('../utils/drilling/CalculationEngine.js');

@Injectable()
export class PatternDiscoveryService {
  private factorDefinitions: any;
  private strategies: any;
  private calculationEngine: any;
  private enhancedDataCache: any[] | null = null; // Cache for enhanced data

  async onModuleInit() {
    console.log('🔍 Pattern Discovery Service initialized');
    
    // Initialize the working calculation engine from drilling app
    this.calculationEngine = new CalculationEngine();
    
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
      const factorPath = path.join(__dirname, '..', 'utils', 'drilling', 'factor_definitions.json');
      if (fs.existsSync(factorPath)) {
        const data = await fs.promises.readFile(factorPath, 'utf8');
        this.factorDefinitions = JSON.parse(data);
        const totalFactors = Object.values(this.factorDefinitions).reduce((sum: number, category: any) => sum + Object.keys(category).length, 0);
        console.log(`📊 Loaded ${totalFactors} factors across ${Object.keys(this.factorDefinitions).length} categories`);
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
    
    // Load enhanced data for analysis (use cache if available)
    const enhancedData = await this.loadEnhancedData();
    
    // Convert string factors to factor objects that CalculationEngine expects
    const factorObjects = factors.map(factor => {
      if (typeof factor === 'string') {
        const [category, key] = factor.split('.');
        const categoryDef = this.factorDefinitions[category];
        if (categoryDef && categoryDef[key]) {
          return {
            category,
            key,
            ...categoryDef[key]
          };
        }
        console.warn(`Factor ${factor} not found in definitions`);
        return null;
      }
      return factor;
    }).filter(f => f !== null);
    
    // Split factors into side, size, and others
    const sideFactors = factorObjects.filter(f => f.category === 'side');
    const sizeFactors = factorObjects.filter(f => f.category === 'size');
    const otherFactors = factorObjects.filter(f => f.category !== 'side' && f.category !== 'size');
    
    // We need exactly one side and one size factor
    if (sideFactors.length !== 1 || sizeFactors.length !== 1) {
      return {
        factors: factorNames,
        matchCount: 0,
        profitability: 0,
        winRate: 0,
        roi: 0,
        matches: [],
        analysis: {
          error: `Strategy must have exactly 1 side and 1 size factor. Found ${sideFactors.length} side, ${sizeFactors.length} size factors.`
        }
      };
    }
    
    // Use the working drilling app calculation engine
    const filteredMatches = this.calculationEngine.getFilteredMatches(enhancedData, otherFactors);
    const results = this.calculationEngine.calculateBettingResults(filteredMatches, sideFactors[0], sizeFactors[0]);
    
    return {
      factors: factorNames,
      matchCount: results.summary.totalBets,
      profitability: results.summary.totalProfit,
      winRate: results.summary.winRate,
      roi: results.summary.roi,
      matches: (results.bettingRecords || []).slice(0, 50), // Limit to 50 matches for performance
      analysis: {
        totalMatches: results.summary.totalBets,
        totalStake: results.summary.totalStake,
        totalProfit: results.summary.totalProfit,
        wins: results.summary.wins,
        losses: results.summary.losses,
        averageProfit: results.summary.totalBets > 0 ? results.summary.totalProfit / results.summary.totalBets : 0
      }
    };
  }

  async loadEnhancedData(): Promise<any[]> {
    // Return cached data if available
    if (this.enhancedDataCache !== null) {
      return this.enhancedDataCache;
    }

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
      
      // Load all historical data (cached after first load)
      console.log('📈 LOADING ALL HISTORICAL DATA');
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
      
      console.log(`📊 Total matches loaded: ${allData.length}`);
      
      // Cache the data for future requests
      this.enhancedDataCache = allData;
      console.log('💾 Enhanced data cached for future requests');
      
      return allData;
    } catch (error) {
      console.error('❌ Error loading enhanced data:', (error as Error).message);
      return [];
    }
  }

  getFactorDefinitions(): any {
    return this.factorDefinitions;
  }

  getStrategies(): any {
    return this.strategies;
  }

  // Method to clear the enhanced data cache (useful for testing or when data changes)
  clearEnhancedDataCache(): void {
    this.enhancedDataCache = null;
    console.log('🧹 Enhanced data cache cleared');
  }
}