/**
 * Clean Genetic Algorithm - Simple and Standard Implementation
 * 
 * Standard genetic algorithm with:
 * - Population of factor combinations
 * - Tournament selection
 * - Single-point crossover
 * - Simple mutation
 * - API-based fitness evaluation
 */
import { Injectable } from '@nestjs/common';
import { PatternDiscoveryService } from './pattern-discovery.service';
import * as fs from 'fs';
import * as path from 'path';

type Individual = {
  id: string;
  factors: string[];
  fitness: number;
  roi: number;
  matches: number;
  winRate: number;
  totalProfit: number;
  totalStake: number;
  sharpeRatio: number;
  maxDrawdown: number;
  evaluated: boolean;
};

type Config = {
  populationSize: number;
  maxGenerations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteSize: number;
  minFactors: number;
  maxFactors: number;
};

@Injectable()
export class CleanGeneticOptimizerService {
  private allFactors: string[] = [];
  private population: Individual[] = [];
  private generation = 0;
  private isRunning = false;
  private logFile: string = '';
  private logStream: fs.WriteStream | null = null;
  private strategiesFile: string = '';
  private strategiesStream: fs.WriteStream | null = null;
  private foundStrategies: Set<string> = new Set();

  private defaultConfig: Config = {
    populationSize: 500,
    maxGenerations: 1000,
    mutationRate: 0.12,
    crossoverRate: 0.88,
    eliteSize: 25,
    minFactors: 2,
    maxFactors: 8
  };

  constructor(private patternDiscoveryService: PatternDiscoveryService) {}

  async initialize() {
    this.log('🧬 Initializing Clean Genetic Algorithm');
    
    const factorData = this.patternDiscoveryService.getFactorDefinitions();
    this.allFactors = [];
    
    // Parse the factor definitions from JSON structure
    for (const [category, factors] of Object.entries(factorData)) {
      if (typeof factors === 'object' && factors !== null) {
        for (const [factorKey, factorConfig] of Object.entries(factors)) {
          // Create factor string in format "category.key"
          this.allFactors.push(`${category}.${factorKey}`);
        }
      }
    }
    
    this.log(`✅ Loaded ${this.allFactors.length} factors`);
    this.initializeLogging();
  }

  async optimize(config: Partial<Config> = {}) {
    if (this.isRunning) {
      throw new Error('Already running');
    }

    const finalConfig = { ...this.defaultConfig, ...config };
    this.isRunning = true;
    this.generation = 0;

    this.log(`🚀 Starting optimization: ${finalConfig.populationSize} individuals, ${finalConfig.maxGenerations} generations`);

    try {
      // Initialize population
      this.createInitialPopulation(finalConfig);
      
      let bestFitness = -Infinity;
      let stagnationCount = 0;
      let foundViableStrategy = false;

      // Main evolution loop
      for (this.generation = 1; this.generation <= finalConfig.maxGenerations && this.isRunning; this.generation++) {
        this.log(`\n=== GENERATION ${this.generation}/${finalConfig.maxGenerations} ===`);
        
        // Evaluate population (async)
        await this.evaluatePopulation();
        
        if (!this.isRunning) break;
        
        // Sort by fitness
        this.population.sort((a, b) => b.fitness - a.fitness);
        
        const best = this.population[0];
        const avgFitness = this.population.reduce((sum, ind) => sum + ind.fitness, 0) / this.population.length;
        
        this.log(`🏆 Best: ROI=${best.roi.toFixed(1)}%, Matches=${best.matches}, Fitness=${best.fitness.toFixed(1)}`);
        this.log(`📊 Average Fitness: ${avgFitness.toFixed(1)}`);
        this.log(`📊 Factors: [${best.factors.join(', ')}]`);
        
        // Log ALL viable strategies we find (40+ matches, 10%+ ROI)
        this.logViableStrategies();
        
        // Progress reporting for long runs
        if (this.generation % 50 === 0 || this.generation <= 5) {
          this.log(`🚀 PROGRESS: ${this.generation}/${finalConfig.maxGenerations} generations (${((this.generation/finalConfig.maxGenerations)*100).toFixed(1)}%) | Found ${this.foundStrategies.size} viable strategies`);
        }
        
        // Check for improvement and stagnation (require bigger improvement to reset stagnation)
        if (best.fitness > bestFitness + 5.0) {
          bestFitness = best.fitness;
          stagnationCount = 0;
          this.log(`📈 New best fitness: ${best.fitness.toFixed(1)} (significant improvement detected)`);
        } else {
          stagnationCount++;
          if (stagnationCount % 10 === 0) {
            this.log(`⏳ No significant improvement for ${stagnationCount} generations`);
          }
        }
        
        // NO EARLY TERMINATION - Always run full generations to find all good strategies!
        
        // Create next generation (synchronous)
        if (this.generation < finalConfig.maxGenerations) {
          this.log('🔄 Creating next generation...');
          this.population = this.createNextGeneration(finalConfig);
          this.log(`✅ Generation ${this.generation + 1} ready: ${this.population.length} individuals`);
        }
      }
      
      const final = this.population[0];
      this.log(`\n🏁 FINAL RESULT: ROI=${final.roi.toFixed(1)}%, Matches=${final.matches} ${final.factors}`);
      
      return final;
      
    } finally {
      this.isRunning = false;
      this.closeLogging();
    }
  }

  private createInitialPopulation(config: Config) {
    this.population = [];
    
    for (let i = 0; i < config.populationSize; i++) {
      const individual = this.createRandomIndividual(config);
      this.population.push(individual);
    }
    
    this.log(`✅ Created initial population: ${this.population.length} individuals`);
  }

  private createRandomIndividual(config: Config): Individual {
    const factorCount = Math.floor(Math.random() * (config.maxFactors - config.minFactors + 1)) + config.minFactors;
    const factors: string[] = [];
    
    // Add required side and size factors
    const sideFactors = this.allFactors.filter(f => f.startsWith('side.'));
    const sizeFactors = this.allFactors.filter(f => f.startsWith('size.'));
    
    if (sideFactors.length > 0) {
      factors.push(sideFactors[Math.floor(Math.random() * sideFactors.length)]);
    }
    if (sizeFactors.length > 0) {
      factors.push(sizeFactors[Math.floor(Math.random() * sizeFactors.length)]);
    }
    
    // Add random factors
    while (factors.length < factorCount) {
      const available = this.allFactors.filter(f => !factors.includes(f));
      if (available.length === 0) break;
      
      const randomFactor = available[Math.floor(Math.random() * available.length)];
      factors.push(randomFactor);
    }
    
    const individual = {
      id: Math.random().toString(36).substring(7),
      factors,
      fitness: 0,
      roi: 0,
      matches: 0,
      winRate: 0,
      totalProfit: 0,
      totalStake: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      evaluated: false
    };
    
    // Validate strategy integrity
    this.validateStrategyIntegrity(individual);
    
    return individual;
  }

  private async evaluatePopulation() {
    const unevaluated = this.population.filter(ind => !ind.evaluated);
    this.log(`🔍 Evaluating ${unevaluated.length} individuals`);
    
    for (let i = 0; i < unevaluated.length; i++) {
      if (!this.isRunning) break;
      
      const individual = unevaluated[i];
      // this.log(`⚖️ Evaluating ${i + 1}/${unevaluated.length}: [${individual.factors.join(', ')}]`);
      
              try {
          // Use the working API instead of broken local calculations
          const apiResult = await this.patternDiscoveryService.discoverPatterns(individual.factors);
        
        if (apiResult && apiResult.matchCount > 0) {
          individual.roi = apiResult.roi || 0;
          individual.matches = apiResult.matchCount || 0;
          individual.winRate = apiResult.winRate || 0;
          individual.totalProfit = apiResult.profitability || 0;
          individual.totalStake = apiResult.analysis?.totalStake || 0;
          
          // Calculate steadiness metrics (use estimation for now until we get betting records)
          individual.maxDrawdown = this.estimateMaxDrawdown({
            roi: individual.roi,
            totalBets: individual.matches,
            winRate: individual.winRate
          });
          
          // TODO: Implement actual drawdown when strategy service provides betting records
          // if (strategy.bettingRecords && strategy.bettingRecords.length > 0) {
          //   const initialCapital = 10000; // Should be configurable
          //   individual.maxDrawdown = this.calculateActualDrawdown(strategy.bettingRecords, initialCapital);
          // }
          individual.sharpeRatio = 0; // Not used anymore
          
          individual.fitness = this.calculateFitness(individual);
          individual.evaluated = true;
          
          if (individual.roi > 10 && individual.matches > 50) {
            this.log(`📈 Result: ROI=${individual.roi.toFixed(1)}%, Matches=${individual.matches}, Drawdown=${individual.maxDrawdown.toFixed(1)}% ${individual.factors}`);
          }
        } else {
          individual.fitness = -100;
          individual.evaluated = true;
          this.log(`❌ Failed evaluation`);
        }
        
      } catch (error: any) {
        individual.fitness = -100;
        individual.evaluated = true;
        this.log(`❌ Error: ${error.message}`);
      }
    }
  }

  private calculateFitness(individual: Individual): number {
    // Heavy penalties for insufficient data
    if (individual.matches === 0) return -1000;
    if (individual.matches < 5) return -500;
    if (individual.matches < 15) return -300;
    if (individual.matches < 40) return -200;
    
    // Must meet minimum ROI requirement
    if (individual.roi < 10) return -100;
    
    // ROI is KING - heavily weighted base fitness
    let fitness = individual.roi * 10;
    
    // Strong bonus for sufficient match volume (but ROI matters most)
    if (individual.matches >= 40) fitness += 50;
    if (individual.matches >= 80) fitness += 75;
    if (individual.matches >= 150) fitness += 100;
    
    // MASSIVE bonus for excellent ROI
    if (individual.roi >= 15) fitness += individual.roi * 5;
    if (individual.roi >= 20) fitness += individual.roi * 10;
    if (individual.roi >= 30) fitness += individual.roi * 20;
    
    // DRAWDOWN-BASED STEADINESS REWARDS - The lower the drawdown, the more we love it!
    
    // Massive bonuses for low drawdown (steady strategies)
    if (individual.maxDrawdown <= 3) fitness += 300;   // Ultra-steady = huge bonus
    if (individual.maxDrawdown <= 5) fitness += 200;   // Very steady = big bonus  
    if (individual.maxDrawdown <= 8) fitness += 150;   // Steady = good bonus
    if (individual.maxDrawdown <= 12) fitness += 100;  // Moderately steady = decent bonus
    if (individual.maxDrawdown <= 18) fitness += 50;   // Acceptable steadiness = small bonus
    
    // Heavy penalties for high drawdown (volatile strategies)
    if (individual.maxDrawdown > 20) fitness -= Math.pow(individual.maxDrawdown - 20, 2); // Quadratic penalty
    if (individual.maxDrawdown > 30) fitness -= Math.pow(individual.maxDrawdown - 30, 2.5); // Even heavier penalty
    
    // THE HOLY GRAIL: High ROI + Ultra-Low Drawdown
    if (individual.roi >= 15 && individual.maxDrawdown <= 5) {
      fitness += 800; // MASSIVE bonus for profitable + ultra-steady
    }
    if (individual.roi >= 20 && individual.maxDrawdown <= 8) {
      fitness += 600; // HUGE bonus for very profitable + steady
    }
    
    // Extra bonus for high ROI + decent volume
    if (individual.roi >= 15 && individual.matches >= 40) {
      fitness += 200;
    }
    
    return fitness;
  }

  private createNextGeneration(config: Config): Individual[] {
    const nextGen: Individual[] = [];
    
    // Elite selection - keep best individuals
    for (let i = 0; i < config.eliteSize; i++) {
      const elite = { ...this.population[i] };
      elite.id = Math.random().toString(36).substring(7);
      elite.evaluated = false;
      nextGen.push(elite);
    }
    
    // Fill rest with offspring
    while (nextGen.length < config.populationSize) {
      let offspring: Individual;
      
      if (Math.random() < config.crossoverRate) {
        // Crossover
        const parent1 = this.tournamentSelection();
        const parent2 = this.tournamentSelection();
        offspring = this.crossover(parent1, parent2);
      } else {
        // Copy and mutate
        const parent = this.tournamentSelection();
        offspring = { ...parent };
        offspring.id = Math.random().toString(36).substring(7);
        offspring.evaluated = false;
      }
      
      // Mutate
      if (Math.random() < config.mutationRate) {
        this.mutate(offspring, config);
      }
      
      nextGen.push(offspring);
    }
    
    return nextGen;
  }

  private tournamentSelection(tournamentSize = 3): Individual {
    const tournament: Individual[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length);
      tournament.push(this.population[randomIndex]);
    }
    
    tournament.sort((a, b) => b.fitness - a.fitness);
    return tournament[0];
  }

  private crossover(parent1: Individual, parent2: Individual): Individual {
    const allFactors = [...new Set([...parent1.factors, ...parent2.factors])];
    const childFactors: string[] = [];
    
    // Ensure side and size factors
    const sideFactors = allFactors.filter(f => f.startsWith('side.'));
    const sizeFactors = allFactors.filter(f => f.startsWith('size.'));
    
    if (sideFactors.length > 0) {
      childFactors.push(sideFactors[Math.floor(Math.random() * sideFactors.length)]);
    }
    if (sizeFactors.length > 0) {
      childFactors.push(sizeFactors[Math.floor(Math.random() * sizeFactors.length)]);
    }
    
    // Add other factors randomly - FIX: Filter out already selected factors
    let availableOtherFactors = allFactors.filter(f => 
      !f.startsWith('side.') && 
      !f.startsWith('size.') && 
      !childFactors.includes(f)
    );
    const targetSize = Math.min(5, Math.max(2, Math.floor(Math.random() * 4) + 2));
    
    while (childFactors.length < targetSize && availableOtherFactors.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableOtherFactors.length);
      const randomFactor = availableOtherFactors[randomIndex];
      childFactors.push(randomFactor);
      // Remove the selected factor from available list to prevent infinite loop
      availableOtherFactors.splice(randomIndex, 1);
    }
    
    const individual = {
      id: Math.random().toString(36).substring(7),
      factors: childFactors,
      fitness: 0,
      roi: 0,
      matches: 0,
      winRate: 0,
      totalProfit: 0,
      totalStake: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      evaluated: false
    };
    
    // Validate strategy integrity
    this.validateStrategyIntegrity(individual);
    
    return individual;
  }

  private mutate(individual: Individual, config: Config) {
    individual.evaluated = false;
    
    const mutationType = Math.random();
    
    if (mutationType < 0.4 && individual.factors.length < config.maxFactors) {
      // Add factor - but NEVER add side/size factors (must have exactly 1 of each)
      const available = this.allFactors.filter(f => 
        !individual.factors.includes(f) && 
        !f.startsWith('side.') && 
        !f.startsWith('size.')
      );
      if (available.length > 0) {
        const newFactor = available[Math.floor(Math.random() * available.length)];
        individual.factors.push(newFactor);
      }
    } else if (mutationType < 0.7 && individual.factors.length > config.minFactors) {
      // Remove factor (but not side/size)
      const removable = individual.factors.filter(f => !f.startsWith('side.') && !f.startsWith('size.'));
      if (removable.length > 0) {
        const toRemove = removable[Math.floor(Math.random() * removable.length)];
        const index = individual.factors.indexOf(toRemove);
        individual.factors.splice(index, 1);
      }
    } else {
      // Replace factor
      if (individual.factors.length > 0) {
        const replaceIndex = Math.floor(Math.random() * individual.factors.length);
        const oldFactor = individual.factors[replaceIndex];
        
        let available = this.allFactors.filter(f => !individual.factors.includes(f));
        if (oldFactor.startsWith('side.')) {
          available = available.filter(f => f.startsWith('side.'));
        } else if (oldFactor.startsWith('size.')) {
          available = available.filter(f => f.startsWith('size.'));
        }
        
        if (available.length > 0) {
          individual.factors[replaceIndex] = available[Math.floor(Math.random() * available.length)];
        }
      }
    }
    
    // Validate strategy integrity
    this.validateStrategyIntegrity(individual);
  }

  private validateStrategyIntegrity(individual: Individual) {
    const sideFactors = individual.factors.filter(f => f.startsWith('side.'));
    const sizeFactors = individual.factors.filter(f => f.startsWith('size.'));
    
    // Must have exactly 1 side and 1 size factor
    if (sideFactors.length !== 1 || sizeFactors.length !== 1) {
      this.log(`❌ VALIDATION ERROR: Strategy has ${sideFactors.length} side factors and ${sizeFactors.length} size factors: [${individual.factors.join(', ')}]`);
      
      // Fix the strategy
      this.fixStrategyIntegrity(individual);
    }
  }

  private fixStrategyIntegrity(individual: Individual) {
    const otherFactors = individual.factors.filter(f => !f.startsWith('side.') && !f.startsWith('size.'));
    
    // Remove all side/size factors
    individual.factors = otherFactors;
    
    // Add exactly 1 side factor
    const availableSides = this.allFactors.filter(f => f.startsWith('side.'));
    if (availableSides.length > 0) {
      const randomSide = availableSides[Math.floor(Math.random() * availableSides.length)];
      individual.factors.push(randomSide);
    }
    
    // Add exactly 1 size factor  
    const availableSizes = this.allFactors.filter(f => f.startsWith('size.'));
    if (availableSizes.length > 0) {
      const randomSize = availableSizes[Math.floor(Math.random() * availableSizes.length)];
      individual.factors.push(randomSize);
    }
    
    this.log(`✅ FIXED: Strategy now has [${individual.factors.join(', ')}]`);
  }

  private getSideConfigFromFactor(factors: string[]): any {
    const sideFactor = factors.find(f => f.startsWith('side.'));
    
    if (!sideFactor) {
      throw new Error('No side factor found in strategy');
    }
    
    // Extract the side key (e.g., 'side.higherOdds' -> 'higherOdds')
    const sideKey = sideFactor.split('.')[1];
    
    // Use the loaded factor definitions from the strategy generator service
    const factorDefinitions = this.patternDiscoveryService.getFactorDefinitions();
    const sideDefinitions = factorDefinitions?.side || {};
    const sideConfig = sideDefinitions[sideKey];

    if (sideConfig) {
      return {
        betSide: sideConfig.betSide,
        description: sideConfig.description
      };
    }

    throw new Error(`Unknown side factor: ${sideFactor}`);
  }

  private getSizeConfigFromFactor(factors: string[]): any {
    const sizeFactor = factors.find(f => f.startsWith('size.'));
    if (!sizeFactor) {
      throw new Error('No size factor found in strategy');
    }
    
    // Extract the size key (e.g., 'size.dynamic' -> 'dynamic')
    const sizeKey = sizeFactor.split('.')[1];
    
    // Use the loaded factor definitions from the strategy generator service
    const factorDefinitions = this.patternDiscoveryService.getFactorDefinitions();
    const sizeDefinitions = factorDefinitions?.size || {};
    const sizeConfig = sizeDefinitions[sizeKey];
    
    if (sizeConfig) {
      return {
        expression: sizeConfig.expression,
        description: sizeConfig.description,
        stakingMethod: sizeConfig.stakingMethod
      };
    }
    
    throw new Error(`Unknown size factor: ${sizeFactor}`);
  }

  private initializeLogging() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataDir = path.join(process.cwd(), 'data', 'v2');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.logFile = path.join(dataDir, `clean-genetic-log-${timestamp}.txt`);
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    
    this.strategiesFile = path.join(dataDir, `viable-strategies-${timestamp}.json`);
    this.strategiesStream = fs.createWriteStream(this.strategiesFile, { flags: 'a' });
    this.strategiesStream.write('[\n');
    
    this.log('📁 Clean Genetic Algorithm Log Started');
    this.log(`📊 Viable strategies will be saved to: ${this.strategiesFile}`);
  }

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(logEntry);
    if (this.logStream) {
      this.logStream.write(logEntry + '\n');
    }
  }

  private closeLogging() {
    if (this.logStream) {
      this.log('📁 Log closed');
      this.logStream.end();
      this.logStream = null;
    }
    
    if (this.strategiesStream) {
      this.strategiesStream.write('\n]');
      this.strategiesStream.end();
      this.strategiesStream = null;
    }
  }

  private logViableStrategies() {
    const viableStrategies = this.population.filter(ind => 
      ind.matches >= 40 && ind.roi >= 10
    );
    
    for (const strategy of viableStrategies) {
      const strategyKey = JSON.stringify(strategy.factors.sort());
      
      if (!this.foundStrategies.has(strategyKey)) {
        this.foundStrategies.add(strategyKey);
        
        const strategyData = {
          generation: this.generation,
          factors: strategy.factors,
          roi: Math.round(strategy.roi * 100) / 100,
          matches: strategy.matches,
          winRate: Math.round(strategy.winRate * 100) / 100,
          fitness: Math.round(strategy.fitness * 100) / 100,
          timestamp: new Date().toISOString()
        };
        
        if (this.strategiesStream) {
          if (this.foundStrategies.size > 1) {
            this.strategiesStream.write(',\n');
          }
          this.strategiesStream.write(JSON.stringify(strategyData, null, 2));
        }
        
        this.log(`💎 NEW VIABLE STRATEGY #${this.foundStrategies.size}: ROI=${strategy.roi.toFixed(1)}%, Matches=${strategy.matches}, Factors=[${strategy.factors.join(', ')}]`);
      }
    }
  }

  private estimateMaxDrawdown(performance: any): number {
    // Estimation method when detailed records aren't available
    if (!performance || performance.totalBets < 5) return 50;
    
    const lossRate = 1 - (performance.winRate / 100);
    const avgBetSize = performance.totalStake / performance.totalBets;
    
    // Estimate worst-case consecutive losses using geometric distribution
    const confidence = 0.95; // 95% confidence interval
    const maxConsecutiveLosses = Math.log(1 - confidence) / Math.log(lossRate);
    
    // Estimate maximum consecutive loss amount
    const maxConsecutiveLossAmount = maxConsecutiveLosses * avgBetSize;
    
    // Calculate drawdown as percentage of TOTAL STAKE (capital actually deployed)
    // This makes sense for variable bet sizing where each strategy uses different amounts
    const estimatedDrawdown = (maxConsecutiveLossAmount / performance.totalStake) * 100;
    
    return Math.min(estimatedDrawdown, 50);
  }

  stop() {
    this.isRunning = false;
    this.log('🛑 Optimization stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      generation: this.generation,
      populationSize: this.population.length,
      bestFitness: this.population.length > 0 ? Math.max(...this.population.map(p => p.fitness)) : 0,
      logFile: this.logFile
    };
  }
}