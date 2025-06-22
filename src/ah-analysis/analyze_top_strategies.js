const fs = require('fs');
const path = require('path');

class AnalyzeTopStrategies {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data/processed');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
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

    analyzeStrategy(factorExpression, factorName, bestThreshold = 15) {
        console.log(`\n🔍 DETAILED ANALYSIS: ${factorName}\n`);
        console.log('═'.repeat(60) + '\n');

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
                    awayScore: match.match?.awayScore,
                    homeOdds: match.match?.asianHandicapOdds?.homeOdds,
                    awayOdds: match.match?.asianHandicapOdds?.awayOdds
                });
            }
        });

        matchData.sort((a, b) => b.value - a.value);

        const topCount = Math.floor(matchData.length * (bestThreshold / 100));
        const bottomCount = Math.floor(matchData.length * (bestThreshold / 100));
        const topMatches = matchData.slice(0, topCount);
        const bottomMatches = matchData.slice(-bottomCount);

        console.log(`📊 Factor: ${factorExpression}`);
        console.log(`📊 Total valid matches: ${matchData.length}`);
        console.log(`📊 Threshold: ${bestThreshold}% (${topCount + bottomCount} bets)\n`);

        // Value distribution analysis
        const values = matchData.map(m => m.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const mean = values.reduce((a, b) => a + b) / values.length;
        const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

        console.log('📈 VALUE DISTRIBUTION:');
        console.log(`Min: ${min.toFixed(3)}`);
        console.log(`Max: ${max.toFixed(3)}`);
        console.log(`Mean: ${mean.toFixed(3)}`);
        console.log(`Median: ${median.toFixed(3)}`);
        console.log(`Top threshold: ≥${topMatches[topMatches.length - 1]?.value.toFixed(3)}`);
        console.log(`Bottom threshold: ≤${bottomMatches[0]?.value.toFixed(3)}\n`);

        // Strategy performance
        let totalReturn = 0;
        let correctPicks = 0;

        topMatches.forEach(match => {
            totalReturn += match.homeProfit;
            if (match.homeProfit > 0) correctPicks++;
        });

        bottomMatches.forEach(match => {
            totalReturn += match.awayProfit;
            if (match.awayProfit > 0) correctPicks++;
        });

        const totalBets = topCount + bottomCount;
        const totalInvestment = totalBets * 100;
        const profitability = (totalReturn / totalInvestment) * 100;
        const accuracy = (correctPicks / totalBets) * 100;

        console.log('💰 STRATEGY PERFORMANCE:');
        console.log(`Total bets: ${totalBets} (${((totalBets/matchData.length)*100).toFixed(1)}% selection)`);
        console.log(`Home bets: ${topCount} | Away bets: ${bottomCount}`);
        console.log(`Accuracy: ${accuracy.toFixed(1)}%`);
        console.log(`Profitability: ${profitability.toFixed(2)}%`);
        console.log(`Net profit: $${totalReturn.toLocaleString()}\n`);

        // Sample best bets
        console.log('🏆 TOP 5 HOME BETS (highest values):');
        topMatches.slice(0, 5).forEach((match, i) => {
            const result = match.homeProfit > 0 ? '✅ WIN' : match.homeProfit === 0 ? '🔶 PUSH' : '❌ LOSS';
            console.log(`${i+1}. ${match.homeTeam} vs ${match.awayTeam} (${match.homeScore}-${match.awayScore})`);
            console.log(`   Value: ${match.value.toFixed(3)} | Odds: ${match.homeOdds} | ${result} $${match.homeProfit}`);
        });

        console.log('\n🏆 TOP 5 AWAY BETS (lowest values):');
        bottomMatches.slice(-5).forEach((match, i) => {
            const result = match.awayProfit > 0 ? '✅ WIN' : match.awayProfit === 0 ? '🔶 PUSH' : '❌ LOSS';
            console.log(`${i+1}. ${match.homeTeam} vs ${match.awayTeam} (${match.homeScore}-${match.awayScore})`);
            console.log(`   Value: ${match.value.toFixed(3)} | Odds: ${match.awayOdds} | ${result} $${match.awayProfit}`);
        });

        // Edge analysis
        console.log('\n🎯 EDGE ANALYSIS:');
        
        const homeWinRate = topMatches.filter(m => m.homeProfit > 0).length / topMatches.length;
        const awayWinRate = bottomMatches.filter(m => m.awayProfit > 0).length / bottomMatches.length;
        
        const avgHomeOdds = topMatches.reduce((sum, m) => sum + m.homeOdds, 0) / topMatches.length;
        const avgAwayOdds = bottomMatches.reduce((sum, m) => sum + m.awayOdds, 0) / bottomMatches.length;
        
        const homeImpliedWinRate = 1 / avgHomeOdds;
        const awayImpliedWinRate = 1 / avgAwayOdds;

        console.log(`Home bets - Actual: ${(homeWinRate*100).toFixed(1)}% vs Implied: ${(homeImpliedWinRate*100).toFixed(1)}%`);
        console.log(`Away bets - Actual: ${(awayWinRate*100).toFixed(1)}% vs Implied: ${(awayImpliedWinRate*100).toFixed(1)}%`);
        
        const homeEdge = homeWinRate - homeImpliedWinRate;
        const awayEdge = awayWinRate - awayImpliedWinRate;
        
        console.log(`Home edge: ${(homeEdge*100).toFixed(1)}% | Away edge: ${(awayEdge*100).toFixed(1)}%`);

        return {
            factorName,
            profitability,
            accuracy,
            totalBets,
            selectionRate: (totalBets/matchData.length)*100,
            homeEdge,
            awayEdge
        };
    }

    runAnalysis() {
        console.log('🚀 COMPREHENSIVE ANALYSIS OF TOP STRATEGIES\n');
        console.log('═'.repeat(80) + '\n');

        const strategies = [
            {
                name: "Handicap Line",
                expression: "parseFloat(match.asianHandicapOdds.homeHandicap.split('/')[0])",
                threshold: 10 // Best threshold from previous results
            },
            {
                name: "Home Win Odds", 
                expression: "match.homeWinOdds",
                threshold: 15
            },
            {
                name: "Away Implied Probability",
                expression: "enhanced.preMatch.marketEfficiency.awayImpliedProb",
                threshold: 15
            },
            {
                name: "Win Odds Ratio",
                expression: "match.homeWinOdds / match.awayWinOdds", 
                threshold: 15
            },
            {
                name: "AH vs 1X2 Comparison",
                expression: "match.asianHandicapOdds.homeOdds / match.homeWinOdds",
                threshold: 15
            }
        ];

        const results = [];

        strategies.forEach(strategy => {
            try {
                const result = this.analyzeStrategy(strategy.expression, strategy.name, strategy.threshold);
                results.push(result);
            } catch (error) {
                console.log(`❌ Error analyzing ${strategy.name}: ${error.message}\n`);
            }
        });

        // Summary comparison
        console.log('\n📊 STRATEGY SUMMARY COMPARISON:\n');
        console.log('═'.repeat(80) + '\n');
        console.log('Strategy                 | Profit% | Accuracy | Selection | Home Edge | Away Edge');
        console.log('-------------------------|---------|----------|-----------|-----------|----------');
        
        results.forEach(r => {
            console.log(
                `${r.factorName.padEnd(24)} | ` +
                `${r.profitability.toFixed(1).padStart(6)}% | ` +
                `${r.accuracy.toFixed(1).padStart(7)}% | ` +
                `${r.selectionRate.toFixed(1).padStart(8)}% | ` +
                `${(r.homeEdge*100).toFixed(1).padStart(8)}% | ` +
                `${(r.awayEdge*100).toFixed(1).padStart(8)}%`
            );
        });

        console.log('\n🎯 KEY FINDINGS:\n');
        const avgProfitability = results.reduce((sum, r) => sum + r.profitability, 0) / results.length;
        const bestStrategy = results.reduce((best, current) => 
            current.profitability > best.profitability ? current : best
        );

        console.log(`• Average profitability: ${avgProfitability.toFixed(1)}%`);
        console.log(`• Best strategy: ${bestStrategy.factorName} (${bestStrategy.profitability.toFixed(1)}%)`);
        console.log(`• Selection rates: ${Math.min(...results.map(r => r.selectionRate)).toFixed(1)}% - ${Math.max(...results.map(r => r.selectionRate)).toFixed(1)}%`);
        console.log(`• Accuracy range: ${Math.min(...results.map(r => r.accuracy)).toFixed(1)}% - ${Math.max(...results.map(r => r.accuracy)).toFixed(1)}%`);
        
        const profitableStrategies = results.filter(r => r.profitability > 5);
        console.log(`• Strategies with >5% edge: ${profitableStrategies.length}/${results.length}`);
        
        if (profitableStrategies.length > 0) {
            console.log('• These edges may indicate genuine market inefficiencies at extreme values');
        }
    }
}

if (require.main === module) {
    const analyzer = new AnalyzeTopStrategies();
    analyzer.runAnalysis();
}

module.exports = AnalyzeTopStrategies;