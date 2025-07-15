/**
 * Generic Factor Evaluation System
 * 
 * Provides a configurable system for evaluating factors against data records
 * and calculating results using pluggable profit calculators.
 */

class GenericEvaluator {
    
    constructor(config) {
        this.config = config;
        this.profitCalculator = null;
        this.factors = null;
        this.dataRecords = [];
        
        // Performance cache
        this.performanceCache = {
            factorEvaluations: new Map(),
            profitCalculations: new Map(),
            filteredRecords: new Map(),
            stats: {
                factorEvalHits: 0,
                factorEvalMisses: 0,
                profitCalcHits: 0,
                profitCalcMisses: 0
            }
        };
    }
    
    /**
     * Initialize the evaluator with config, factors, and profit calculator
     */
    async initialize() {
        try {
            // Load factor definitions
            await this.loadFactors();
            
            // Load profit calculator
            await this.loadProfitCalculator();
            
            console.log('✅ Generic Evaluator initialized successfully');
            console.log(`📊 Profit Calculator: ${this.profitCalculator.getDescription()}`);
            console.log(`🔧 Required Fields: ${this.profitCalculator.getRequiredFields().join(', ')}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Generic Evaluator:', error);
            throw error;
        }
    }
    
    /**
     * Load factor definitions from config
     */
    async loadFactors() {
        try {
            const response = await fetch('./js/factor_definitions.json');
            this.factors = await response.json();
            console.log(`📋 Loaded ${Object.keys(this.factors).length} factor categories`);
        } catch (error) {
            console.error('Failed to load factors:', error);
            throw error;
        }
    }
    
    /**
     * Load and instantiate the profit calculator
     */
    async loadProfitCalculator() {
        try {
            // For now, we'll use the Asian Handicap calculator directly
            // In a full implementation, this would dynamically load the module
            this.profitCalculator = window.AsianHandicapProfitCalculator || AsianHandicapProfitCalculator;
            console.log(`💰 Loaded profit calculator: ${this.config.profitCalculator.type}`);
        } catch (error) {
            console.error('Failed to load profit calculator:', error);
            throw error;
        }
    }
    
    /**
     * Load data records from configured sources
     */
    async loadDataRecords(limit = null) {
        try {
            this.dataRecords = [];
            const dataSources = this.config.dataSources;
            
            for (const [key, source] of Object.entries(dataSources)) {
                console.log(`📁 Loading data from: ${source.name}`);
                
                // For enhanced data, load all year files
                if (key === 'enhanced') {
                    const years = ['2022-2023', '2023-2024', '2024-2025'];
                    for (const year of years) {
                        try {
                            const response = await fetch(`${source.path}year-${year}-enhanced.json`);
                            const data = await response.json();
                            
                            if (Array.isArray(data)) {
                                this.dataRecords.push(...data);
                            } else if (data.matches) {
                                // Handle object structure with matches property
                                const matchRecords = Object.values(data.matches);
                                this.dataRecords.push(...matchRecords);
                                console.log(`📊 Loaded ${matchRecords.length} matches from ${year}`);
                            } else {
                                console.warn(`⚠️ Unexpected data structure from ${year}:`, Object.keys(data));
                            }
                        } catch (error) {
                            console.warn(`⚠️ Could not load ${year} data:`, error.message);
                        }
                    }
                }
            }
            
            // Apply limit if specified
            if (limit && this.dataRecords.length > limit) {
                this.dataRecords = this.dataRecords.slice(0, limit);
            }
            
            console.log(`📊 Loaded ${this.dataRecords.length} total records`);
            return this.dataRecords.length;
            
        } catch (error) {
            console.error('Failed to load data records:', error);
            throw error;
        }
    }
    
    /**
     * Evaluate a factor against a record with caching
     */
    evaluateFactor(record, factorExpression) {
        // Create cache key
        const recordId = this.getRecordId(record);
        const cacheKey = `${recordId}_${factorExpression}`;
        
        // Check cache first
        if (this.performanceCache.factorEvaluations.has(cacheKey)) {
            this.performanceCache.stats.factorEvalHits++;
            return this.performanceCache.factorEvaluations.get(cacheKey);
        }
        
        // Evaluate factor
        let result;
        try {
            const context = this.createEvaluationContext(record);
            result = new Function(...Object.keys(context), `return ${factorExpression}`)(...Object.values(context));
        } catch (error) {
            console.warn(`Error evaluating factor: ${factorExpression}`, error);
            result = false;
        }
        
        // Cache result
        this.performanceCache.factorEvaluations.set(cacheKey, result);
        this.performanceCache.stats.factorEvalMisses++;
        
        return result;
    }
    
    /**
     * Calculate profit for a record and strategy with caching
     */
    calculateProfit(record, strategy) {
        // Create cache key
        const recordId = this.getRecordId(record);
        const strategyKey = JSON.stringify(strategy);
        const cacheKey = `${recordId}_${strategyKey}`;
        
        // Check cache first
        if (this.performanceCache.profitCalculations.has(cacheKey)) {
            this.performanceCache.stats.profitCalcHits++;
            return this.performanceCache.profitCalculations.get(cacheKey);
        }
        
        // Calculate profit
        const result = this.profitCalculator.calculate(record, this.config, strategy);
        
        // Cache result
        this.performanceCache.profitCalculations.set(cacheKey, result);
        this.performanceCache.stats.profitCalcMisses++;
        
        return result;
    }
    
    /**
     * Filter records by factor combination
     */
    getFilteredRecords(factorCombination) {
        const cacheKey = JSON.stringify(factorCombination);
        
        // Check cache first
        if (this.performanceCache.filteredRecords.has(cacheKey)) {
            return this.performanceCache.filteredRecords.get(cacheKey);
        }
        
        // Filter records
        const filtered = this.dataRecords.filter(record => {
            return factorCombination.every(factor => {
                const factorDef = this.getFactorDefinition(factor);
                return factorDef && this.evaluateFactor(record, factorDef.expression);
            });
        });
        
        // Cache result
        this.performanceCache.filteredRecords.set(cacheKey, filtered);
        
        return filtered;
    }
    
    /**
     * Analyze strategy performance for given factors
     */
    analyzeStrategy(factorCombination, sizeFactors = [], sideFactors = []) {
        const matchingRecords = this.getFilteredRecords(factorCombination);
        
        if (matchingRecords.length === 0) {
            return {
                totalBets: 0,
                totalProfit: 0,
                winRate: 0,
                averageProfit: 0,
                records: []
            };
        }
        
        const results = matchingRecords.map(record => {
            // Determine stake (size)
            const stake = this.calculateStake(record, sizeFactors);
            
            // Determine bet side
            const betSide = this.calculateBetSide(record, sideFactors);
            
            // Create strategy object
            const strategy = { stake, betSide };
            
            // Calculate profit
            const profitResult = this.calculateProfit(record, strategy);
            
            return {
                record,
                strategy,
                profit: profitResult.profit,
                outcome: profitResult.outcome,
                details: profitResult.details
            };
        });
        
        // Calculate summary statistics
        const totalBets = results.length;
        const totalProfit = results.reduce((sum, r) => sum + r.profit, 0);
        const wins = results.filter(r => r.profit > 0).length;
        const winRate = wins / totalBets;
        const averageProfit = totalProfit / totalBets;
        
        return {
            totalBets,
            totalProfit,
            winRate,
            averageProfit,
            records: results
        };
    }
    
    /**
     * Helper methods
     */
    
    createEvaluationContext(record) {
        const structure = this.config.dataStructure.recordFields;
        const context = { Math };
        
        // Add configured fields to context
        for (const [key, path] of Object.entries(structure)) {
            context[key] = this.getFieldValue(record, path) || {};
        }
        
        return context;
    }
    
    getFieldValue(record, path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], record);
    }
    
    getRecordId(record) {
        // Create a unique ID for the record for caching
        const matchInfo = record.match || {};
        return `${matchInfo.season || 'unknown'}_${matchInfo.homeTeam || 'home'}_${matchInfo.awayTeam || 'away'}_${matchInfo.date || 'nodate'}`;
    }
    
    getFactorDefinition(factorPath) {
        const parts = factorPath.split('.');
        let current = this.factors;
        
        for (const part of parts) {
            current = current[part];
            if (!current) return null;
        }
        
        return current;
    }
    
    calculateStake(record, sizeFactors) {
        if (sizeFactors.length === 0) return 200; // default stake
        
        // Use first size factor for now
        const sizeFactor = this.getFactorDefinition(sizeFactors[0]);
        if (!sizeFactor) return 200;
        
        try {
            const context = this.createEvaluationContext(record);
            return new Function(...Object.keys(context), `return ${sizeFactor.expression}`)(...Object.values(context));
        } catch (error) {
            console.warn('Error calculating stake:', error);
            return 200;
        }
    }
    
    calculateBetSide(record, sideFactors) {
        if (sideFactors.length === 0) return 'home'; // default side
        
        // Use first side factor
        const sideFactor = this.getFactorDefinition(sideFactors[0]);
        if (!sideFactor) return 'home';
        
        if (sideFactor.betSide) {
            // Static bet side
            if (['home', 'away'].includes(sideFactor.betSide)) {
                return sideFactor.betSide;
            }
            
            // Dynamic bet side expression
            try {
                const context = this.createEvaluationContext(record);
                return new Function(...Object.keys(context), `return ${sideFactor.betSide}`)(...Object.values(context));
            } catch (error) {
                console.warn('Error calculating bet side:', error);
                return 'home';
            }
        }
        
        return 'home';
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        const stats = this.performanceCache.stats;
        const totalCacheSize = this.performanceCache.factorEvaluations.size + 
                              this.performanceCache.profitCalculations.size + 
                              this.performanceCache.filteredRecords.size;
        
        return {
            factorEvaluations: {
                hits: stats.factorEvalHits,
                misses: stats.factorEvalMisses,
                hitRate: stats.factorEvalHits / (stats.factorEvalHits + stats.factorEvalMisses)
            },
            profitCalculations: {
                hits: stats.profitCalcHits,
                misses: stats.profitCalcMisses,
                hitRate: stats.profitCalcHits / (stats.profitCalcHits + stats.profitCalcMisses)
            },
            totalCacheSize,
            dataRecords: this.dataRecords.length
        };
    }
}