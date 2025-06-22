const fs = require('fs');
const path = require('path');

class SingleStrategyTester {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.reportsPath = path.join(__dirname, 'strategy_reports');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('📊 Loading EPL data for single strategy test...\n');
        
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
                console.log(`✅ Loaded ${matches.length} matches from ${season}`);
            }
        });

        // Filter for complete data
        this.allMatches = this.allMatches.filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined &&
            match.fbref?.homeXG !== undefined &&
            match.fbref?.awayXG !== undefined &&
            match.enhanced?.preMatch?.marketEfficiency?.awayImpliedProb !== undefined
        );
        
        console.log(`🎯 ${this.allMatches.length} matches with complete data\n`);
    }

    evaluateValue(match, factorExpression) {
        try {
            const context = {
                match: match.match,
                fbref: match.fbref,
                enhanced: match.enhanced,
                parseFloat: parseFloat,
                Math: Math
            };

            return Function('match', 'fbref', 'enhanced', 'parseFloat', 'Math', 
                `"use strict"; return ${factorExpression}`)(
                context.match, context.fbref, context.enhanced, 
                context.parseFloat, context.Math
            );
        } catch (error) {
            return null;
        }
    }

    testAwayImpliedProbStrategy() {
        console.log('🔍 Testing Strategy: Away Implied Probability\n');
        
        const strategy = {
            name: "Away Implied Probability",
            factor: "enhanced.preMatch.marketEfficiency.awayImpliedProb",
            description: "Contrarian strategy betting against market-favored teams",
            hypothesis: "Markets overvalue favorites, creating value opportunities"
        };

        // Extract factor values for all matches
        const matchData = [];
        
        this.allMatches.forEach(match => {
            const factorValue = this.evaluateValue(match, strategy.factor);
            
            if (factorValue !== null && !isNaN(factorValue) && isFinite(factorValue)) {
                matchData.push({
                    date: match.fbref?.date || 'Unknown',
                    homeTeam: match.match?.homeTeam || 'Unknown',
                    awayTeam: match.match?.awayTeam || 'Unknown',
                    homeScore: match.match?.homeScore || 0,
                    awayScore: match.match?.awayScore || 0,
                    awayImpliedProb: factorValue,
                    homeProfit: match.enhanced.postMatch.bettingOutcomes.homeProfit,
                    awayProfit: match.enhanced.postMatch.bettingOutcomes.awayProfit,
                    homeOdds: match.match?.asianHandicapOdds?.homeOdds || 0,
                    awayOdds: match.match?.asianHandicapOdds?.awayOdds || 0,
                    homeWinOdds: match.match?.homeWinOdds || 0,
                    awayWinOdds: match.match?.awayWinOdds || 0
                });
            }
        });

        console.log(`📈 Analyzing ${matchData.length} valid matches\n`);

        // Calculate threshold (median)
        const factorValues = matchData.map(d => d.awayImpliedProb);
        const sortedValues = [...factorValues].sort((a, b) => a - b);
        const threshold = sortedValues[Math.floor(sortedValues.length / 2)];

        console.log(`🎯 Decision threshold (median): ${threshold.toFixed(4)} (${(threshold * 100).toFixed(1)}%)\n`);

        // Apply strategy to each match
        let totalBets = 0;
        let totalReturn = 0;
        let correctPicks = 0;
        let homeBets = 0;
        let awayBets = 0;
        let homeWins = 0;
        let awayWins = 0;
        let homeTotalReturn = 0;
        let awayTotalReturn = 0;

        const detailedResults = matchData.map(match => {
            totalBets++;
            
            let betChoice, profit, betWin;
            
            if (match.awayImpliedProb > threshold) {
                // High away probability → Bet HOME (contrarian)
                betChoice = 'HOME';
                profit = match.homeProfit;
                homeBets++;
                homeTotalReturn += profit;
                if (profit > 0) {
                    correctPicks++;
                    homeWins++;
                    betWin = true;
                } else {
                    betWin = false;
                }
            } else {
                // Low away probability → Bet AWAY (contrarian)
                betChoice = 'AWAY';
                profit = match.awayProfit;
                awayBets++;
                awayTotalReturn += profit;
                if (profit > 0) {
                    correctPicks++;
                    awayWins++;
                    betWin = true;
                } else {
                    betWin = false;
                }
            }
            
            totalReturn += profit;

            return {
                ...match,
                threshold,
                betChoice,
                profit,
                betWin,
                decisionLogic: match.awayImpliedProb > threshold ? 
                    `${match.awayImpliedProb.toFixed(3)} > ${threshold.toFixed(3)} → BET HOME` :
                    `${match.awayImpliedProb.toFixed(3)} ≤ ${threshold.toFixed(3)} → BET AWAY`
            };
        });

        // Calculate performance metrics
        const totalInvestment = totalBets * 100; // $100 per bet
        const profitability = totalReturn / totalInvestment;
        const accuracy = correctPicks / totalBets;
        const avgProfitPerBet = totalReturn / totalBets;

        const results = {
            strategy,
            threshold,
            performance: {
                totalMatches: totalBets,
                totalInvestment,
                totalReturn,
                netProfit: totalReturn,
                profitability: profitability * 100,
                accuracy: accuracy * 100,
                avgProfitPerBet,
                homeBets,
                awayBets,
                homeWins,
                awayWins,
                homeTotalReturn,
                awayTotalReturn,
                homeAccuracy: homeBets > 0 ? (homeWins / homeBets) * 100 : 0,
                awayAccuracy: awayBets > 0 ? (awayWins / awayBets) * 100 : 0,
                homeProfitability: homeBets > 0 ? (homeTotalReturn / (homeBets * 100)) * 100 : 0,
                awayProfitability: awayBets > 0 ? (awayTotalReturn / (awayBets * 100)) * 100 : 0
            },
            detailedResults,
            analysis: this.analyzeStrategy(detailedResults, threshold)
        };

        this.exportReport(results);
        this.printSummary(results);

        return results;
    }

    analyzeStrategy(results, threshold) {
        const analysis = {
            thresholdDistribution: {},
            profitByRange: {},
            seasonalPerformance: {},
            teamPerformance: {}
        };

        // Threshold distribution
        const lowProb = results.filter(r => r.awayImpliedProb <= 0.25).length;
        const medProb = results.filter(r => r.awayImpliedProb > 0.25 && r.awayImpliedProb <= 0.5).length;
        const highProb = results.filter(r => r.awayImpliedProb > 0.5).length;

        analysis.thresholdDistribution = {
            'Low (≤25%)': { count: lowProb, percentage: (lowProb / results.length * 100).toFixed(1) },
            'Medium (25-50%)': { count: medProb, percentage: (medProb / results.length * 100).toFixed(1) },
            'High (>50%)': { count: highProb, percentage: (highProb / results.length * 100).toFixed(1) }
        };

        // Profit by probability range
        const ranges = [
            { name: 'Very Low (0-20%)', min: 0, max: 0.2 },
            { name: 'Low (20-35%)', min: 0.2, max: 0.35 },
            { name: 'Medium (35-50%)', min: 0.35, max: 0.5 },
            { name: 'High (50-65%)', min: 0.5, max: 0.65 },
            { name: 'Very High (65%+)', min: 0.65, max: 1 }
        ];

        ranges.forEach(range => {
            const rangeResults = results.filter(r => 
                r.awayImpliedProb >= range.min && r.awayImpliedProb < range.max
            );
            
            if (rangeResults.length > 0) {
                const totalProfit = rangeResults.reduce((sum, r) => sum + r.profit, 0);
                const wins = rangeResults.filter(r => r.profit > 0).length;
                
                analysis.profitByRange[range.name] = {
                    matches: rangeResults.length,
                    totalProfit,
                    avgProfit: totalProfit / rangeResults.length,
                    winRate: (wins / rangeResults.length * 100).toFixed(1),
                    profitability: ((totalProfit / (rangeResults.length * 100)) * 100).toFixed(2)
                };
            }
        });

        return analysis;
    }

    exportReport(results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseFileName = `away_implied_prob_strategy_${timestamp}`;

        // Export detailed CSV
        const csvPath = path.join(this.reportsPath, `${baseFileName}.csv`);
        const csvHeaders = [
            'Date', 'Home Team', 'Away Team', 'Home Score', 'Away Score',
            'Away Implied Prob', 'Threshold', 'Bet Choice', 'Decision Logic',
            'Profit', 'Bet Win', 'Home Odds', 'Away Odds', 'Home Win Odds', 'Away Win Odds'
        ];

        const csvRows = results.detailedResults.map(r => [
            r.date, r.homeTeam, r.awayTeam, r.homeScore, r.awayScore,
            r.awayImpliedProb.toFixed(4), r.threshold.toFixed(4), r.betChoice, r.decisionLogic,
            r.profit, r.betWin, r.homeOdds, r.awayOdds, r.homeWinOdds, r.awayWinOdds
        ]);

        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        fs.writeFileSync(csvPath, csvContent);

        // Export JSON summary
        const jsonPath = path.join(this.reportsPath, `${baseFileName}_summary.json`);
        const jsonReport = {
            metadata: {
                generatedAt: new Date().toISOString(),
                strategy: results.strategy,
                dataSource: "3 seasons EPL data (2022-2025)"
            },
            performance: results.performance,
            analysis: results.analysis,
            sampleMatches: results.detailedResults.slice(0, 10) // First 10 for preview
        };

        fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

        console.log(`📄 Reports exported:`);
        console.log(`   📊 Detailed CSV: ${csvPath}`);
        console.log(`   📋 Summary JSON: ${jsonPath}\n`);
    }

    printSummary(results) {
        const p = results.performance;
        
        console.log('═══════════════════════════════════════');
        console.log('📊 AWAY IMPLIED PROBABILITY STRATEGY RESULTS');
        console.log('═══════════════════════════════════════\n');
        
        console.log('🎯 STRATEGY OVERVIEW:');
        console.log(`   Strategy: ${results.strategy.name}`);
        console.log(`   Factor: ${results.strategy.factor}`);
        console.log(`   Logic: Contrarian betting against market favorites`);
        console.log(`   Threshold: ${results.threshold.toFixed(4)} (${(results.threshold * 100).toFixed(1)}%)\n`);
        
        console.log('💰 FINANCIAL PERFORMANCE:');
        console.log(`   Total Matches: ${p.totalMatches.toLocaleString()}`);
        console.log(`   Total Investment: $${p.totalInvestment.toLocaleString()}`);
        console.log(`   Total Return: $${p.totalReturn.toLocaleString()}`);
        console.log(`   Net Profit: $${p.netProfit.toLocaleString()}`);
        console.log(`   Profitability: ${p.profitability > 0 ? '+' : ''}${p.profitability.toFixed(2)}%`);
        console.log(`   Avg Profit/Bet: $${p.avgProfitPerBet.toFixed(2)}\n`);
        
        console.log('🎲 BETTING BREAKDOWN:');
        console.log(`   Overall Accuracy: ${p.accuracy.toFixed(1)}%`);
        console.log(`   HOME Bets: ${p.homeBets} (${(p.homeBets/p.totalMatches*100).toFixed(1)}%)`);
        console.log(`   HOME Wins: ${p.homeWins} | Accuracy: ${p.homeAccuracy.toFixed(1)}%`);
        console.log(`   HOME Profitability: ${p.homeProfitability > 0 ? '+' : ''}${p.homeProfitability.toFixed(2)}%`);
        console.log(`   AWAY Bets: ${p.awayBets} (${(p.awayBets/p.totalMatches*100).toFixed(1)}%)`);
        console.log(`   AWAY Wins: ${p.awayWins} | Accuracy: ${p.awayAccuracy.toFixed(1)}%`);
        console.log(`   AWAY Profitability: ${p.awayProfitability > 0 ? '+' : ''}${p.awayProfitability.toFixed(2)}%\n`);
        
        console.log('📈 PROBABILITY DISTRIBUTION:');
        Object.entries(results.analysis.thresholdDistribution).forEach(([range, data]) => {
            console.log(`   ${range}: ${data.count} matches (${data.percentage}%)`);
        });
        console.log('');
        
        console.log('🎯 PROFIT BY PROBABILITY RANGE:');
        Object.entries(results.analysis.profitByRange).forEach(([range, data]) => {
            console.log(`   ${range}: ${data.matches} matches, ${data.profitability}% profit, ${data.winRate}% wins`);
        });
        
        console.log('\n═══════════════════════════════════════');
    }
}

if (require.main === module) {
    const tester = new SingleStrategyTester();
    tester.testAwayImpliedProbStrategy();
}

module.exports = SingleStrategyTester;