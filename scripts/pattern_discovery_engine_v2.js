const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AsianHandicapCalculator = require('../src/utils/AsianHandicapCalculator');
const factorDefinitions = require('../src/pattern-discovery/factor_definitions');

class PatternDiscoveryEngineV2 {
    constructor() {
        this.matches = [];
        this.matchLookup = {}; // Store full match details once
        this.factorCache = new Map(); // Cache factor evaluations per match
        this.resultsDir = path.join(__dirname, '../src/pattern-discovery/results');
        this.processedCount = 0;
        this.totalCombinations = 0;
        
        // Batching for performance - JSONL format (super fast)
        this.resultsBatch = [];
        this.batchSize = 5000; // Write every 5000 strategies (faster batching)
        this.outputFile = path.join(this.resultsDir, 'all_strategies.jsonl');
        this.metadataFile = path.join(this.resultsDir, 'metadata.json');
        
        // Ensure results directory exists
        if (!fs.existsSync(this.resultsDir)) {
            fs.mkdirSync(this.resultsDir, { recursive: true });
        }
        
        console.log('=== Pattern Discovery Engine V2 (Optimized) ===');
    }

    // Generate unique match ID
    generateMatchId(match) {
        const key = `${match.homeTeam}_vs_${match.awayTeam}_${match.date}`;
        return crypto.createHash('md5').update(key).digest('hex').substring(0, 12);
    }

    // Load all enhanced data
    loadData() {
        console.log('Loading data...');
        const dataDir = path.join(__dirname, '../data/enhanced');
        const files = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
        
        this.matches = [];
        this.matchLookup = {};
        
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
                    
                    // Generate unique IDs and store in lookup
                    ahMatches.forEach(match => {
                        const matchId = this.generateMatchId(match);
                        match.matchId = matchId;
                        
                        // Store full match details in lookup (only once)
                        if (!this.matchLookup[matchId]) {
                            this.matchLookup[matchId] = {
                                id: matchId,
                                matchName: match.matchName,
                                date: match.date,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                                homeScore: match.postMatch.homeGoals,
                                awayScore: match.postMatch.awayGoals,
                                asianHandicapOdds: match.asianHandicapOdds
                            };
                        }
                    });
                    
                    this.matches.push(...ahMatches);
                    console.log(`  Added ${ahMatches.length} matches with AH data`);
                }
            }
        }
        
        console.log(`Total matches loaded: ${this.matches.length}`);
        console.log(`Unique matches in lookup: ${Object.keys(this.matchLookup).length}`);
        
        // Save match lookup file
        const lookupPath = path.join(this.resultsDir, 'match_lookup.json');
        fs.writeFileSync(lookupPath, JSON.stringify(this.matchLookup, null, 2));
        console.log(`Match lookup saved to: ${lookupPath}`);
        
        return this.matches.length > 0;
    }

    // Get cache key for factor evaluation
    getCacheKey(matchId, factorGroup, factorName) {
        return `${matchId}_${factorGroup}_${factorName}`;
    }

    // Evaluate factor against match with caching
    evaluateFactor(factor, match, factorGroup, factorName) {
        const cacheKey = this.getCacheKey(match.matchId, factorGroup, factorName);
        
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

    // Calculate results for a specific combination (optimized)
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
            bets: [] // Just store match IDs and bet details
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

                // Record the bet (optimized - just IDs and key info)
                const bet = {
                    matchId: match.matchId, // Just reference the ID
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
                console.warn(`Error calculating bet result for match ${match.matchId}:`, error.message);
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

    // Initialize JSONL output files
    initializeOutputFile() {
        // Create metadata file
        const metadata = {
            totalCombinations: this.totalCombinations,
            generatedAt: new Date().toISOString(),
            totalMatches: this.matches.length,
            uniqueMatches: Object.keys(this.matchLookup).length,
            description: "Complete pattern discovery results in JSONL format with optimized match ID references",
            status: "in_progress",
            format: "JSONL - each line is a JSON strategy object",
            outputFile: path.basename(this.outputFile),
            totalStrategies: 0
        };
        
        fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
        
        // Create empty JSONL file
        fs.writeFileSync(this.outputFile, '');
        
        console.log(`Initialized JSONL output: ${this.outputFile}`);
        console.log(`Initialized metadata: ${this.metadataFile}`);
        
        this.totalStrategiesWritten = 0;
    }

    // Append batch to JSONL file (SUPER FAST - no reading!)
    appendBatch() {
        if (this.resultsBatch.length === 0) return;
        
        // Convert each strategy to a JSON line
        const jsonLines = this.resultsBatch.map(strategy => JSON.stringify(strategy)).join('\n') + '\n';
        
        // Append to file (no reading required!)
        fs.appendFileSync(this.outputFile, jsonLines);
        
        this.totalStrategiesWritten += this.resultsBatch.length;
        console.log(`Appended ${this.resultsBatch.length} strategies. Total: ${this.totalStrategiesWritten}`);
        
        // Update metadata periodically (every 10 batches = 50k strategies)
        if (this.totalStrategiesWritten % 50000 === 0) {
            this.updateMetadata();
        }
        
        // Clear batch
        this.resultsBatch = [];
    }

    // Update metadata file
    updateMetadata() {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        metadata.totalStrategies = this.totalStrategiesWritten;
        metadata.lastUpdated = new Date().toISOString();
        fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
    }

    // Finalize output files
    finalizeOutputFile() {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        metadata.status = "complete";
        metadata.completedAt = new Date().toISOString();
        metadata.totalStrategies = this.totalStrategiesWritten;
        
        fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
        console.log(`Finalized JSONL file with ${this.totalStrategiesWritten} total strategies`);
        console.log(`JSONL file: ${this.outputFile}`);
        console.log(`Metadata file: ${this.metadataFile}`);
    }

    // Generate all possible combinations (same as before)
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

    // Process all combinations and write results (optimized)
    async processCombinations() {
        console.log('Generating combinations...');
        const combinations = this.generateCombinations();
        
        // Initialize output file
        this.initializeOutputFile();
        
        console.log('Processing combinations...');
        
        for (let i = 0; i < combinations.length; i++) {
            const combination = combinations[i];
            
            // Calculate results for this combination
            const results = this.calculateCombinationResults(combination);
            
            // Only save results with at least some data
            if (results.totalBets >= 0) { // Changed from > 0 to >= 0 as requested
                this.resultsBatch.push(results);
            }
            
            this.processedCount++;
            
            // Write batch when it reaches batch size
            if (this.resultsBatch.length >= this.batchSize) {
                this.appendBatch();
            }
            
            // Progress update
            if (this.processedCount % 5000 === 0 || this.processedCount === combinations.length) {
                const progress = ((this.processedCount / combinations.length) * 100).toFixed(1);
                console.log(`Processed ${this.processedCount}/${combinations.length} combinations (${progress}%)`);
                
                // Force garbage collection hint every 25k processed
                if (this.processedCount % 25000 === 0 && global.gc) {
                    global.gc();
                }
            }
        }
        
        // Write final batch
        if (this.resultsBatch.length > 0) {
            this.appendBatch();
        }
        
        // Finalize the output file
        this.finalizeOutputFile();
        
        console.log('Pattern discovery complete!');
        console.log(`Results saved in JSONL format: ${this.outputFile}`);
        console.log(`Metadata saved: ${this.metadataFile}`);
    }

    // Main execution
    async run() {
        console.log('=== Pattern Discovery Engine V2 Starting ===');
        
        if (!this.loadData()) {
            console.error('Failed to load data');
            return;
        }
        
        await this.processCombinations();
        
        console.log('=== Pattern Discovery Engine V2 Complete ===');
    }
}

// Run if called directly
if (require.main === module) {
    const engine = new PatternDiscoveryEngineV2();
    engine.run().catch(console.error);
}

module.exports = PatternDiscoveryEngineV2; 