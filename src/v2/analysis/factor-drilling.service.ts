import { Injectable } from '@nestjs/common';
import { PatternDiscoveryService } from './pattern-discovery.service';

@Injectable()
export class FactorDrillingService {
  constructor(private readonly patternDiscoveryService: PatternDiscoveryService) {}

  async onModuleInit() {
    console.log('🔧 Factor Drilling Service initialized');
  }

  async drillFactors(currentFactors: string[] = []): Promise<any> {
    console.log(`🔧 Drilling factors: ${currentFactors.join(', ')}`);
    
    const factorDefinitions = this.patternDiscoveryService.getFactorDefinitions();
    const availableFactors = Object.keys(factorDefinitions);
    
    // Get current results if factors are provided
    let currentResults = null;
    if (currentFactors.length > 0) {
      currentResults = await this.patternDiscoveryService.discoverPatterns(currentFactors);
    }
    
    // Get next level factors (factors not yet selected)
    const nextFactors = availableFactors.filter(factor => !currentFactors.includes(factor));
    
    // Analyze each next factor combination
    const drillResults = [];
    
    for (const nextFactor of nextFactors) {
      const combinedFactors = [...currentFactors, nextFactor];
      const results = await this.patternDiscoveryService.discoverPatterns(combinedFactors);
      
      drillResults.push({
        factor: nextFactor,
        factors: combinedFactors,
        matchCount: results.matchCount,
        roi: results.roi,
        winRate: results.winRate,
        profitability: results.profitability,
        description: factorDefinitions[nextFactor]?.description || 'No description',
        improvement: currentResults ? {
          roiChange: results.roi - currentResults.roi,
          matchCountChange: results.matchCount - currentResults.matchCount,
          winRateChange: results.winRate - currentResults.winRate
        } : null
      });
    }
    
    // Sort by ROI descending
    drillResults.sort((a, b) => b.roi - a.roi);
    
    return {
      currentFactors,
      currentResults,
      nextLevelOptions: drillResults,
      breadcrumb: this.generateBreadcrumb(currentFactors),
      factorDefinitions: factorDefinitions
    };
  }

  async getDrillHistory(factorPath: string[]): Promise<any> {
    console.log(`📈 Getting drill history for path: ${factorPath.join(' -> ')}`);
    
    const history = [];
    
    // Build history step by step
    for (let i = 0; i <= factorPath.length; i++) {
      const factors = factorPath.slice(0, i);
      
      if (factors.length === 0) {
        // Root level
        const drillResult = await this.drillFactors([]);
        history.push({
          step: 0,
          factors: [],
          results: null,
          nextOptions: drillResult.nextLevelOptions.slice(0, 10) // Top 10
        });
      } else {
        // Intermediate steps
        const results = await this.patternDiscoveryService.discoverPatterns(factors);
        const drillResult = await this.drillFactors(factors);
        
        history.push({
          step: i,
          factors,
          results,
          nextOptions: drillResult.nextLevelOptions.slice(0, 10) // Top 10
        });
      }
    }
    
    return {
      path: factorPath,
      history,
      totalSteps: factorPath.length
    };
  }

  async getTopStrategies(limit: number = 20): Promise<any> {
    console.log(`🏆 Getting top ${limit} strategies`);
    
    const strategies = this.patternDiscoveryService.getStrategies();
    if (!strategies || !Array.isArray(strategies)) {
      return { strategies: [], message: 'No strategies loaded' };
    }
    
    // Analyze each strategy
    const analyzedStrategies = [];
    
    for (const strategy of strategies.slice(0, limit)) {
      try {
        const factors = strategy.factors || [];
        const results = await this.patternDiscoveryService.discoverPatterns(factors);
        
        analyzedStrategies.push({
          name: strategy.name || 'Unknown Strategy',
          factors,
          results,
          originalROI: strategy.roi || 0,
          originalWinRate: strategy.winRate || 0,
          verified: Math.abs(results.roi - (strategy.roi || 0)) < 5 // Within 5% tolerance
        });
      } catch (error) {
        console.error(`Error analyzing strategy ${strategy.name}:`, error);
      }
    }
    
    // Sort by current ROI
    analyzedStrategies.sort((a, b) => b.results.roi - a.results.roi);
    
    return {
      strategies: analyzedStrategies,
      totalAnalyzed: analyzedStrategies.length,
      verified: analyzedStrategies.filter(s => s.verified).length
    };
  }

  async getFactorImpact(factor: string): Promise<any> {
    console.log(`📊 Analyzing impact of factor: ${factor}`);
    
    const factorDefinitions = this.patternDiscoveryService.getFactorDefinitions();
    const factorDef = factorDefinitions[factor];
    
    if (!factorDef) {
      return { error: 'Factor not found' };
    }
    
    // Analyze factor in isolation
    const soloResults = await this.patternDiscoveryService.discoverPatterns([factor]);
    
    // Analyze factor combined with top performing factors
    const topFactors = ['homeWinStreak', 'awayLossStreak', 'homeTopSix']; // Example top factors
    const combinedResults = [];
    
    for (const topFactor of topFactors) {
      if (topFactor !== factor) {
        const results = await this.patternDiscoveryService.discoverPatterns([topFactor, factor]);
        combinedResults.push({
          combinedWith: topFactor,
          results
        });
      }
    }
    
    return {
      factor,
      definition: factorDef,
      soloPerformance: soloResults,
      combinedPerformance: combinedResults,
      impact: {
        isolation: {
          roi: soloResults.roi,
          winRate: soloResults.winRate,
          matchCount: soloResults.matchCount
        },
        bestCombination: combinedResults.length > 0 ? 
          combinedResults.reduce((best, current) => 
            current.results.roi > best.results.roi ? current : best
          ) : null
      }
    };
  }

  private generateBreadcrumb(factors: string[]): any[] {
    const breadcrumb = [{ label: 'Root', factors: [] }];
    
    for (let i = 0; i < factors.length; i++) {
      breadcrumb.push({
        label: factors[i],
        factors: factors.slice(0, i + 1)
      });
    }
    
    return breadcrumb;
  }

  async searchFactors(query: string): Promise<any> {
    const factorDefinitions = this.patternDiscoveryService.getFactorDefinitions();
    const allFactors = Object.keys(factorDefinitions);
    
    const matchingFactors = allFactors.filter(factor => 
      factor.toLowerCase().includes(query.toLowerCase()) ||
      (factorDefinitions[factor].description || '').toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      query,
      matches: matchingFactors.map(factor => ({
        factor,
        definition: factorDefinitions[factor]
      }))
    };
  }
}