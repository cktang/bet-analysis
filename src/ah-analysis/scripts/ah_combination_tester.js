const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class AHCombinationTester {
    constructor() {
        this.dataPath = path.join(__dirname, '../../../data/processed');
        this.combinationsPath = path.join(__dirname, '../../../data/processed/ah_combinations.json');
        this.resultsDir = path.join(__dirname, '..', 'results');
        this.summaryPath = path.join(this.resultsDir, 'summary.json');
        
        // Ensure results directory exists
        if (!fs.existsSync(this.resultsDir)) {
            fs.mkdirSync(this.resultsDir, { recursive: true });
        }
        
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('Loading EPL data from all seasons (enhanced data)...');
        
        // Use enhanced data with new structure
        const enhancedPath = path.join(__dirname, '../../../data/enhanced');
        const seasons = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(enhancedPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.keys(seasonData.matches)
                    .sort() // Deterministic key ordering
                    .map(key => seasonData.matches[key]);
                this.allMatches.push(...matches);
                console.log(`Loaded ${matches.length} matches from ${season}`);
            }
        });

        console.log(`Total matches loaded: ${this.allMatches.length}`);
        
        // Filter matches with required data (new data structure)
        this.allMatches = this.allMatches.filter(match => 
            match.postMatch?.asianHandicapResults &&
            match.preMatch?.match?.asianHandicapOdds &&
            match.preMatch?.match?.homeWinOdds &&
            match.timeSeries?.home && match.timeSeries?.away
        );
        
        console.log(`Matches with complete pre-match and post-match data: ${this.allMatches.length}`);
    }

    evaluateValue(match, factorExpression) {
        try {
            // New data structure context
            const context = {
                // Legacy compatibility (for old factor expressions)
                match: match.preMatch?.match,
                fbref: match.preMatch?.fbref,
                enhanced: match.preMatch?.enhanced,
                timeSeries: match.timeSeries,
                
                // New structure access
                preMatch: match.preMatch,
                postMatch: match.postMatch,
                
                // Utility functions
                parseFloat: parseFloat,
                Math: Math
            };

            return Function('match', 'fbref', 'enhanced', 'timeSeries', 'preMatch', 'postMatch', 'parseFloat', 'Math', 
                `"use strict"; return ${factorExpression}`)(
                context.match, context.fbref, context.enhanced, context.timeSeries,
                context.preMatch, context.postMatch, context.parseFloat, context.Math
            );
        } catch (error) {
            return null;
        }
    }

    calculateCorrelation(x, y) {
        const n = x.length;
        if (n < 2) return 0;

        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
        const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        return denominator === 0 ? 0 : numerator / denominator;
    }

    testCombination(combination) {
        const results = {
            name: combination.name,
            factors: combination.factors,
            type: combination.type,
            hypothesis: combination.hypothesis,
            homeCorrelation: 0,
            awayCorrelation: 0,
            correlation: 0,
            profitability: 0,
            accuracy: 0,
            avgProfitPerBet: 0,
            sampleSize: 0,
            validSamples: 0,
            strategy: null,
            error: null
        };

        try {
            const matchData = [];
            
            // Evaluate each match
            this.allMatches.forEach(match => {
                const factorValues = [];
                let validMatch = true;

                // Calculate all factor values for this match
                combination.factors.forEach(factor => {
                    const value = this.evaluateValue(match, factor);
                    if (value === null || isNaN(value) || !isFinite(value)) {
                        validMatch = false;
                    }
                    factorValues.push(value);
                });

                if (validMatch) {
                    // For single factors, use the value directly
                    // For multiple factors, combine them (sum for now, could be more sophisticated)
                    const combinedValue = factorValues.length === 1 ? 
                        factorValues[0] : 
                        factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;

                    // Calculate profits based on Asian Handicap results with proper quarter handicap handling
                    const ahOdds = match.preMatch?.match?.asianHandicapOdds;
                    const actualResults = match.postMatch?.actualResults;
                    
                    if (ahOdds && actualResults) {
                        // Get actual match score (treat null as 0)
                        const homeScore = actualResults.homeGoals ?? 0;
                        const awayScore = actualResults.awayGoals ?? 0;
                        
                        // Parse handicap lines properly
                        const handicapStr = ahOdds.homeHandicap;
                        let handicapLines = [];
                        
                        if (handicapStr && handicapStr.includes('/')) {
                            // Quarter handicap - split into two half-bets
                            const parts = handicapStr.split('/');
                            handicapLines = [parseFloat(parts[0]), parseFloat(parts[1])];
                        } else if (handicapStr) {
                            // Single handicap
                            handicapLines = [parseFloat(handicapStr)];
                        } else {
                            // No handicap data available, skip this match
                            return results;
                        }
                        
                        // Calculate profits for home and away bets with proper split handling
                        let homeProfit = 0;
                        let awayProfit = 0;
                        const betAmount = 100; // Total bet amount
                        const betPerLine = betAmount / handicapLines.length; // Split bet across lines
                        
                        handicapLines.forEach(handicapLine => {
                            // Home team gets the handicap
                            const adjustedHomeScore = homeScore + handicapLine;
                            const adjustedAwayScore = awayScore;
                            
                            let ahOutcome;
                            if (adjustedHomeScore > adjustedAwayScore) {
                                ahOutcome = 'home';
                            } else if (adjustedHomeScore < adjustedAwayScore) {
                                ahOutcome = 'away';
                            } else {
                                ahOutcome = 'draw';
                            }
                            
                            // Calculate profit/loss for this line
                            if (ahOutcome === 'draw') {
                                // Push - stake returned, no profit/loss for this line
                                // homeProfit += 0;
                                // awayProfit += 0;
                            } else if (ahOutcome === 'home') {
                                homeProfit += (ahOdds.homeOdds - 1) * betPerLine; // Win this portion
                                awayProfit += -betPerLine; // Lose this portion
                            } else if (ahOutcome === 'away') {
                                homeProfit += -betPerLine; // Lose this portion
                                awayProfit += (ahOdds.awayOdds - 1) * betPerLine; // Win this portion
                            }
                        });

                        matchData.push({
                            combinedValue,
                            homeProfit,
                            awayProfit,
                            homeOdds: ahOdds.homeOdds || 0,
                            awayOdds: ahOdds.awayOdds || 0
                        });
                    }
                }
            });

            results.sampleSize = this.allMatches.length;
            results.validSamples = matchData.length;

            if (matchData.length < 10) {
                results.error = 'Insufficient valid samples';
                return results;
            }

            // Calculate correlations
            const combinedValues = matchData.map(d => d.combinedValue);
            const homeProfits = matchData.map(d => d.homeProfit);
            const awayProfits = matchData.map(d => d.awayProfit);

            results.homeCorrelation = this.calculateCorrelation(combinedValues, homeProfits);
            results.awayCorrelation = this.calculateCorrelation(combinedValues, awayProfits);
            results.correlation = Math.max(Math.abs(results.homeCorrelation), Math.abs(results.awayCorrelation));

            // Backtesting strategy
            const strategy = this.backtestStrategy(matchData, combination);
            results.strategy = strategy;
            results.profitability = strategy.profitability;
            results.accuracy = strategy.accuracy;
            results.avgProfitPerBet = strategy.avgProfitPerBet;

        } catch (error) {
            results.error = error.message;
        }

        return results;
    }

    backtestStrategy(matchData, combination) {
        // SELECTIVE BETTING: Only bet on extreme values where signal is strongest
        const values = matchData.map(d => d.combinedValue);
        const sortedValues = [...values].sort((a, b) => a - b);
        
        // Test different threshold percentages and pick the best
        const thresholds = [10, 15, 20, 25, 30];
        let bestStrategy = null;
        let bestProfitability = -Infinity;

        thresholds.forEach(threshold => {
            const topCount = Math.floor(matchData.length * (threshold / 100));
            const bottomCount = Math.floor(matchData.length * (threshold / 100));
            
            // Sort matches by factor value
            const sortedMatches = [...matchData].sort((a, b) => b.combinedValue - a.combinedValue);
            
            // Top X% - bet HOME (factor suggests home advantage)
            const topMatches = sortedMatches.slice(0, topCount);
            // Bottom X% - bet AWAY (factor suggests away advantage)  
            const bottomMatches = sortedMatches.slice(-bottomCount);
            
            let totalBets = topMatches.length + bottomMatches.length;
            if (totalBets === 0) return; // Skip if no bets
            
            let totalReturn = 0;
            let correctPicks = 0;
            let homePicks = topMatches.length;
            let awayPicks = bottomMatches.length;

            // Calculate returns for top matches (bet HOME)
            topMatches.forEach(match => {
                totalReturn += match.homeProfit;
                if (match.homeProfit > 0) correctPicks++;
            });

            // Calculate returns for bottom matches (bet AWAY)
            bottomMatches.forEach(match => {
                totalReturn += match.awayProfit;
                if (match.awayProfit > 0) correctPicks++;
            });

            const totalInvestment = totalBets * 100;
            const profitability = totalReturn / totalInvestment;
            const accuracy = correctPicks / totalBets;
            const selectionRate = (totalBets / matchData.length) * 100;

            const strategy = {
                totalBets,
                correctPicks,
                totalReturn,
                threshold: `${threshold}% (top/bottom)`,
                homePicks,
                awayPicks,
                accuracy,
                profitability,
                avgProfitPerBet: totalReturn / totalBets,
                selectionRate,
                thresholdPercent: threshold
            };

            // Pick strategy with best profitability (with deterministic tie-breaking)
            if (profitability > bestProfitability || 
                (Math.abs(profitability - bestProfitability) < 0.000001 && threshold < (bestStrategy?.thresholdPercent || Infinity))) {
                bestProfitability = profitability;
                bestStrategy = strategy;
            }
        });

        return bestStrategy || {
            totalBets: 0,
            correctPicks: 0,
            totalReturn: 0,
            threshold: "No valid threshold",
            homePicks: 0,
            awayPicks: 0,
            accuracy: 0,
            profitability: 0,
            avgProfitPerBet: 0,
            selectionRate: 0,
            thresholdPercent: 0
        };
    }

    runTests() {
        console.log('Loading combinations to test...');
        
        if (!fs.existsSync(this.combinationsPath)) {
            console.log('No combinations file found. Run ah_combination_generator.js first.');
            return;
        }

        const combinationsData = JSON.parse(fs.readFileSync(this.combinationsPath, 'utf8'));
        const combinations = combinationsData.combinations;

        console.log(`Testing ${combinations.length} combinations...`);

        const results = [];
        const startTime = Date.now();

        combinations.forEach((combination, index) => {
            if (index % 10 === 0) {
                console.log(`Testing combination ${index + 1}/${combinations.length}: ${combination.name}`);
            }

            const result = this.testCombination(combination);
            results.push(result);
            
            // Debug: Log errors for failed strategies to identify patterns
            if (result.error && index < 20) {
                console.log(`❌ ERROR in ${combination.name}:`);
                console.log(`   Factors: ${combination.factors ? combination.factors.join(', ') : 'N/A'}`);
                console.log(`   Error: ${result.error}`);
                console.log('');
            }
        });

        const endTime = Date.now();
        console.log(`Testing completed in ${(endTime - startTime) / 1000}s`);

        // Sort results by correlation strength
        results.sort((a, b) => b.correlation - a.correlation);

        // Analysis summary
        // More permissive filtering - include strategies with minor errors but valid samples
        const validResults = results.filter(r => {
            if (r.validSamples >= 1) {
                // Include if we have valid samples, even with minor errors
                return true;
            }
            if (!r.error) {
                // Include if no error, regardless of sample count
                return true;
            }
            // Only exclude if there's an error AND no valid samples
            return false;
        });
        
        // Debug: Count strategies by error status
        const withErrors = results.filter(r => r.error).length;
        const withoutErrors = results.filter(r => !r.error).length;
        const withValidSamples = results.filter(r => r.validSamples >= 1).length;
        
        // Analyze error types
        const errorTypes = {};
        results.filter(r => r.error).forEach(r => {
            const errorMsg = r.error.substring(0, 50) + '...';
            errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
        });
        
        console.log(`\n📊 Strategy Analysis:`);
        console.log(`  Total tested: ${results.length}`);
        console.log(`  With errors: ${withErrors}`);
        console.log(`  Without errors: ${withoutErrors}`);
        console.log(`  With valid samples (≥1): ${withValidSamples}`);
        console.log(`  Included in valid results: ${validResults.length}`);
        
        console.log(`\n🔍 Error Types:`);
        Object.entries(errorTypes).forEach(([error, count]) => {
            console.log(`  ${count}x: ${error}`);
        });
        
        // Show specific failing strategies
        const failingStrategies = results.filter(r => r.error);
        console.log(`\n❌ Failing Strategies (${failingStrategies.length} total):`);
        failingStrategies.slice(0, 18).forEach((strategy, i) => {
            console.log(`${i+1}. ${strategy.name}`);
            console.log(`   Error: ${strategy.error}`);
            console.log(`   Factors: ${Array.isArray(strategy.factors) ? strategy.factors.join(', ') : strategy.factors}`);
            console.log('');
        });
        const significantResults = validResults.filter(r => Math.abs(r.correlation) > 0.1);
        const profitableResults = validResults.filter(r => r.profitability > 0.02);

        const summary = {
            totalCombinations: combinations.length,
            validResults: validResults.length,
            significantCorrelations: significantResults.length,
            profitableStrategies: profitableResults.length,
            bestCorrelation: validResults.length > 0 ? validResults[0].correlation : 0,
            bestProfitability: Math.max(...validResults.map(r => r.profitability)),
            avgCorrelation: validResults.length > 0 ? 
                validResults.reduce((sum, r) => sum + Math.abs(r.correlation), 0) / validResults.length : 0
        };

        // Save results
        const output = {
            metadata: {
                generatedAt: new Date().toISOString(),
                testDuration: endTime - startTime,
                dataSize: this.allMatches.length
            },
            summary,
            results: results,
            topResults: validResults.slice(0, 20)
        };

        // Update historical results
        let historicalResults = { iterations: [], bestCombinations: [] };
        if (fs.existsSync(this.resultsPath)) {
            historicalResults = JSON.parse(fs.readFileSync(this.resultsPath, 'utf8'));
        }

        historicalResults.iterations.push({
            timestamp: new Date().toISOString(),
            summary,
            results: validResults.slice(0, 50) // Keep top 50 results per iteration
        });

        // Update best combinations across all iterations
        const allHistoricalResults = historicalResults.iterations.flatMap(iter => iter.results);
        historicalResults.bestCombinations = _.uniqBy(
            [...allHistoricalResults, ...validResults]
                .sort((a, b) => b.correlation - a.correlation)
                .slice(0, 100),
            'name'
        );

        // Save consolidated summary to results directory
        this.saveConsolidatedResults(validResults, summary);
        
        // Generate betting records for ALL tested strategies (including 0-bet ones)
        const bettingRecordsResults = this.generateBettingRecords(results);
        
        // Update summary to include ALL strategies regardless of betting record count
        this.updateSummaryWithAllResults(bettingRecordsResults);
        
        console.log('\n=== RESULTS SUMMARY ===');
        console.log(`Total combinations tested: ${summary.totalCombinations}`);
        console.log(`Valid results: ${summary.validResults}/${summary.totalCombinations}`);
        console.log(`Significant correlations (>0.1): ${summary.significantCorrelations}`);
        console.log(`Profitable strategies (>2%): ${summary.profitableStrategies}`);
        console.log(`Best correlation: ${summary.bestCorrelation.toFixed(4)}`);
        console.log(`Best profitability: ${(summary.bestProfitability * 100).toFixed(2)}%`);
        console.log(`Average correlation: ${summary.avgCorrelation.toFixed(4)}`);

        console.log('\n=== TOP 10 COMBINATIONS ===');
        validResults.slice(0, 10).forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            console.log(`   Correlation: ${result.correlation.toFixed(4)}`);
            console.log(`   Profitability: ${(result.profitability * 100).toFixed(2)}%`);
            console.log(`   Valid samples: ${result.validSamples}`);
            console.log(`   Factors: ${result.factors.join(', ')}`);
            console.log('');
        });

        console.log(`Results saved to: ${this.summaryPath}`);
        return output;
    }

    saveConsolidatedResults(validResults, summary) {
        // Load existing summary or create new one
        let existingSummary = { strategies: [], metadata: null };
        if (fs.existsSync(this.summaryPath)) {
            try {
                existingSummary = JSON.parse(fs.readFileSync(this.summaryPath, 'utf8'));
            } catch (e) {
                console.log('Creating new summary file...');
            }
        }

        // Prepare consolidated strategy data
        const strategies = validResults.map(result => ({
            name: result.name,
            roi: `${(result.profitability * 100).toFixed(2)}%`,
            correlation: result.correlation.toFixed(4),
            validSamples: result.validSamples,
            factors: result.factors,
            hypothesis: result.hypothesis || '',
            threshold: result.threshold || 'Dynamic',
            winRate: result.strategy?.accuracy ? `${(result.strategy.accuracy * 100).toFixed(1)}%` : 'N/A',
            totalBets: result.strategy?.totalBets || result.validSamples,
            avgProfitPerBet: result.avgProfitPerBet || 'N/A',
            generatedAt: new Date().toISOString(),
            detailsFile: `${result.name}_betting_records.json`
        }));

        // Update summary
        const consolidatedSummary = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalStrategies: strategies.length,
                profitableStrategies: strategies.filter(s => parseFloat(s.roi) > 0).length,
                bestROI: strategies.length > 0 ? Math.max(...strategies.map(s => parseFloat(s.roi))) : 0,
                bestCorrelation: strategies.length > 0 ? Math.max(...strategies.map(s => parseFloat(s.correlation))) : 0
            },
            summary: summary,
            strategies: strategies
        };

        fs.writeFileSync(this.summaryPath, JSON.stringify(consolidatedSummary, null, 2));
        console.log(`Consolidated summary saved to: ${this.summaryPath}`);
    }

    generateBettingRecords(allStrategies) {
        console.log(`\n📊 Generating betting records for ${allStrategies.length} strategies...`);
        
        // Load combinations again to get additional properties like betSide
        const combinationsData = JSON.parse(fs.readFileSync(this.combinationsPath, 'utf8'));
        const originalCombinations = combinationsData.combinations;
        
        // Create a lookup map for original combinations by name
        const combinationLookup = {};
        originalCombinations.forEach(combo => {
            combinationLookup[combo.name] = combo;
        });

        const processedStrategies = [];
        
        allStrategies.forEach(strategy => {
            try {
                // Get the original combination to preserve properties like betSide
                const originalCombo = combinationLookup[strategy.name];
                
                // Create enhanced strategy object with original properties
                const enhancedStrategy = {
                    ...strategy,
                    betSide: originalCombo?.betSide // Preserve betSide property
                };
                
                const bettingRecords = this.generateStrategyBettingRecords(enhancedStrategy);
                
                const cleanName = strategy.name.replace(/[^a-zA-Z0-9_]/g, '_');
                const recordsPath = path.join(this.resultsDir, `${cleanName}_betting_records.json`);
                
                // Calculate actual ROI from betting records
                const totalProfit = bettingRecords.reduce((sum, bet) => sum + parseFloat(bet.profit || 0), 0);
                const totalBets = bettingRecords.length;
                const totalInvestment = totalBets * 100; // 100 units per bet
                const actualROI = totalBets > 0 ? (totalProfit / totalInvestment * 100).toFixed(2) : '0.00';
                
                const recordsData = {
                    strategy: {
                        name: strategy.name,
                        roi: `${actualROI}%`,
                        correlation: strategy.correlation ? strategy.correlation.toFixed(4) : '0.0000',
                        factors: strategy.factors || [],
                        hypothesis: strategy.hypothesis || '',
                        error: strategy.error || null
                    },
                    summary: {
                        totalBets: bettingRecords.length,
                        totalProfit: totalProfit,
                        winRate: bettingRecords.length > 0 ? 
                            (bettingRecords.filter(bet => bet.outcome === 'Win' || bet.outcome === 'Half Win').length / bettingRecords.length * 100).toFixed(1) + '%' : '0%',
                        generatedAt: new Date().toISOString()
                    },
                    bettingRecords: bettingRecords
                };
                
                fs.writeFileSync(recordsPath, JSON.stringify(recordsData, null, 2));
                
                // Include ALL strategies regardless of betting record count
                processedStrategies.push({
                    ...strategy,
                    actualBettingRecords: bettingRecords.length,
                    actualTotalProfit: totalProfit,
                    actualROI: parseFloat(actualROI),
                    recordsData: recordsData
                });
                
                console.log(`✅ Saved ${bettingRecords.length} betting records for ${strategy.name}`);
            } catch (error) {
                console.log(`❌ Error generating betting records for ${strategy.name}: ${error.message}`);
                // Still include failed strategies in the results
                const recordsData = {
                    strategy: {
                        name: strategy.name,
                        roi: '0.00%',
                        correlation: '0.0000',
                        factors: strategy.factors || [],
                        hypothesis: strategy.hypothesis || '',
                        error: error.message
                    },
                    summary: {
                        totalBets: 0,
                        totalProfit: 0,
                        winRate: '0%',
                        generatedAt: new Date().toISOString()
                    },
                    bettingRecords: []
                };
                
                processedStrategies.push({
                    ...strategy,
                    actualBettingRecords: 0,
                    actualTotalProfit: 0,
                    actualROI: 0,
                    recordsData: recordsData,
                    error: error.message
                });
            }
        });
        
        return processedStrategies;
    }

    updateSummaryWithAllResults(allProcessedStrategies) {
        console.log(`\n📋 Updating summary with ALL ${allProcessedStrategies.length} strategies (including 0-bet strategies)...`);
        
        // Prepare strategy data for ALL strategies
        const strategies = allProcessedStrategies.map(strategy => ({
            name: strategy.name,
            roi: `${strategy.actualROI.toFixed(2)}%`,
            correlation: strategy.correlation ? strategy.correlation.toFixed(4) : '0.0000',
            validSamples: strategy.validSamples || 0,
            factors: strategy.factors || [],
            hypothesis: strategy.hypothesis || '',
            threshold: strategy.threshold || 'Dynamic',
            winRate: strategy.recordsData ? strategy.recordsData.summary.winRate : '0%',
            totalBets: strategy.actualBettingRecords || 0,
            avgProfitPerBet: strategy.actualBettingRecords > 0 ? 
                (strategy.actualTotalProfit / strategy.actualBettingRecords).toFixed(2) : '0.00',
            generatedAt: new Date().toISOString(),
            detailsFile: `${strategy.name.replace(/[^a-zA-Z0-9_]/g, '_')}_betting_records.json`,
            error: strategy.error || null,
            status: strategy.error ? 'ERROR' : (strategy.actualBettingRecords > 0 ? 'ACTIVE' : 'NO_MATCHES')
        }));

        // Sort by actual ROI (descending), then by total bets (descending)
        strategies.sort((a, b) => {
            const roiDiff = parseFloat(b.roi) - parseFloat(a.roi);
            if (roiDiff !== 0) return roiDiff;
            return b.totalBets - a.totalBets;
        });

        // Update consolidated summary with ALL strategies
        const consolidatedSummary = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalStrategies: strategies.length,
                profitableStrategies: strategies.filter(s => parseFloat(s.roi) > 0).length,
                strategiesWithBets: strategies.filter(s => s.totalBets > 0).length,
                strategiesWithErrors: strategies.filter(s => s.error).length,
                bestROI: strategies.length > 0 ? Math.max(...strategies.map(s => parseFloat(s.roi))) : 0,
                bestCorrelation: strategies.length > 0 ? Math.max(...strategies.map(s => parseFloat(s.correlation))) : 0
            },
            summary: {
                totalCombinations: strategies.length,
                validResults: strategies.filter(s => !s.error).length,
                profitableStrategies: strategies.filter(s => parseFloat(s.roi) > 0).length,
                bestROI: strategies.length > 0 ? Math.max(...strategies.map(s => parseFloat(s.roi))) : 0
            },
            strategies: strategies
        };

        fs.writeFileSync(this.summaryPath, JSON.stringify(consolidatedSummary, null, 2));
        console.log(`✅ Updated summary with ALL ${strategies.length} strategies (${consolidatedSummary.metadata.strategiesWithBets} with bets, ${consolidatedSummary.metadata.strategiesWithErrors} with errors)`);
    }

    generateStrategyBettingRecords(strategy) {
        const records = [];
        
        // Apply the strategy to all matches and generate betting records
        this.allMatches.forEach(match => {
            try {
                // Evaluate and combine all factors for multi-factor strategies
                const combinedFactorValue = this.evaluateCombinedFactors(match, strategy.factors);
                
                if (combinedFactorValue !== null && !isNaN(combinedFactorValue)) {
                    
                    // Determine if this match meets the strategy criteria
                    const meetscriteria = this.evaluateStrategyThreshold(combinedFactorValue, strategy);
                    
                    if (meetscriteria) {
                        const record = this.createBettingRecord(match, strategy, combinedFactorValue);
                        if (record) {
                            records.push(record);
                        }
                    }
                }
            } catch (error) {
                // Skip problematic matches
                console.log(`Error processing match for ${strategy.name}: ${error.message}`);
            }
        });
        
        // Sort by date (most recent first)
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    evaluateCombinedFactors(match, factors) {
        try {
            // Handle single factor strategies
            if (factors.length === 1) {
                return this.evaluateValue(match, factors[0]);
            }
            
            // For multi-factor strategies, evaluate each factor and combine them
            const factorValues = [];
            const validFactors = [];
            
            for (const factor of factors) {
                const value = this.evaluateValue(match, factor);
                if (value !== null && !isNaN(value)) {
                    factorValues.push(value);
                    validFactors.push(factor);
                }
            }
            
            // Require at least one valid factor value
            if (factorValues.length === 0) {
                return null;
            }
            
            // Combine factor values using weighted average
            // This ensures all factors contribute to the final decision
            let combinedValue;
            
            if (factorValues.length === 1) {
                combinedValue = factorValues[0];
            } else {
                // For multiple factors, use a less aggressive combination approach
                const processedValues = factorValues.map(value => {
                    // Ensure value is a number
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) return 0;
                    
                    // Less aggressive normalization - preserve more of the original scale
                    const absValue = Math.abs(numValue);
                    if (absValue > 100) {
                        // Only normalize extremely large values
                        return (numValue / absValue) * 10; // Scale to [-10, 10] range
                    } else if (absValue > 10) {
                        // Moderate scaling for large values
                        return numValue * 0.5; // Scale down by half
                    }
                    return numValue; // Keep smaller values as-is
                });
                
                // Take the average of processed factors
                combinedValue = processedValues.reduce((sum, val) => sum + val, 0) / processedValues.length;
            }
            
            // Ensure we return a valid number
            if (isNaN(combinedValue) || !isFinite(combinedValue)) {
                return null;
            }
            
            return combinedValue;
        } catch (error) {
            console.log(`Error evaluating combined factors: ${error.message}`);
            return null;
        }
    }

    evaluateStrategyThreshold(factorValue, strategy) {
        // Use dynamic thresholding based on the strategy's selection criteria
        if (strategy.threshold && typeof strategy.threshold === 'number') {
            return factorValue >= strategy.threshold;
        }
        
        // For strategies with positive correlation, select high values
        // For strategies with negative correlation, select low values
        const correlation = parseFloat(strategy.correlation);
        
        // Use more permissive thresholds to capture more strategies
        const absCorrelation = Math.abs(correlation);
        const absFactorValue = Math.abs(factorValue);
        
        if (absCorrelation > 0.02) {
            // For any meaningful correlation, use direction-based selection
            if (correlation > 0) {
                // Positive correlation: select higher values (top 40%)
                return factorValue > 0.1;
            } else {
                // Negative correlation: select lower values (bottom 40%)
                return factorValue < -0.1;
            }
        }
        
        // For very weak correlations, select based on absolute value (more permissive)
        return absFactorValue > 0.2;
    }

    createBettingRecord(match, strategy, factorValue) {
        try {
            const ahResults = match.postMatch?.asianHandicapResults;
            const ahOdds = match.preMatch?.match?.asianHandicapOdds;
            const actualResults = match.postMatch?.actualResults;
            
            if (!ahResults || !ahOdds || !actualResults) return null;
            
            // Get actual match score (treat null as 0)
            const homeScore = actualResults.homeGoals ?? 0;
            const awayScore = actualResults.awayGoals ?? 0;
            
            // Parse the Asian Handicap line from homeHandicap (e.g., "0/+0.5" -> split, "-0.5" -> single)
            const handicapStr = ahOdds.homeHandicap;
            let handicapLines = [];
            
            if (handicapStr && handicapStr.includes('/')) {
                // Quarter handicap - split into two half-bets
                const parts = handicapStr.split('/');
                handicapLines = [parseFloat(parts[0]), parseFloat(parts[1])];
            } else if (handicapStr) {
                // Single handicap
                handicapLines = [parseFloat(handicapStr)];
            } else {
                // No handicap data available, skip this betting record
                return null;
            }
            
            // Calculate detailed factor breakdown
            const factorBreakdown = this.calculateFactorBreakdown(match, strategy);
            
            // Determine threshold information
            const thresholdInfo = this.getThresholdInfo(strategy, factorValue);
            
            // Determine bet side - check for explicit betSide first, then fall back to correlation logic
            let betSide;
            
            if (strategy.betSide) {
                // Use explicitly specified bet side
                betSide = strategy.betSide === 'away' ? 'Away' : 'Home';
            } else {
                // Fall back to correlation-based logic
                const correlation = parseFloat(strategy.correlation);
                
                if (correlation > 0) {
                    // Positive correlation: high factor value = bet Home
                    betSide = factorValue > 0 ? 'Home' : 'Away';
                } else {
                    // Negative correlation: high factor value = bet Away
                    betSide = factorValue > 0 ? 'Away' : 'Home';
                }
            }
            
            const selectedOdds = betSide === 'Home' ? ahOdds.homeOdds : ahOdds.awayOdds;
            
            // Calculate Asian Handicap outcome for each line (split betting)
            let totalProfit = 0;
            let outcomes = [];
            const betAmount = 100; // Total bet amount
            const betPerLine = betAmount / handicapLines.length; // Split bet across lines
            
            handicapLines.forEach(handicapLine => {
                // Home team gets the handicap
                const adjustedHomeScore = homeScore + handicapLine;
                const adjustedAwayScore = awayScore;
                
                let ahOutcome;
                if (adjustedHomeScore > adjustedAwayScore) {
                    ahOutcome = 'Home';
                } else if (adjustedHomeScore < adjustedAwayScore) {
                    ahOutcome = 'Away';
                } else {
                    ahOutcome = 'Push';
                }
                
                // Calculate profit/loss for this line
                let lineProfit = 0;
                let lineOutcome = '';
                
                if (ahOutcome === 'Push') {
                    lineOutcome = 'Push';
                    lineProfit = 0; // Stake returned
                } else if (ahOutcome === betSide) {
                    lineOutcome = 'Win';
                    lineProfit = (selectedOdds - 1) * betPerLine; // Profit on this portion
                } else {
                    lineOutcome = 'Loss';
                    lineProfit = -betPerLine; // Lose this portion
                }
                
                totalProfit += lineProfit;
                outcomes.push(lineOutcome);
            });
            
            // Determine overall outcome description
            let outcome = '';
            if (outcomes.every(o => o === 'Win')) {
                outcome = 'Win';
            } else if (outcomes.every(o => o === 'Loss')) {
                outcome = 'Loss';
            } else if (outcomes.every(o => o === 'Push')) {
                outcome = 'Push';
            } else if (outcomes.includes('Win') && outcomes.includes('Push')) {
                outcome = 'Half Win';
            } else if (outcomes.includes('Loss') && outcomes.includes('Push')) {
                outcome = 'Half Loss';
            } else {
                outcome = 'Mixed';
            }
            
            let profit = totalProfit;
            
            return {
                date: match.preMatch?.match?.date || 'N/A',
                homeTeam: match.preMatch?.match?.homeTeam || 'N/A',
                awayTeam: match.preMatch?.match?.awayTeam || 'N/A',
                score: `${homeScore}-${awayScore}`,
                handicapLine: handicapStr,
                betSide: betSide,
                betOdds: selectedOdds?.toFixed(2) || 'N/A',
                profit: profit.toFixed(0),
                outcome: outcome,
                
                // Enhanced factor information
                factorValue: (typeof factorValue === 'number' ? factorValue.toFixed(4) : factorValue.toString()),
                factorCalculation: factorBreakdown,
                threshold: thresholdInfo.threshold,
                thresholdType: thresholdInfo.type,
                thresholdMet: thresholdInfo.met,
                
                // Strategy details
                factors: strategy.factors,
                strategyCorrelation: strategy.correlation?.toFixed(4) || '0.0000',
                
                // Additional debug info for Asian Handicap calculation
                handicapDetails: handicapLines.length > 1 ? {
                    splitLines: handicapLines,
                    individualOutcomes: outcomes,
                    betPerLine: betPerLine
                } : null
            };
        } catch (error) {
            console.log(`Error creating betting record: ${error.message}`);
            return null;
        }
    }

    calculateFactorBreakdown(match, strategy) {
        try {
            const breakdown = [];
            
            strategy.factors.forEach((factor, index) => {
                const value = this.evaluateValue(match, factor);
                breakdown.push({
                    factorIndex: index + 1,
                    expression: factor,
                    calculatedValue: value !== null ? (typeof value === 'number' ? value.toFixed(4) : value.toString()) : 'NULL',
                    explanation: this.explainFactorCalculation(match, factor, value)
                });
            });
            
            return breakdown;
        } catch (error) {
            return [{ error: `Factor calculation failed: ${error.message}` }];
        }
    }

    explainFactorCalculation(match, factor, value) {
        try {
            // Provide context for common factor types
            if (factor.includes('leaguePosition')) {
                const homePos = match.timeSeries?.home?.leaguePosition || 20;
                const awayPos = match.timeSeries?.away?.leaguePosition || 20;
                return `Home position: ${homePos}, Away position: ${awayPos}`;
            }
            
            if (factor.includes('handicap') && factor.includes('parseFloat')) {
                const handicap = match.preMatch?.match?.asianHandicapOdds?.homeHandicap;
                return `Handicap line: ${handicap}`;
            }
            
            if (factor.includes('enhanced') && factor.includes('ImpliedProb')) {
                const homeProb = match.preMatch?.enhanced?.homeImpliedProb;
                const awayProb = match.preMatch?.enhanced?.awayImpliedProb;
                return `Home prob: ${homeProb?.toFixed(2)}%, Away prob: ${awayProb?.toFixed(2)}%`;
            }
            
            if (factor.includes('week')) {
                const week = match.preMatch?.fbref?.week;
                return `Season week: ${week}`;
            }
            
            if (factor.includes('goalDifference')) {
                const homeGD = match.timeSeries?.home?.cumulative?.overall?.goalDifference || 0;
                const awayGD = match.timeSeries?.away?.cumulative?.overall?.goalDifference || 0;
                return `Home GD: ${homeGD}, Away GD: ${awayGD}`;
            }
            
            if (factor.includes('streak')) {
                const homeStreak = match.timeSeries?.home?.streaks?.overall?.current?.count || 0;
                const awayStreak = match.timeSeries?.away?.streaks?.overall?.current?.count || 0;
                return `Home streak: ${homeStreak}, Away streak: ${awayStreak}`;
            }
            
            return `Calculated value: ${value}`;
        } catch (error) {
            return `Calculation explanation unavailable: ${error.message}`;
        }
    }

    getThresholdInfo(strategy, factorValue) {
        try {
            const correlation = parseFloat(strategy.correlation) || 0;
            const absCorrelation = Math.abs(correlation);
            const absFactorValue = Math.abs(factorValue);
            
            let threshold, type, met;
            
            if (strategy.threshold && typeof strategy.threshold === 'number') {
                // Fixed threshold
                threshold = strategy.threshold;
                type = 'Fixed';
                met = factorValue >= threshold;
            } else if (absCorrelation > 0.02) {
                // Correlation-based dynamic threshold
                if (correlation > 0) {
                    threshold = 0.1;
                    type = 'Dynamic (Positive Correlation)';
                    met = factorValue > threshold;
                } else {
                    threshold = -0.1;
                    type = 'Dynamic (Negative Correlation)';
                    met = factorValue < threshold;
                }
            } else {
                // Weak correlation - absolute value threshold
                threshold = 0.2;
                type = 'Dynamic (Absolute Value)';
                met = absFactorValue > threshold;
            }
            
            return {
                threshold: threshold,
                type: type,
                met: met,
                explanation: `Factor value ${factorValue.toFixed(4)} ${met ? 'meets' : 'does not meet'} threshold ${threshold} (${type})`
            };
        } catch (error) {
            return {
                threshold: 'Unknown',
                type: 'Error',
                met: false,
                explanation: `Threshold calculation failed: ${error.message}`
            };
        }
    }
}

if (require.main === module) {
    const tester = new AHCombinationTester();
    tester.runTests();
}

module.exports = AHCombinationTester;