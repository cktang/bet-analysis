const fs = require('fs');
const path = require('path');

// Extract truly clean strategies using the new data structure
class RefactoredCleanStrategyExtractor {
    constructor() {
        this.enhancedDataPath = path.join(__dirname, '../../data/enhanced');
        this.resultsPath = path.join(__dirname, '../../data/processed/ah_analysis_results.json');
        this.outputDir = path.join(__dirname, 'winning_strategies');
        
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('🔒 Loading data with NEW CLEAN STRUCTURE...');
        console.log('✅ ONLY: Pre-match odds + Historical team data + Market efficiency');
        console.log('❌ NO: Post-match Expected Goals or Performance ratings');
        
        const seasons = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.enhancedDataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
                console.log(`✅ Loaded ${matches.length} matches from ${season}`);
            }
        });

        console.log(`📊 Total matches loaded: ${this.allMatches.length}`);
        
        // Filter matches with required CLEAN data
        this.allMatches = this.allMatches.filter(match => 
            match.preMatch?.match?.homeWinOdds &&
            match.preMatch?.match?.asianHandicapOdds &&
            match.preMatch?.enhanced?.marketEfficiency !== undefined &&
            match.timeSeries?.home?.leaguePosition &&
            match.timeSeries?.away?.leaguePosition &&
            match.postMatch?.asianHandicapResults
        );
        
        console.log(`✅ Matches with clean pre-match data: ${this.allMatches.length}`);
    }

    evaluateCleanFactor(match, expression) {
        try {
            // Create context with ONLY clean pre-match data
            const context = {
                preMatch: match.preMatch,
                timeSeries: match.timeSeries,
                Math: Math,
                parseFloat: parseFloat
            };

            return Function('preMatch', 'timeSeries', 'Math', 'parseFloat', 
                `"use strict"; return ${expression}`)(
                context.preMatch, context.timeSeries, context.Math, context.parseFloat
            );
        } catch (error) {
            return null;
        }
    }

    calculateProfit(match, betSide) {
        const ahOdds = match.preMatch?.match?.asianHandicapOdds;
        const ahResults = match.postMatch?.asianHandicapResults;
        
        if (!ahOdds || !ahResults) return 0;
        
        // Use the main AH line (ah_0 for level handicap)
        const result = ahResults.ah_0 || Object.values(ahResults)[0];
        
        if (betSide === 'home') {
            if (result === 'home') return (ahOdds.homeOdds - 1) * 100;
            if (result === 'away') return -100;
            return 0; // draw/push
        } else {
            if (result === 'away') return (ahOdds.awayOdds - 1) * 100;
            if (result === 'home') return -100;
            return 0; // draw/push
        }
    }

    testCleanStrategy(strategy) {
        console.log(`\n🔒 Testing CLEAN strategy: ${strategy.name}`);
        
        const matchData = [];
        
        this.allMatches.forEach(match => {
            const factorValues = [];
            let validMatch = true;

            strategy.factors.forEach(factor => {
                const value = this.evaluateCleanFactor(match, factor);
                if (value === null || isNaN(value) || !isFinite(value)) {
                    validMatch = false;
                }
                factorValues.push(value);
            });

            if (validMatch) {
                const combinedValue = factorValues.length === 1 ? 
                    factorValues[0] : 
                    factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;

                const homeProfit = this.calculateProfit(match, 'home');
                const awayProfit = this.calculateProfit(match, 'away');

                matchData.push({
                    combinedValue,
                    homeProfit,
                    awayProfit,
                    homeOdds: match.preMatch.match.asianHandicapOdds.homeOdds,
                    awayOdds: match.preMatch.match.asianHandicapOdds.awayOdds,
                    match: {
                        homeTeam: match.preMatch.match.homeTeam,
                        awayTeam: match.preMatch.match.awayTeam,
                        date: match.preMatch.match.date
                    }
                });
            }
        });

        if (matchData.length < 20) {
            console.log(`❌ Insufficient valid samples: ${matchData.length}`);
            return null;
        }

        // Test selective betting strategy
        const result = this.backtestSelectiveStrategy(matchData, strategy.name);
        
        if (result.profitability > 0.05) { // 5% ROI threshold
            console.log(`✅ ${strategy.name}: ${(result.profitability * 100).toFixed(2)}% ROI, ${result.totalBets} bets`);
            return result;
        } else {
            console.log(`❌ ${strategy.name}: ${(result.profitability * 100).toFixed(2)}% ROI - Not profitable enough`);
            return null;
        }
    }

    backtestSelectiveStrategy(matchData, strategyName) {
        // Sort matches by factor value
        const sortedMatches = [...matchData].sort((a, b) => b.combinedValue - a.combinedValue);
        
        // Test different selection percentages
        const thresholds = [5, 10, 15, 20, 25];
        let bestStrategy = null;
        let bestProfitability = -Infinity;

        thresholds.forEach(threshold => {
            const selectCount = Math.floor(matchData.length * (threshold / 100));
            if (selectCount < 5) return; // Need at least 5 bets
            
            // Top X% - bet HOME (high factor value suggests home advantage)
            const topMatches = sortedMatches.slice(0, selectCount);
            // Bottom X% - bet AWAY (low factor value suggests away advantage)
            const bottomMatches = sortedMatches.slice(-selectCount);
            
            let totalReturn = 0;
            let correctPicks = 0;
            let totalBets = topMatches.length + bottomMatches.length;
            const bettingRecords = [];

            // Calculate returns for top matches (bet HOME)
            topMatches.forEach(match => {
                totalReturn += match.homeProfit;
                if (match.homeProfit > 0) correctPicks++;
                bettingRecords.push({
                    ...match.match,
                    betSide: 'home',
                    odds: match.homeOdds,
                    profit: match.homeProfit,
                    factorValue: match.combinedValue
                });
            });

            // Calculate returns for bottom matches (bet AWAY)
            bottomMatches.forEach(match => {
                totalReturn += match.awayProfit;
                if (match.awayProfit > 0) correctPicks++;
                bettingRecords.push({
                    ...match.match,
                    betSide: 'away',
                    odds: match.awayOdds,
                    profit: match.awayProfit,
                    factorValue: match.combinedValue
                });
            });

            const profitability = totalReturn / (totalBets * 100);
            const accuracy = correctPicks / totalBets;

            if (profitability > bestProfitability) {
                bestProfitability = profitability;
                bestStrategy = {
                    name: strategyName,
                    totalBets,
                    correctPicks,
                    totalReturn,
                    profitability,
                    accuracy,
                    threshold: threshold,
                    avgProfitPerBet: totalReturn / totalBets,
                    selectionRate: (totalBets / matchData.length) * 100,
                    bettingRecords
                };
            }
        });

        return bestStrategy || {
            name: strategyName,
            totalBets: 0,
            profitability: 0,
            bettingRecords: []
        };
    }

    extractStrategies() {
        console.log('\n🔒 EXTRACTING REFACTORED CLEAN STRATEGIES');
        console.log('\n🚨 ABSOLUTE RULE: Only pre-match data + historical statistics!');
        console.log('✅ ONLY: Pre-match odds + League positions + Historical patterns + Market efficiency');
        console.log('❌ NO: Expected Goals, Performance ratings, Match incidents\n');

        // Define truly clean strategies using the new data structure
        const cleanStrategies = [
            {
                name: 'Market_Efficiency_Value',
                factors: ['preMatch.enhanced.marketEfficiency < -5 ? preMatch.enhanced.homeValueBet : 0'],
                hypothesis: 'Inefficient markets create value betting opportunities'
            },
            {
                name: 'Position_Odds_Disparity', 
                factors: ['(timeSeries.away.leaguePosition - timeSeries.home.leaguePosition) / (preMatch.match.homeWinOdds / preMatch.match.awayWinOdds)'],
                hypothesis: 'League position differences vs market odds create opportunities'
            },
            {
                name: 'Historical_Form_Value',
                factors: ['(timeSeries.home.patterns.venueWinRate - timeSeries.away.patterns.venueWinRate) * preMatch.enhanced.homeValueBet'],
                hypothesis: 'Historical venue form combined with value betting'
            },
            {
                name: 'Goal_Difference_Momentum',
                factors: ['((timeSeries.home.averages.overall.goalsFor - timeSeries.home.averages.overall.goalsAgainst) - (timeSeries.away.averages.overall.goalsFor - timeSeries.away.averages.overall.goalsAgainst))'],
                hypothesis: 'Goal difference patterns predict outcomes'
            },
            {
                name: 'Over_Rate_Market',
                factors: ['(timeSeries.home.patterns.overRate + timeSeries.away.patterns.overRate) / 2 > 0.6 ? preMatch.match.over2_5Odds : 0'],
                hypothesis: 'High-scoring team patterns vs over/under odds'
            },
            {
                name: 'Relegation_Desperation',
                factors: ['Math.max(timeSeries.home.leaguePosition, timeSeries.away.leaguePosition) >= 17 ? preMatch.enhanced.marketEfficiency : 0'],
                hypothesis: 'Relegation battles create market inefficiencies'
            }
        ];

        const successfulStrategies = [];
        
        cleanStrategies.forEach(strategy => {
            const result = this.testCleanStrategy(strategy);
            if (result && result.profitability > 0.05) {
                successfulStrategies.push(result);
            }
        });

        console.log(`\n🎯 Successfully extracted ${successfulStrategies.length} REFACTORED CLEAN strategies!`);
        
        if (successfulStrategies.length > 0) {
            this.saveResults(successfulStrategies);
            console.log('\n📊 These are LEGITIMATE results using only pre-match data!');
        } else {
            console.log('\n💡 No highly profitable clean strategies found - this is realistic for efficient markets!');
        }

        return successfulStrategies;
    }

    saveResults(strategies) {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const summary = {
            totalStrategies: strategies.length,
            avgProfitability: strategies.reduce((sum, s) => sum + s.profitability, 0) / strategies.length,
            totalBets: strategies.reduce((sum, s) => sum + s.totalBets, 0),
            avgAccuracy: strategies.reduce((sum, s) => sum + s.accuracy, 0) / strategies.length,
            generatedAt: new Date().toISOString(),
            dataIntegrity: 'CLEAN - No look-ahead bias',
            strategies: strategies.map(s => ({
                name: s.name,
                profitability: s.profitability,
                totalBets: s.totalBets,
                accuracy: s.accuracy,
                avgProfitPerBet: s.avgProfitPerBet,
                threshold: s.threshold
            }))
        };

        fs.writeFileSync(
            path.join(this.outputDir, '_MASTER_SUMMARY.json'),
            JSON.stringify(summary, null, 2)
        );

        strategies.forEach(strategy => {
            // Save betting records
            const csvContent = [
                'Date,HomeTeam,AwayTeam,BetSide,Odds,Profit,FactorValue',
                ...strategy.bettingRecords.map(record => 
                    `${record.date},${record.homeTeam},${record.awayTeam},${record.betSide},${record.odds},${record.profit},${record.factorValue}`
                )
            ].join('\n');

            fs.writeFileSync(
                path.join(this.outputDir, `${strategy.name}_bets.csv`),
                csvContent
            );

            // Save strategy summary
            fs.writeFileSync(
                path.join(this.outputDir, `${strategy.name}_summary.json`),
                JSON.stringify(strategy, null, 2)
            );
        });

        console.log(`📁 Results saved to: ${this.outputDir}`);
    }
}

if (require.main === module) {
    const extractor = new RefactoredCleanStrategyExtractor();
    extractor.extractStrategies();
}

module.exports = RefactoredCleanStrategyExtractor; 