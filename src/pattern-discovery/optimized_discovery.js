#!/usr/bin/env node

// Ultra-Optimized Pattern Discovery - Can handle 6-factor combinations
// Key optimizations: smart filtering, batch processing, early termination

const fs = require('fs');
const path = require('path');
const factorDefinitions = require('./factor_definitions');
const AsianHandicapCalculator = require('../utils/AsianHandicapCalculator');

class OptimizedDiscovery {
    constructor() {
        this.matchData = [];
        this.allFactors = [];
        this.minSampleSize = 20; // Skip combinations with < 20 matches
        this.minFactorMatches = 30; // Only use factors with >= 30 matches for large combinations
        this.batchSize = 5000; // Process combinations in batches
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
                
                const homeResult = this.createBettingResult(match, 'home');
                const awayResult = this.createBettingResult(match, 'away');
                
                return {
                    ...match,
                    _context: context,
                    _homeResult: homeResult,
                    _awayResult: awayResult
                };
            });
            
            console.log(`Loaded ${this.matchData.length} valid matches`);
            
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
                    
                    // OPTIMIZATION 1: Filter out factors with too few matches for large combinations
                    this.optionalFactors.push(factorObj);
                });
            }
        });
        
        // OPTIMIZATION 2: Sort optional factors by number of matches (descending)
        this.optionalFactors.sort((a, b) => b.matchingIndices.size - a.matchingIndices.size);
        
        console.log(`Found ${this.optionalFactors.length} optional factors:`);
        this.optionalFactors.slice(0, 10).forEach(f => {
            console.log(`  - ${f.key}: ${f.matchingIndices.size} matches`);
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

    // OPTIMIZATION 3: Smart factor filtering based on combination size
    getFilteredOptionalFactors(combinationSize) {
        if (combinationSize <= 4) {
            return this.optionalFactors; // Use all factors for small combinations
        } else {
            // For large combinations, only use factors with sufficient matches
            const minMatches = combinationSize >= 6 ? this.minFactorMatches : 20;
            return this.optionalFactors.filter(f => f.matchingIndices.size >= minMatches);
        }
    }

    // OPTIMIZATION 4: Early termination in combination generation
    generateCombinationsOptimized(size) {
        if (size < 2) {
            console.warn(`Minimum combination size is 2. Requested: ${size}`);
            return [];
        }
        
        const remainingSlots = size - 2;
        const filteredOptionalFactors = this.getFilteredOptionalFactors(size);
        
        console.log(`Using ${filteredOptionalFactors.length} filtered optional factors for ${size}-factor combinations`);
        
        // Estimate combination count
        const estimate = this.estimateCombinationCount(remainingSlots, filteredOptionalFactors.length);
        console.log(`Estimated combinations: ${estimate.toLocaleString()}`);
        
        if (estimate > 100000) {
            console.warn(`⚠️  Large combination count detected. Processing in batches...`);
        }
        
        const combinations = [];
        let generatedCount = 0;
        
        for (const betSideFactor of this.mandatoryFactors.side) {
            for (const stakingFactor of this.mandatoryFactors.size) {
                if (remainingSlots === 0) {
                    const combination = this.createCombinationOptimized([betSideFactor, stakingFactor], size);
                    if (combination && combination.matchingIndices.size >= this.minSampleSize) {
                        combinations.push(combination);
                    }
                } else {
                    this.generateOptionalCombinationsOptimized(
                        [betSideFactor, stakingFactor], 
                        remainingSlots, 
                        0, 
                        [], 
                        size, 
                        combinations,
                        filteredOptionalFactors
                    );
                }
                
                generatedCount++;
                if (generatedCount % 100 === 0 && combinations.length > 0) {
                    console.log(`Generated ${combinations.length} valid combinations so far...`);
                }
            }
        }
        
        return combinations;
    }

    generateOptionalCombinationsOptimized(mandatoryFactors, remainingSlots, startIndex, currentOptional, totalSize, combinations, filteredFactors) {
        if (remainingSlots === 0) {
            const allFactors = [...mandatoryFactors, ...currentOptional];
            const combination = this.createCombinationOptimized(allFactors, totalSize);
            
            // OPTIMIZATION 5: Early termination - skip combinations with too few matches
            if (combination && combination.matchingIndices.size >= this.minSampleSize) {
                combinations.push(combination);
            }
            return;
        }
        
        for (let i = startIndex; i < filteredFactors.length; i++) {
            // OPTIMIZATION 6: Pruning - estimate if remaining combination will have enough matches
            const currentIntersection = this.estimateIntersectionSize(mandatoryFactors, [...currentOptional, filteredFactors[i]]);
            if (currentIntersection < this.minSampleSize) {
                continue; // Skip this branch
            }
            
            currentOptional.push(filteredFactors[i]);
            this.generateOptionalCombinationsOptimized(
                mandatoryFactors, 
                remainingSlots - 1, 
                i + 1, 
                currentOptional, 
                totalSize, 
                combinations,
                filteredFactors
            );
            currentOptional.pop();
        }
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

    // Estimate intersection size for pruning
    estimateIntersectionSize(mandatoryFactors, optionalFactors) {
        let size = this.matchData.length;
        for (const factor of [...mandatoryFactors, ...optionalFactors]) {
            size = Math.min(size, factor.matchingIndices.size);
        }
        return size * 0.5; // Conservative estimate
    }

    createCombinationOptimized(factors, size) {
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
        
        // Calculate intersection (optimized)
        let matchingIndices = null;
        for (const factor of factors) {
            if (matchingIndices === null) {
                matchingIndices = new Set(factor.matchingIndices);
            } else {
                matchingIndices = new Set([...matchingIndices].filter(i => factor.matchingIndices.has(i)));
                // Early termination if intersection becomes too small
                if (matchingIndices.size < this.minSampleSize) {
                    return null;
                }
            }
        }
        
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

    testCombination(combination) {
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

    createBettingResult(match, betSide) {
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
        
        const stake = 100;
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

    // NEW: Create betting result with calculated stake
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
        
        const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
        const winRate = (wins / bettingRecords.length) * 100;
        const averageOdds = totalOdds / bettingRecords.length;
        const averageStake = totalStake / bettingRecords.length;
        
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
            winRate: Math.round(winRate * 100) / 100,
            totalStake: totalStake,
            totalPayout: Math.round(totalPayout * 100) / 100,
            totalProfit: Math.round(totalProfit * 100) / 100,
            roi: Math.round(roi * 100) / 100,
            averageOdds: Math.round(averageOdds * 100) / 100,
            averageStake: Math.round(averageStake * 100) / 100
        };
    }

    // OPTIMIZATION 7: Batch processing for memory management
    async processInBatches(combinations, batchSize = 5000) {
        const results = [];
        
        for (let i = 0; i < combinations.length; i += batchSize) {
            const batch = combinations.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(combinations.length/batchSize)} (${batch.length} combinations)...`);
            
            const batchResults = batch.map(combination => this.testCombination(combination));
            results.push(...batchResults);
            
            // Optional: Save intermediate results
            if (results.length % 10000 === 0) {
                console.log(`Processed ${results.length} combinations so far...`);
            }
        }
        
        return results;
    }
}

// CLI usage
async function main() {
    console.log('🚀 Running ULTRA-OPTIMIZED pattern discovery (up to 6 factors)...\n');
    
    const discovery = new OptimizedDiscovery();
    discovery.flattenFactors();
    
    const allResults = [];
    
    for (let factorSize = 2; factorSize <= 6; factorSize++) {
        console.log(`\n🧪 Testing ${factorSize}-factor combinations (OPTIMIZED)`);
        const startTime = Date.now();
        
        const combinations = discovery.generateCombinationsOptimized(factorSize);
        console.log(`Generated ${combinations.length} valid combinations`);
        
        if (combinations.length === 0) {
            console.log(`No valid combinations at ${factorSize} factors - stopping`);
            break;
        }
        
        const results = await discovery.processInBatches(combinations, discovery.batchSize);
        allResults.push(...results);
        
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`✅ Completed ${factorSize}-factor combinations in ${elapsed.toFixed(1)}s`);
        
        // Show top results for this size
        const sizeResults = results.filter(r => r.bets >= discovery.minSampleSize);
        sizeResults.sort((a, b) => b.roi - a.roi);
        if (sizeResults.length > 0) {
            console.log(`   Best ${factorSize}-factor ROI: ${sizeResults[0].roi}% (${sizeResults[0].bets} bets, avg $${sizeResults[0].averageStake} stake)`);
        }
    }
    
    // Sort all results by ROI
    allResults.sort((a, b) => b.roi - a.roi);
    
    // Save results
    const fileName = `optimized_discovery.json`;
    const filePath = path.join(__dirname, 'results', fileName);
    fs.writeFileSync(filePath, JSON.stringify(allResults, null, 2));
    
    // Summary
    const profitable = allResults.filter(r => r.roi > 0 && r.bets >= discovery.minSampleSize);
    
    console.log(`\n📊 OPTIMIZED DISCOVERY RESULTS:`);
    console.log(`   Total combinations tested: ${allResults.length}`);
    console.log(`   Profitable patterns (ROI > 0%, bets >= ${discovery.minSampleSize}): ${profitable.length}`);
    console.log(`   Best ROI: ${allResults[0]?.roi || 0}%`);
    console.log(`   Results saved: ${fileName}`);
    
    if (profitable.length > 0) {
        console.log(`\n🏆 TOP 10 OPTIMIZED PATTERNS (with dynamic staking):`);
        profitable.slice(0, 10).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name}: ${p.roi}% ROI (${p.bets} bets, avg $${p.averageStake} stake, ${p.size} factors)`);
        });
    }
}

if (require.main === module) {
    main();
}

module.exports = OptimizedDiscovery; 