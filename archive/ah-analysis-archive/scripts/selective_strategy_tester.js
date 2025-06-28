const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class SelectiveStrategyTester {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('Loading EPL data for selective strategy testing...\n');
        
        const seasons = ['year-2022-2023.json', 'year-2023-2024.json', 'year-2024-2025.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.dataPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
            }
        });

        this.allMatches = this.allMatches.filter(match => 
            match.enhanced?.postMatch?.bettingOutcomes?.homeProfit !== undefined &&
            match.enhanced?.postMatch?.bettingOutcomes?.awayProfit !== undefined
        );
        
        console.log(`Total matches loaded: ${this.allMatches.length}\n`);
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

    testSelectiveStrategy(factorExpression, factorName, thresholds = [10, 15, 20, 25, 30]) {
        console.log(`🎯 TESTING SELECTIVE STRATEGY: ${factorName}\n`);
        console.log('═══════════════════════════════════════════════\n');
        console.log(`Factor: ${factorExpression}\n`);

        // Evaluate factor for all matches
        const matchData = [];
        this.allMatches.forEach(match => {
            const value = this.evaluateValue(match, factorExpression);
            if (value !== null && isFinite(value)) {
                matchData.push({
                    value,
                    homeProfit: match.enhanced.postMatch.bettingOutcomes.homeProfit,
                    awayProfit: match.enhanced.postMatch.bettingOutcomes.awayProfit,
                    homeTeam: match.match?.homeTeam,
                    awayTeam: match.match?.awayTeam,
                    homeScore: match.match?.homeScore,
                    awayScore: match.match?.awayScore
                });
            }
        });

        if (matchData.length < 100) {
            console.log('❌ Insufficient valid data for analysis\n');
            return;
        }

        console.log(`📊 Valid matches: ${matchData.length}\n`);

        // Sort by factor value
        matchData.sort((a, b) => b.value - a.value);

        // Test different threshold percentages
        const results = [];

        thresholds.forEach(threshold => {
            const topCount = Math.floor(matchData.length * (threshold / 100));
            const bottomCount = Math.floor(matchData.length * (threshold / 100));

            // Top X% - bet HOME (factor suggests home advantage)
            const topMatches = matchData.slice(0, topCount);
            // Bottom X% - bet AWAY (factor suggests away advantage)  
            const bottomMatches = matchData.slice(-bottomCount);

            let totalBets = topMatches.length + bottomMatches.length;
            let totalReturn = 0;
            let correctPicks = 0;
            let homeBets = topMatches.length;
            let awayBets = bottomMatches.length;

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

            results.push({
                threshold,
                selectionRate,
                totalBets,
                homeBets,
                awayBets,
                profitability,
                accuracy,
                totalReturn,
                totalInvestment,
                topValue: topMatches.length > 0 ? topMatches[topMatches.length - 1].value : null,
                bottomValue: bottomMatches.length > 0 ? bottomMatches[0].value : null
            });
        });

        // Display results table
        console.log('📊 SELECTIVE STRATEGY RESULTS:\n');
        console.log('Threshold | Selection | Bets    | Accuracy | Profitability | Net Profit');
        console.log('----------|-----------|---------|----------|---------------|------------');
        
        results.forEach(r => {
            console.log(
                `${r.threshold.toString().padStart(8)}% | ` +
                `${r.selectionRate.toFixed(1).padStart(8)}% | ` +
                `${r.totalBets.toString().padStart(7)} | ` +
                `${(r.accuracy * 100).toFixed(1).padStart(7)}% | ` +
                `${(r.profitability * 100).toFixed(2).padStart(12)}% | ` +
                `$${r.totalReturn.toLocaleString().padStart(9)}`
            );
        });

        // Find best performing threshold
        const bestResult = results.reduce((best, current) => 
            current.profitability > best.profitability ? current : best
        );

        console.log(`\n🏆 BEST THRESHOLD: ${bestResult.threshold}%\n`);
        console.log(`Selection rate: ${bestResult.selectionRate.toFixed(1)}% of matches`);
        console.log(`Total bets: ${bestResult.totalBets}/${matchData.length} matches`);
        console.log(`Accuracy: ${(bestResult.accuracy * 100).toFixed(1)}%`);
        console.log(`Profitability: ${(bestResult.profitability * 100).toFixed(2)}%`);
        console.log(`Net profit: $${bestResult.totalReturn.toLocaleString()}\n`);

        // Show sample bets for best threshold
        if (bestResult.threshold <= 20) {
            console.log('📋 SAMPLE BETS (Best Threshold):\n');
            
            const topCount = Math.floor(matchData.length * (bestResult.threshold / 100));
            const bottomCount = Math.floor(matchData.length * (bestResult.threshold / 100));
            
            console.log('🏠 TOP HOME BETS (highest factor values):');
            matchData.slice(0, Math.min(5, topCount)).forEach((match, i) => {
                const result = match.homeProfit > 0 ? '✅ WIN' : match.homeProfit === 0 ? '🔶 PUSH' : '❌ LOSS';
                console.log(`${i+1}. ${match.homeTeam} vs ${match.awayTeam} (${match.homeScore}-${match.awayScore})`);
                console.log(`   Factor: ${match.value.toFixed(3)} | Result: ${result} $${match.homeProfit}`);
            });
            
            console.log('\n✈️ TOP AWAY BETS (lowest factor values):');
            matchData.slice(-Math.min(5, bottomCount)).forEach((match, i) => {
                const result = match.awayProfit > 0 ? '✅ WIN' : match.awayProfit === 0 ? '🔶 PUSH' : '❌ LOSS';
                console.log(`${i+1}. ${match.homeTeam} vs ${match.awayTeam} (${match.homeScore}-${match.awayScore})`);
                console.log(`   Factor: ${match.value.toFixed(3)} | Result: ${result} $${match.awayProfit}`);
            });
        }

        console.log('\n' + '═'.repeat(60) + '\n');

        return results;
    }

    runTopStrategies() {
        console.log('🚀 TESTING TOP STRATEGIES WITH SELECTIVE BETTING\n');
        console.log('═'.repeat(60) + '\n');

        const strategies = [
            {
                name: "Away Implied Probability",
                expression: "enhanced.preMatch.marketEfficiency.awayImpliedProb"
            },
            {
                name: "Win Odds Ratio", 
                expression: "match.homeWinOdds / match.awayWinOdds"
            },
            {
                name: "Home Win Odds",
                expression: "match.homeWinOdds"
            },
            {
                name: "Handicap Line",
                expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])"
            },
            {
                name: "Market Bias",
                expression: "enhanced.preMatch.marketEfficiency.homeImpliedProb - enhanced.preMatch.marketEfficiency.awayImpliedProb"
            }
        ];

        const allResults = {};

        strategies.forEach(strategy => {
            try {
                const results = this.testSelectiveStrategy(strategy.expression, strategy.name);
                allResults[strategy.name] = results;
            } catch (error) {
                console.log(`❌ Error testing ${strategy.name}: ${error.message}\n`);
            }
        });

        // Summary comparison
        console.log('📊 STRATEGY COMPARISON (Best Threshold for Each):\n');
        console.log('Strategy                  | Best % | Selection | Profitability');
        console.log('--------------------------|--------|-----------|---------------');
        
        Object.entries(allResults).forEach(([name, results]) => {
            if (results && results.length > 0) {
                const best = results.reduce((b, c) => c.profitability > b.profitability ? c : b);
                console.log(
                    `${name.padEnd(25)} | ` +
                    `${best.threshold.toString().padStart(5)}% | ` +
                    `${best.selectionRate.toFixed(1).padStart(8)}% | ` +
                    `${(best.profitability * 100).toFixed(2).padStart(12)}%`
                );
            }
        });

        console.log('\n🎯 KEY INSIGHTS:\n');
        console.log('• Selective betting only bets on extreme values where confidence is high');
        console.log('• Lower selection rates may show higher profitability due to better signal');
        console.log('• Most profitable threshold balances signal strength vs sample size');
        console.log('• Realistic strategies should show modest edges with good selection rates\n');
    }
}

if (require.main === module) {
    const tester = new SelectiveStrategyTester();
    tester.runTopStrategies();
}

module.exports = SelectiveStrategyTester;