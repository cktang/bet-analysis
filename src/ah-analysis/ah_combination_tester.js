const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class AHCombinationTester {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.combinationsPath = path.join(__dirname, '../../data/processed/ah_combinations.json');
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('Loading EPL data from all seasons...');
        
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
                console.log(`Loaded ${matches.length} matches from ${season}`);
            }
        });

        console.log(`Total matches loaded: ${this.allMatches.length}`);
        
        // Filter matches with required data (corrected data structure)
        this.allMatches = this.allMatches.filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
            match.fbref?.homeXG !== undefined &&
            match.fbref?.awayXG !== undefined
        );
        
        console.log(`Matches with complete AH and XG data: ${this.allMatches.length}`);
    }

    evaluateValue(match, factorExpression) {
        try {
            const context = {
                match: match.match,
                fbref: match.fbref,
                enhanced: match.enhanced,
                timeSeries: match.timeSeries,
                parseFloat: parseFloat,
                Math: Math
            };

            return Function('match', 'fbref', 'enhanced', 'timeSeries', 'parseFloat', 'Math', 
                `"use strict"; return ${factorExpression}`)(
                context.match, context.fbref, context.enhanced, context.timeSeries,
                context.parseFloat, context.Math
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

                    matchData.push({
                        combinedValue,
                        homeProfit: match.enhanced.postMatch.bettingOutcomes.homeProfit,
                        awayProfit: match.enhanced.postMatch.bettingOutcomes.awayProfit,
                        homeOdds: match.match.asianHandicapOdds?.homeOdds || 0,
                        awayOdds: match.match.asianHandicapOdds?.awayOdds || 0
                    });
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

            // Pick strategy with best profitability
            if (profitability > bestProfitability) {
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
        });

        const endTime = Date.now();
        console.log(`Testing completed in ${(endTime - startTime) / 1000}s`);

        // Sort results by correlation strength
        results.sort((a, b) => b.correlation - a.correlation);

        // Analysis summary
        const validResults = results.filter(r => !r.error && r.validSamples >= 10);
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

        fs.writeFileSync(this.resultsPath, JSON.stringify(historicalResults, null, 2));
        
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

        console.log(`Results saved to: ${this.resultsPath}`);
        return output;
    }
}

if (require.main === module) {
    const tester = new AHCombinationTester();
    tester.runTests();
}

module.exports = AHCombinationTester;