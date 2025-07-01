const fs = require('fs');
const path = require('path');
const AsianHandicapCalculator = require('../src/utils/AsianHandicapCalculator');
const factorDefinitions = require('../src/pattern-discovery/factor_definitions');

class PatternDiscoveryEngine {
    constructor() {
        this.matches = [];
        this.factorCache = new Map(); // Cache factor evaluations per match
        this.resultsDir = path.join(__dirname, '../src/pattern-discovery/results');
        this.processedCount = 0;
        this.totalCombinations = 0;
        
        // Ensure results directory exists
        if (!fs.existsSync(this.resultsDir)) {
            fs.mkdirSync(this.resultsDir, { recursive: true });
        }
    }

    // Load all enhanced data
    loadData() {
        console.log('Loading data...');
        const dataDir = path.join(__dirname, '../data/enhanced');
        const files = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
        
        this.matches = [];
        
        for (const file of files) {
            const filePath = path.join(dataDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`Loading ${file}...`);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (data.matches && typeof data.matches === 'object') {
                    // Convert match object to array and filter matches that have Asian Handicap data
                    const matchArray = Object.keys(data.matches).map(matchName => {
                        const match = data.matches[matchName];
                        return {
                            id: matchName,
                            matchName: matchName,
                            homeTeam: matchName.split(' v ')[0],
                            awayTeam: matchName.split(' v ')[1],
                            ...match.preMatch?.match,
                            asianHandicapOdds: match.preMatch?.match?.asianHandicapOdds,
                            postMatch: match.postMatch?.actualResults,
                            fbref: match.preMatch?.fbref,
                            timeSeries: match.timeSeries,
                            preMatch: match.preMatch
                        };
                    });
                    
                    const ahMatches = matchArray.filter(match => 
                        match.asianHandicapOdds && 
                        match.asianHandicapOdds.homeHandicap &&
                        match.asianHandicapOdds.homeOdds &&
                        match.asianHandicapOdds.awayOdds &&
                        match.postMatch &&
                        typeof match.postMatch.homeGoals === 'number' &&
                        typeof match.postMatch.awayGoals === 'number'
                    );
                    this.matches.push(...ahMatches);
                    console.log(`  Added ${ahMatches.length} matches with AH data`);
                }
            }
        }
        
        console.log(`Total matches loaded: ${this.matches.length}`);
        return this.matches.length > 0;
    }

    // Get cache key for factor evaluation
    getCacheKey(matchId, factorGroup, factorName) {
        return `${matchId}_${factorGroup}_${factorName}`;
    }

    // Evaluate factor against match with caching
    evaluateFactor(factor, match, factorGroup, factorName) {
        const cacheKey = this.getCacheKey(match.id || match.matchId, factorGroup, factorName);
        
        if (this.factorCache.has(cacheKey)) {
            return this.factorCache.get(cacheKey);
        }

        let result;
        try {
            // Handle expressions vs direct values
            if (typeof factor.expression === 'string') {
                // Create a safe evaluation context
                const context = {
                    match,
                    fbref: match.fbref || {},
                    timeSeries: match.timeSeries || {},
                    preMatch: match.preMatch || {},
                    postMatch: match.postMatch || {},
                    Math: Math,
                    parseFloat: parseFloat,
                    parseInt: parseInt
                };
                
                // Evaluate the expression
                result = this.safeEvaluate(factor.expression, context);
            } else {
                result = factor.expression;
            }
        } catch (error) {
            console.warn(`Error evaluating factor ${factorGroup}.${factorName}:`, error.message);
            result = false;
        }

        this.factorCache.set(cacheKey, result);
        return result;
    }

    // Safe expression evaluation
    safeEvaluate(expression, context) {
        try {
            // Create function with context variables
            const func = new Function(...Object.keys(context), `return ${expression}`);
            return func(...Object.values(context));
        } catch (error) {
            return false;
        }
    }

    // Determine bet side for a match given the combination
    getBetSide(combination, match) {
        // Find the mandatory side factor
        const sideFactor = combination.find(f => f.group === 'side');
        if (!sideFactor) {
            throw new Error('No side factor found in combination');
        }

        const factor = factorDefinitions.mandatory.side[sideFactor.name];
        
        if (factor.betSide) {
            if (typeof factor.betSide === 'string' && !factor.betSide.includes('match.')) {
                return factor.betSide;
            } else {
                // Dynamic betSide evaluation
                try {
                    const context = {
                        match,
                        fbref: match.fbref || {},
                        timeSeries: match.timeSeries || {},
                        preMatch: match.preMatch || {},
                        postMatch: match.postMatch || {}
                    };
                    return this.safeEvaluate(factor.betSide, context);
                } catch (error) {
                    console.warn('Error evaluating dynamic betSide:', error.message);
                    return 'home'; // fallback
                }
            }
        }
        
        return 'home'; // fallback
    }

    // Get stake amount for a match given the combination
    getStakeAmount(combination, match) {
        const sizeFactor = combination.find(f => f.group === 'size');
        if (!sizeFactor) {
            return 200; // default
        }

        const factor = factorDefinitions.mandatory.size[sizeFactor.name];
        return this.evaluateFactor(factor, match, 'size', sizeFactor.name);
    }

    // Calculate results for a specific combination
    calculateCombinationResults(combination) {
        const results = {
            combination: combination.map(f => ({ group: f.group, name: f.name })),
            description: combination.map(f => f.description).join(' + '),
            totalBets: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            totalStake: 0,
            totalPayout: 0,
            totalProfit: 0,
            roi: 0,
            winRate: 0,
            bets: []
        };

        for (const match of this.matches) {
            // Check if match satisfies all factors in combination
            let satisfiesAll = true;
            
            for (const combFactor of combination) {
                const factorGroup = factorDefinitions[combFactor.group] || factorDefinitions.mandatory[combFactor.group];
                const factor = factorGroup[combFactor.name];
                
                const evaluated = this.evaluateFactor(factor, match, combFactor.group, combFactor.name);
                
                if (!evaluated) {
                    satisfiesAll = false;
                    break;
                }
            }

            if (!satisfiesAll) continue;

            // This match satisfies the combination, place bet
            const betSide = this.getBetSide(combination, match);
            const stakeAmount = this.getStakeAmount(combination, match);
            
            // Get odds and handicap for the bet
            let odds, handicap;
            if (betSide === 'home') {
                odds = match.asianHandicapOdds.homeOdds;
                handicap = match.asianHandicapOdds.homeHandicap;
            } else {
                odds = match.asianHandicapOdds.awayOdds;
                handicap = match.asianHandicapOdds.awayHandicap;
            }

            // Calculate betting result using AsianHandicapCalculator
            try {
                const betResult = AsianHandicapCalculator.calculate(
                    match.postMatch.homeGoals,
                    match.postMatch.awayGoals,
                    handicap,
                    betSide,
                    odds,
                    stakeAmount
                );

                // Record the bet
                const bet = {
                    matchId: match.id || match.matchId,
                    date: match.date || match.matchDate,
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    homeScore: match.postMatch.homeGoals,
                    awayScore: match.postMatch.awayGoals,
                    betSide: betSide,
                    handicap: handicap,
                    odds: odds,
                    stake: stakeAmount,
                    outcome: betResult.outcome,
                    payout: betResult.payout,
                    profit: betResult.profit
                };

                results.bets.push(bet);
                results.totalBets++;
                results.totalStake += stakeAmount;
                results.totalPayout += betResult.payout;
                results.totalProfit += betResult.profit;

                if (betResult.outcome === 'win') {
                    results.wins++;
                } else if (betResult.outcome === 'loss') {
                    results.losses++;
                } else {
                    results.pushes++;
                }

            } catch (error) {
                console.warn(`Error calculating bet result for match ${match.id}:`, error.message);
            }
        }

        // Calculate final metrics
        if (results.totalStake > 0) {
            results.roi = (results.totalProfit / results.totalStake) * 100;
        }
        if (results.totalBets > 0) {
            results.winRate = (results.wins / results.totalBets) * 100;
        }

        return results;
    }

    // Generate all possible combinations
    generateCombinations() {
        const mandatory = factorDefinitions.mandatory;
        const optional = {};
        
        // Separate mandatory and optional factors
        Object.keys(factorDefinitions).forEach(groupName => {
            if (groupName !== 'mandatory') {
                optional[groupName] = factorDefinitions[groupName];
            }
        });

        const combinations = [];
        
        // Get mandatory factor combinations (side + size)
        const sideFactors = Object.keys(mandatory.side).map(name => ({
            group: 'side',
            name,
            description: mandatory.side[name].description
        }));
        
        const sizeFactors = Object.keys(mandatory.size).map(name => ({
            group: 'size', 
            name,
            description: mandatory.size[name].description
        }));

        // Get optional factor groups and their factors
        const optionalGroups = Object.keys(optional);
        const optionalFactors = {};
        
        optionalGroups.forEach(groupName => {
            optionalFactors[groupName] = Object.keys(optional[groupName]).map(name => ({
                group: groupName,
                name,
                description: optional[groupName][name].description
            }));
        });

        console.log(`Optional groups: ${optionalGroups.length}`);
        console.log(`Total optional factors: ${Object.values(optionalFactors).reduce((sum, arr) => sum + arr.length, 0)}`);

        // Generate combinations for 1 to 6 total factors (including mandatory)
        for (let numOptionalFactors = 0; numOptionalFactors <= Math.min(6 - 2, optionalGroups.length); numOptionalFactors++) {
            
            if (numOptionalFactors === 0) {
                // Just mandatory factors
                for (const sideFactor of sideFactors) {
                    for (const sizeFactor of sizeFactors) {
                        combinations.push([sideFactor, sizeFactor]);
                    }
                }
            } else {
                // Generate combinations of optional groups
                const groupCombinations = this.getCombinations(optionalGroups, numOptionalFactors);
                
                for (const groupCombo of groupCombinations) {
                    // For each group combination, generate factor combinations
                    const factorCombos = this.generateFactorCombinations(groupCombo, optionalFactors);
                    
                    for (const factorCombo of factorCombos) {
                        for (const sideFactor of sideFactors) {
                            for (const sizeFactor of sizeFactors) {
                                combinations.push([sideFactor, sizeFactor, ...factorCombo]);
                            }
                        }
                    }
                }
            }
        }

        this.totalCombinations = combinations.length;
        console.log(`Total combinations to test: ${this.totalCombinations}`);
        return combinations;
    }

    // Generate combinations of array elements
    getCombinations(arr, r) {
        const result = [];
        
        function combine(start, combo) {
            if (combo.length === r) {
                result.push([...combo]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        }
        
        combine(0, []);
        return result;
    }

    // Generate factor combinations for given groups
    generateFactorCombinations(groups, optionalFactors) {
        if (groups.length === 0) return [[]];
        
        const result = [];
        
        function generateRecursive(groupIndex, currentCombo) {
            if (groupIndex === groups.length) {
                result.push([...currentCombo]);
                return;
            }
            
            const currentGroup = groups[groupIndex];
            const factors = optionalFactors[currentGroup];
            
            for (const factor of factors) {
                currentCombo.push(factor);
                generateRecursive(groupIndex + 1, currentCombo);
                currentCombo.pop();
            }
        }
        
        generateRecursive(0, []);
        return result;
    }

    // Process all combinations and write results
    async processCombinations() {
        console.log('Generating combinations...');
        const combinations = this.generateCombinations();
        
        console.log('Processing combinations...');
        
        for (let i = 0; i < combinations.length; i++) {
            const combination = combinations[i];
            
            // Calculate results for this combination
            const results = this.calculateCombinationResults(combination);
            
            // Only save results with at least some data
            if (results.totalBets >= 0) { // Changed from > 0 to >= 0 as requested
                // Generate filename
                const fileName = this.generateFileName(combination);
                const filePath = path.join(this.resultsDir, fileName);
                
                // Write results to file
                fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
            }
            
            this.processedCount++;
            
            // Progress update
            if (this.processedCount % 100 === 0 || this.processedCount === combinations.length) {
                console.log(`Processed ${this.processedCount}/${combinations.length} combinations (${((this.processedCount / combinations.length) * 100).toFixed(1)}%)`);
                
                // Force garbage collection hint
                if (global.gc) {
                    global.gc();
                }
            }
        }
        
        console.log('Pattern discovery complete!');
        console.log(`Results saved to: ${this.resultsDir}`);
    }

    // Generate filename for combination results
    generateFileName(combination) {
        const parts = combination.map(f => `${f.group}_${f.name}`);
        return `pattern_${parts.join('_')}.json`;
    }

    // Main execution
    async run() {
        console.log('=== Pattern Discovery Engine Starting ===');
        
        if (!this.loadData()) {
            console.error('Failed to load data');
            return;
        }
        
        await this.processCombinations();
        
        console.log('=== Pattern Discovery Engine Complete ===');
    }
}

// Run if called directly
if (require.main === module) {
    const engine = new PatternDiscoveryEngine();
    engine.run().catch(console.error);
}

module.exports = PatternDiscoveryEngine; 