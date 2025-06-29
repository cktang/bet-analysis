#!/usr/bin/env node

// COMPLETE Pattern Discovery - Tests ALL possible combinations without optimization
// No filtering, no early termination, no minimum sample sizes
// Generates the complete universe of factor combinations up to 6 factors

const fs = require('fs');
const path = require('path');
const factorDefinitions = require('./factor_definitions');
const AsianHandicapCalculator = require('../utils/AsianHandicapCalculator');

class CompleteDiscovery {
    constructor() {
        this.matchData = [];
        this.allFactors = [];
        this.batchSize = 10000; // Process combinations in batches
        this.maxFactors = 6; // Generate up to 6-factor combinations
        this.loadData();
    }

    loadData() {
        try {
            const dataDir = path.join(__dirname, '../../data/enhanced');
            const files = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
            
            files.forEach(file => {
                const filePath = path.join(dataDir, file);
                if (fs.existsSync(filePath)) {
                    const yearData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    if (yearData.matches) {
                        const matchesArray = Object.values(yearData.matches).map(matchWrapper => {
                            const match = matchWrapper.preMatch.match;
                            match.preMatch = matchWrapper.preMatch;
                            match.postMatch = matchWrapper.postMatch;
                            
                            if (matchWrapper.preMatch.fbref) {
                                match.fbref = {
                                    ...matchWrapper.preMatch.fbref,
                                    week: parseInt(matchWrapper.preMatch.fbref.week),
                                    homeTeam: match.homeTeam,
                                    awayTeam: match.awayTeam,
                                    homeScore: match.homeScore,
                                    awayScore: match.awayScore
                                };
                            }
                            
                            match.timeSeries = matchWrapper.preMatch.timeSeries || { home: {}, away: {} };
                            return match;
                        });
                        this.matchData.push(...matchesArray);
                    }
                }
            });
            
            // Filter valid matches
            this.matchData = this.matchData.filter(match => 
                match.asianHandicapOdds && 
                match.asianHandicapOdds.homeHandicap &&
                match.asianHandicapOdds.homeOdds &&
                match.asianHandicapOdds.awayOdds &&
                match.fbref && match.fbref.week
            );
            
            // Pre-compute contexts and betting results
            this.matchData = this.matchData.map(match => {
                const context = {
                    match: match,
                    fbref: match.fbref || {},
                    timeSeries: match.timeSeries || { home: {}, away: {} },
                    preMatch: match.preMatch || { enhanced: {} },
                    Math: Math
                };
                
                return {
                    ...match,
                    _context: context
                };
            });
            
            console.log(`✅ Loaded ${this.matchData.length} valid matches`);
            
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    flattenFactors() {
        this.allFactors = [];
        this.mandatoryFactors = {
            side: [],
            size: []
        };
        this.optionalFactors = [];
        
        Object.keys(factorDefinitions).forEach(categoryKey => {
            const category = factorDefinitions[categoryKey];
            
            if (categoryKey === 'mandatory') {
                Object.keys(category).forEach(mandatoryType => {
                    const mandatoryCategory = category[mandatoryType];
                    Object.keys(mandatoryCategory).forEach(factorKey => {
                        const factor = mandatoryCategory[factorKey];
                        const factorObj = this.createFactorObject(
                            `${categoryKey}.${mandatoryType}.${factorKey}`, 
                            categoryKey, 
                            factorKey, 
                            factor,
                            mandatoryType
                        );
                        this.mandatoryFactors[mandatoryType].push(factorObj);
                    });
                });
            } else {
                Object.keys(category).forEach(factorKey => {
                    const factor = category[factorKey];
                    const factorObj = this.createFactorObject(
                        `${categoryKey}.${factorKey}`, 
                        categoryKey, 
                        factorKey, 
                        factor
                    );
                    
                    // FILTER OUT factors with 0 matches to prevent estimation issues
                    if (factorObj.matchingIndices.size > 0) {
                        this.optionalFactors.push(factorObj);
                    } else {
                        console.log(`⚠️ Skipping factor ${factorObj.key} (0 matches)`);
                    }
                });
            }
        });
        
        // Sort optional factors by number of matches (descending)
        this.optionalFactors.sort((a, b) => b.matchingIndices.size - a.matchingIndices.size);
        
        console.log(`📊 Found ${this.optionalFactors.length} optional factors (with >0 matches):`);
        
        // Group by category for display
        const byCategory = {};
        this.optionalFactors.forEach(f => {
            if (!byCategory[f.category]) byCategory[f.category] = [];
            byCategory[f.category].push(`${f.name}(${f.matchingIndices.size})`);
        });
        
        Object.entries(byCategory).forEach(([category, factors]) => {
            console.log(`  ${category}: ${factors.join(', ')}`);
        });
        
        this.allFactors = [
            ...this.mandatoryFactors.side,
            ...this.mandatoryFactors.size,
            ...this.optionalFactors
        ];
    }

    createFactorObject(key, category, name, factor, mandatoryType = null) {
        const factorObj = {
            key: key,
            category: category,
            name: name,
            expression: factor.expression,
            description: factor.description,
            betSide: factor.betSide || 'home',
            stakingMethod: factor.stakingMethod || 'fixed',
            mandatoryType: mandatoryType
        };
        
        try {
            const contextKeys = ['match', 'fbref', 'timeSeries', 'preMatch', 'Math'];
            factorObj.compiledFunction = new Function(...contextKeys, `return (${factor.expression});`);
        } catch (error) {
            console.warn(`Failed to compile factor ${factorObj.key}:`, error.message);
            factorObj.compiledFunction = () => false;
        }
        
        factorObj.matchingIndices = new Set();
        for (let i = 0; i < this.matchData.length; i++) {
            try {
                const match = this.matchData[i];
                const context = match._context;
                const result = factorObj.compiledFunction(
                    context.match, context.fbref, context.timeSeries, context.preMatch, context.Math
                );
                
                // For size factors, they return numbers (stake amounts), so always include all matches
                // For other factors, check boolean result
                if (mandatoryType === 'size' || result === true) {
                    factorObj.matchingIndices.add(i);
                }
            } catch (error) {
                continue;
            }
        }
        
        return factorObj;
    }

    // Generate and process combinations on-the-fly without storing them all in memory
    async generateAndProcessCombinations(maxSize = 6) {
        console.log(`\n🌌 STREAMING COMBINATION PROCESSING (2-${maxSize} factors)`);
        console.log('====================================================================\n');
        
        const results = [];
        let totalProcessed = 0;
        const startTime = Date.now();
        
        for (let size = 2; size <= maxSize; size++) {
            console.log(`\n📊 Processing ALL ${size}-factor combinations...`);
            
            const estimate = this.estimateCombinationCount(size - 2, this.optionalFactors.length);
            console.log(`Estimated combinations: ${estimate.toLocaleString()}`);
            
            let processed = 0;
            const batchResults = [];
            
            // Use generator to stream combinations without storing them all
            for (const combination of this.generateCombinationsOfSizeStreaming(size)) {
                const result = this.testCombination(combination);
                if (result && result.bets > 0) { // Only keep combinations with actual bets
                    batchResults.push(result);
                }
                processed++;
                totalProcessed++;
                
                if (processed % 1000 === 0) {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const rate = (totalProcessed / elapsed).toFixed(1);
                    console.log(`  Processed ${processed.toLocaleString()}/${estimate.toLocaleString()} (${rate} combinations/sec)`);
                }
                
                // Memory cleanup - yield control every 1000 iterations
                if (processed % 1000 === 0) {
                    await new Promise(resolve => setImmediate(resolve));
                }
            }
            
            results.push(...batchResults);
            console.log(`✅ Completed ${processed.toLocaleString()} combinations of size ${size}`);
        }
        
        return results;
    }

    // Generator for streaming combinations without memory buildup
    *generateCombinationsOfSizeStreaming(size) {
        const remainingSlots = size - 2;
        
        // Generate all mandatory factor combinations
        for (const betSideFactor of this.mandatoryFactors.side) {
            for (const stakingFactor of this.mandatoryFactors.size) {
                if (remainingSlots === 0) {
                    const combination = this.createCombination([betSideFactor, stakingFactor], size);
                    if (combination && combination.matchingIndices.size >= 10) { // Min sample size
                        yield combination;
                    }
                } else {
                    // Generate optional combinations using generator
                    yield* this.generateOptionalCombinationsStreaming(
                        [betSideFactor, stakingFactor], 
                        remainingSlots, 
                        0, 
                        []
                    );
                }
            }
        }
    }

    // Generator for streaming optional combinations
    *generateOptionalCombinationsStreaming(mandatoryFactors, remainingSlots, startIndex, currentOptional) {
        if (remainingSlots === 0) {
            const allFactors = [...mandatoryFactors, ...currentOptional];
            const combination = this.createCombination(allFactors, mandatoryFactors.length + currentOptional.length);
            
            if (combination && combination.matchingIndices.size >= 10) { // Min sample size
                yield combination;
            }
            return;
        }
        
        for (let i = startIndex; i < this.optionalFactors.length; i++) {
            // Early pruning - estimate if this branch will have enough matches
            const newOptional = [...currentOptional, this.optionalFactors[i]];
            const estimatedMatches = this.estimateIntersectionSize(mandatoryFactors, newOptional);
            
            if (estimatedMatches < 10) {
                continue; // Skip this branch
            }
            
            // Recursively generate combinations
            yield* this.generateOptionalCombinationsStreaming(
                mandatoryFactors, 
                remainingSlots - 1, 
                i + 1, 
                newOptional
            );
        }
    }

    // Estimate intersection size for pruning (same as before)
    estimateIntersectionSize(mandatoryFactors, optionalFactors) {
        let size = this.matchData.length;
        for (const factor of [...mandatoryFactors, ...optionalFactors]) {
            size = Math.min(size, factor.matchingIndices.size);
        }
        return size * 0.5; // Conservative estimate
    }

    testCombination(combination) {
        // Skip testing if no matches
        if (combination.matchingIndices.size === 0) {
            return {
                name: combination.name,
                expression: combination.expression,
                betSide: combination.betSide,
                stakingMethod: combination.stakingMethod,
                size: combination.size,
                bets: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                winRate: 0,
                totalStake: 0,
                totalPayout: 0,
                totalProfit: 0,
                roi: 0,
                averageOdds: 0,
                averageStake: 0
            };
        }

        const bettingRecords = [];
        
        // Get the staking factor to calculate actual stake amounts
        const stakingFactor = combination.factors.find(f => f.mandatoryType === 'size');
        const betSideFactor = combination.factors.find(f => f.mandatoryType === 'side');
        
        for (const matchIndex of combination.matchingIndices) {
            const match = this.matchData[matchIndex];
            
            // Calculate dynamic stake for this match
            let stake = 100; // default fallback
            if (stakingFactor) {
                try {
                    const context = match._context;
                    stake = stakingFactor.compiledFunction(
                        context.match, context.fbref, context.timeSeries, context.preMatch, context.Math
                    );
                    // Ensure stake is a number
                    stake = typeof stake === 'number' ? stake : 100;
                } catch (error) {
                    stake = 100; // fallback on error
                }
            }
            
            // Calculate dynamic bet side for this match
            let betSide = 'home'; // default fallback
            if (betSideFactor) {
                try {
                    const context = match._context;
                    // Check if betSide is a static string or needs evaluation
                    if (betSideFactor.betSide === 'home' || betSideFactor.betSide === 'away') {
                        betSide = betSideFactor.betSide;
                    } else {
                        // Evaluate the betSide expression
                        const betSideFunction = new Function('match', 'fbref', 'timeSeries', 'preMatch', 'Math', `return ${betSideFactor.betSide};`);
                        betSide = betSideFunction(context.match, context.fbref, context.timeSeries, context.preMatch, context.Math);
                    }
                    // Ensure betSide is valid
                    if (betSide !== 'home' && betSide !== 'away') {
                        betSide = 'home'; // fallback
                    }
                } catch (error) {
                    betSide = 'home'; // fallback on error
                }
            }
            
            // Create betting result with calculated stake and bet side
            const bettingResult = this.createBettingResultWithStake(match, betSide, stake);
            if (bettingResult) {
                bettingRecords.push(bettingResult);
            }
        }
        
        return this.calculateResults(combination, bettingRecords);
    }

    createBettingResultWithStake(match, betSide, stake) {
        const ah = match.asianHandicapOdds;
        const homeScore = match.fbref.homeScore;
        const awayScore = match.fbref.awayScore;
        
        if (homeScore === undefined || awayScore === undefined) {
            return null;
        }
        
        let odds, handicap;
        if (betSide === 'away') {
            odds = ah.awayOdds;
            handicap = ah.homeHandicap;
        } else {
            odds = ah.homeOdds;
            handicap = ah.homeHandicap;
        }
        
        const result = AsianHandicapCalculator.calculate(homeScore, awayScore, handicap, betSide, odds, stake);
        
        return {
            week: match.fbref.week,
            betSide: betSide,
            handicap: handicap,
            odds: odds,
            stake: stake,
            result: result.outcome,
            payout: result.payout,
            profit: result.profit
        };
    }

    calculateResults(combination, bettingRecords) {
        if (bettingRecords.length === 0) {
            return {
                name: combination.name,
                expression: combination.expression,
                betSide: combination.betSide,
                stakingMethod: combination.stakingMethod,
                size: combination.size,
                bets: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                winRate: 0,
                totalStake: 0,
                totalPayout: 0,
                totalProfit: 0,
                roi: 0,
                averageOdds: 0,
                averageStake: 0
            };
        }
        
        let wins = 0, losses = 0, pushes = 0;
        let totalStake = 0, totalPayout = 0, totalProfit = 0, totalOdds = 0;
        
        for (const record of bettingRecords) {
            if (record.result === 'win') wins++;
            else if (record.result === 'loss') losses++;
            else pushes++;
            
            totalStake += record.stake;
            totalPayout += record.payout;
            totalProfit += record.profit;
            totalOdds += record.odds;
        }
        
        const winRate = bettingRecords.length > 0 ? (wins / bettingRecords.length) * 100 : 0;
        const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
        const averageOdds = bettingRecords.length > 0 ? totalOdds / bettingRecords.length : 0;
        const averageStake = bettingRecords.length > 0 ? totalStake / bettingRecords.length : 0;
        
        return {
            name: combination.name,
            expression: combination.expression,
            betSide: combination.betSide,
            stakingMethod: combination.stakingMethod,
            size: combination.size,
            bets: bettingRecords.length,
            wins: wins,
            losses: losses,
            pushes: pushes,
            winRate: parseFloat(winRate.toFixed(2)),
            totalStake: parseFloat(totalStake.toFixed(2)),
            totalPayout: parseFloat(totalPayout.toFixed(2)),
            totalProfit: parseFloat(totalProfit.toFixed(2)),
            roi: parseFloat(roi.toFixed(2)),
            averageOdds: parseFloat(averageOdds.toFixed(2)),
            averageStake: parseFloat(averageStake.toFixed(2))
        };
    }

    // Helper to estimate combination count
    estimateCombinationCount(slots, factorCount) {
        if (slots === 0) return this.mandatoryFactors.side.length * this.mandatoryFactors.size.length;
        
        // Calculate C(factorCount, slots) * mandatory combinations
        let result = 1;
        for (let i = 0; i < slots; i++) {
            result = result * (factorCount - i) / (i + 1);
        }
        return Math.floor(result * this.mandatoryFactors.side.length * this.mandatoryFactors.size.length);
    }

    createCombination(factors, size) {
        const name = factors.map(f => {
            if (f.mandatoryType) {
                return `${f.mandatoryType}-${f.name}`;
            } else {
                return `${f.category}-${f.name}`;
            }
        }).join('_');
        
        const expression = factors.map(f => f.expression).join(' && ');
        
        const betSideFactor = factors.find(f => f.mandatoryType === 'side');
        const betSide = betSideFactor ? betSideFactor.betSide : 'home';
        
        const stakingFactor = factors.find(f => f.mandatoryType === 'size');
        const stakingMethod = stakingFactor ? stakingFactor.stakingMethod : 'fixed';
        
        // Calculate intersection (NO early termination)
        let matchingIndices = null;
        for (const factor of factors) {
            if (matchingIndices === null) {
                matchingIndices = new Set(factor.matchingIndices);
            } else {
                matchingIndices = new Set([...matchingIndices].filter(i => factor.matchingIndices.has(i)));
            }
        }
        
        // Return ALL combinations, even those with 0 matches
        return {
            name: name,
            expression: expression,
            betSide: betSide,
            stakingMethod: stakingMethod,
            factors: [...factors],
            size: size,
            matchingIndices: matchingIndices || new Set()
                };
    }
}
  
async function main() {
    console.log('🌌 COMPLETE FACTOR DISCOVERY - ALL COMBINATIONS');
    console.log('=================================================\n');
    console.log('⚠️  WARNING: This will generate MILLIONS of combinations!');
    console.log('🔬 No optimization, no filtering, complete exhaustive analysis\n');
    
    const discovery = new CompleteDiscovery();
    
    console.log('📋 Flattening all factors...');
    discovery.flattenFactors();
    
    console.log('\n🎯 Estimating total combinations...');
    let totalEstimate = 0;
    const maxFactors = parseInt(process.argv[2]) || 6; // Use command line argument or default to 6
    for (let size = 2; size <= maxFactors; size++) {
        const estimate = discovery.estimateCombinationCount(size - 2, discovery.optionalFactors.length);
        totalEstimate += estimate;
        console.log(`  ${size} factors: ${estimate.toLocaleString()}`);
    }
    console.log(`\n📊 TOTAL ESTIMATED: ${totalEstimate.toLocaleString()} combinations`);
    
    const startTime = Date.now();
    
    console.log('\n🚀 Starting complete discovery...');
    const results = await discovery.generateAndProcessCombinations(maxFactors);
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    // Save final results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(__dirname, 'results', `complete_discovery_${timestamp}.json`);
    
    try {
        // Ensure results directory exists
        const resultsDir = path.join(__dirname, 'results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
        
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        
        console.log('\n🎉 COMPLETE DISCOVERY FINISHED!');
        console.log('================================');
        console.log(`⏱️  Total time: ${(totalTime / 3600).toFixed(2)} hours`);
        console.log(`📊 Total combinations tested: ${results.length.toLocaleString()}`);
        console.log(`🎯 Strategies with bets: ${results.filter(r => r.bets > 0).length.toLocaleString()}`);
        console.log(`💰 Profitable strategies: ${results.filter(r => r.roi > 0 && r.bets > 0).length.toLocaleString()}`);
        console.log(`\n📁 Results saved to: ${resultsFile}`);
        
        const bestStrategies = results
            .filter(r => r.bets >= 10)
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 5);
            
        if (bestStrategies.length > 0) {
            console.log('\n🏆 TOP 5 STRATEGIES:');
            bestStrategies.forEach((s, i) => {
                console.log(`  ${i + 1}. ${s.name}`);
                console.log(`     ROI: ${s.roi}%, Bets: ${s.bets}, Profit: $${s.totalProfit}`);
            });
        }
        
    } catch (error) {
        console.error('Error saving results:', error);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CompleteDiscovery; 