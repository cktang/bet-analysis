#!/usr/bin/env node

// Simple Pattern Discovery - Clean, straightforward approach
// Tests 1-4 factor combinations exhaustively

const fs = require('fs');
const path = require('path');
const factorDefinitions = require('./factor_definitions');
const AsianHandicapCalculator = require('../utils/AsianHandicapCalculator');

class SimpleDiscovery {
    constructor() {
        this.matchData = [];
        this.allFactors = [];
        this.compiledFactors = new Map(); // Cache compiled functions
        this.loadData();
    }

    // Load match data
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
            
            // Filter valid matches and pre-compute contexts
            this.matchData = this.matchData.filter(match => 
                match.asianHandicapOdds && 
                match.asianHandicapOdds.homeHandicap &&
                match.asianHandicapOdds.homeOdds &&
                match.asianHandicapOdds.awayOdds &&
                match.fbref && match.fbref.week
            );
            
            // Pre-compute evaluation context AND betting results for each match (major optimization)
            this.matchData = this.matchData.map(match => {
                const context = {
                    match: match,
                    fbref: match.fbref || {},
                    timeSeries: match.timeSeries || { home: {}, away: {} },
                    preMatch: match.preMatch || { enhanced: {} },
                    Math: Math
                };
                
                // Pre-calculate home and away betting results (huge optimization)
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

    // Flatten factors and pre-calculate which matches satisfy each factor
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
                // Handle mandatory factors separately
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
                // Handle optional factors
                Object.keys(category).forEach(factorKey => {
                    const factor = category[factorKey];
                    const factorObj = this.createFactorObject(
                        `${categoryKey}.${factorKey}`, 
                        categoryKey, 
                        factorKey, 
                        factor
                    );
                    this.optionalFactors.push(factorObj);
                });
            }
        });
        
        // Combine all factors for total count
        this.allFactors = [
            ...this.mandatoryFactors.side,
            ...this.mandatoryFactors.size,
            ...this.optionalFactors
        ];
        
        console.log(`Found ${this.allFactors.length} total factors:`);
        console.log(`  - ${this.mandatoryFactors.side.length} mandatory bet side factors`);
        console.log(`  - ${this.mandatoryFactors.size.length} mandatory staking factors`);
        console.log(`  - ${this.optionalFactors.length} optional factors`);
        console.log(`Pre-calculated factor matches for ${this.matchData.length} matches`);
    }

    // Helper to create factor objects
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
        
        // Pre-compile the expression function
        try {
            const contextKeys = ['match', 'fbref', 'timeSeries', 'preMatch', 'Math'];
            factorObj.compiledFunction = new Function(...contextKeys, `return (${factor.expression});`);
        } catch (error) {
            console.warn(`Failed to compile factor ${factorObj.key}:`, error.message);
            factorObj.compiledFunction = () => false;
        }
        
        // Pre-calculate which matches satisfy this factor (HUGE optimization)
        factorObj.matchingIndices = new Set();
        for (let i = 0; i < this.matchData.length; i++) {
            try {
                const match = this.matchData[i];
                const context = match._context;
                const satisfies = factorObj.compiledFunction(
                    context.match, context.fbref, context.timeSeries, context.preMatch, context.Math
                );
                if (satisfies) {
                    factorObj.matchingIndices.add(i);
                }
            } catch (error) {
                // Skip invalid matches
                continue;
            }
        }
        
        return factorObj;
    }

    // Generate combinations of specific size (with mandatory factors)
    generateCombinations(size) {
        const combinations = [];
        
        // Every combination must have exactly 1 bet side and 1 staking factor
        // So minimum size is 2 (1 bet side + 1 staking)
        if (size < 2) {
            console.warn(`Minimum combination size is 2 (bet side + staking). Requested: ${size}`);
            return [];
        }
        
        const remainingSlots = size - 2; // Reserve 2 slots for mandatory factors
        
        // Generate all combinations with mandatory factors
        for (const betSideFactor of this.mandatoryFactors.side) {
            for (const stakingFactor of this.mandatoryFactors.size) {
                
                // If only mandatory factors needed
                if (remainingSlots === 0) {
                    const combination = this.createCombination([betSideFactor, stakingFactor], size);
                    if (combination) combinations.push(combination);
                } else {
                    // Add optional factors to fill remaining slots
                    this.generateOptionalCombinations(
                        [betSideFactor, stakingFactor], 
                        remainingSlots, 
                        0, 
                        [], 
                        size, 
                        combinations
                    );
                }
            }
        }
        
        return combinations;
    }
    
    // Generate combinations with optional factors
    generateOptionalCombinations(mandatoryFactors, remainingSlots, startIndex, currentOptional, totalSize, combinations) {
        if (remainingSlots === 0) {
            const allFactors = [...mandatoryFactors, ...currentOptional];
            const combination = this.createCombination(allFactors, totalSize);
            if (combination) combinations.push(combination);
            return;
        }
        
        for (let i = startIndex; i < this.optionalFactors.length; i++) {
            currentOptional.push(this.optionalFactors[i]);
            this.generateOptionalCombinations(
                mandatoryFactors, 
                remainingSlots - 1, 
                i + 1, 
                currentOptional, 
                totalSize, 
                combinations
            );
            currentOptional.pop();
        }
    }
    
    // Create combination object
    createCombination(factors, size) {
        const name = factors.map(f => {
            if (f.mandatoryType) {
                return `${f.mandatoryType}-${f.name}`;
            } else {
                return `${f.category}-${f.name}`;
            }
        }).join('_');
        
        const expression = factors.map(f => f.expression).join(' && ');
        
        // Get bet side from mandatory bet side factor
        const betSideFactor = factors.find(f => f.mandatoryType === 'side');
        const betSide = betSideFactor ? betSideFactor.betSide : 'home';
        
        // Get staking method from mandatory staking factor
        const stakingFactor = factors.find(f => f.mandatoryType === 'size');
        const stakingMethod = stakingFactor ? stakingFactor.stakingMethod : 'fixed';
        
        // Pre-calculate which matches satisfy this combination (set intersection)
        let matchingIndices = null;
        for (const factor of factors) {
            if (matchingIndices === null) {
                matchingIndices = new Set(factor.matchingIndices);
            } else {
                // Intersection: keep only matches that satisfy ALL factors
                matchingIndices = new Set([...matchingIndices].filter(i => factor.matchingIndices.has(i)));
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

    // Test a combination (ultra-optimized with pre-calculated matches)
    testCombination(combination) {
        const bettingRecords = [];
        
        // Use pre-calculated matching indices - no expression evaluation needed!
        for (const matchIndex of combination.matchingIndices) {
            const match = this.matchData[matchIndex];
            
            // Use pre-cached betting result based on bet side
            const cachedResult = combination.betSide === 'away' ? match._awayResult : match._homeResult;
            if (cachedResult) {
                bettingRecords.push(cachedResult);
            }
        }
        
        return this.calculateResults(combination, bettingRecords);
    }

    // Create betting result for caching (called once per match per side)
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
            // For away bets, we need to convert home handicap to away handicap notation
            // But the calculator expects home handicap, so we use home handicap directly
            handicap = ah.homeHandicap;
        } else {
            odds = ah.homeOdds;
            handicap = ah.homeHandicap;
        }
        
        const stake = 100;
        // Use the centralized utility for all handicap calculations
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

    // Note: Asian Handicap calculations now handled by AsianHandicapCalculator utility
    // The old buggy methods have been removed to prevent future errors

    // Calculate results (optimized)
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
                averageOdds: 0
            };
        }
        
        let wins = 0, losses = 0, pushes = 0;
        let totalStake = 0, totalPayout = 0, totalProfit = 0, totalOdds = 0;
        
        // Single loop optimization
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
            averageOdds: Math.round(averageOdds * 100) / 100
        };
    }
}

// CLI usage
async function main() {
    console.log('🚀 Running ALL pattern discovery permutations (OPTIMIZED)...\n');
    
    const discovery = new SimpleDiscovery();
    discovery.flattenFactors();
    
    const allResults = [];
    
    // Run all factor sizes from 2 to 6 (memory optimized)
    // Size 2 = mandatory factors only (bet side + staking)
    // Size 3+ = mandatory factors + optional factors (up to 4 optional)
    for (let factorSize = 2; factorSize <= 6; factorSize++) {
        console.log(`\n🧪 Testing ALL ${factorSize}-factor combinations`);
        const startTime = Date.now();
        
        const combinations = discovery.generateCombinations(factorSize);
        console.log(`Generated ${combinations.length} combinations`);
        
        if (combinations.length === 0) {
            console.log(`No more combinations possible at ${factorSize} factors - stopping`);
            break;
        }
        
        for (let i = 0; i < combinations.length; i++) {
            if (i % 1000 === 0) {
                console.log(`Testing ${i + 1}/${combinations.length}...`);
            }
            
            const result = discovery.testCombination(combinations[i]);
            allResults.push(result);
        }
        
        const elapsed = (Date.now() - startTime) / 1000;
        console.log(`✅ Completed ${factorSize}-factor combinations in ${elapsed.toFixed(1)}s`);
    }
    
    // Sort all results by ROI
    allResults.sort((a, b) => b.roi - a.roi);
    
    // Save all results in one file
    const fileName = `complete_discovery.json`;
    const filePath = path.join(__dirname, 'results', fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(allResults, null, 2));
    
    // Summary
    const profitable = allResults.filter(r => r.roi > 0 && r.bets >= 100);
    
    console.log(`\n📊 COMPLETE DISCOVERY RESULTS:`);
    console.log(`   Total combinations tested: ${allResults.length}`);
    console.log(`   Profitable patterns (ROI > 0%, bets >= 100): ${profitable.length}`);
    console.log(`   Best ROI: ${allResults[0]?.roi || 0}%`);
    console.log(`   Results saved: ${fileName}`);
    
    if (profitable.length > 0) {
        console.log(`\n🏆 TOP 10 PATTERNS:`);
        profitable.slice(0, 10).forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.name}: ${p.roi}% ROI (${p.bets} bets)`);
        });
    }
}

if (require.main === module) {
    main();
}

module.exports = SimpleDiscovery; 