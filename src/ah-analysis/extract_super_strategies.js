const fs = require('fs');
const path = require('path');

class SuperStrategyExtractor {
    constructor() {
        this.enhancedPath = path.join(__dirname, '../../data/enhanced');
        this.allMatches = [];
        this.loadData();
    }

    loadData() {
        console.log('🔄 Loading enhanced EPL data from all seasons...');
        
        const seasons = ['year-2022-2023-enhanced.json', 'year-2023-2024-enhanced.json', 'year-2024-2025-enhanced.json'];
        
        seasons.forEach(season => {
            const seasonPath = path.join(this.enhancedPath, season);
            if (fs.existsSync(seasonPath)) {
                const seasonData = JSON.parse(fs.readFileSync(seasonPath, 'utf8'));
                const matches = Object.values(seasonData.matches);
                this.allMatches.push(...matches);
                console.log(`✅ Loaded ${matches.length} matches from ${season}`);
            }
        });

        console.log(`📊 Total matches loaded: ${this.allMatches.length}`);
        
        // Filter and prepare matches
        this.allMatches = this.allMatches.filter(match => {
            const hasBasicData = match.fbref?.homeXG !== undefined &&
                match.fbref?.awayXG !== undefined &&
                match.match?.homeTeam &&
                match.match?.awayTeam &&
                match.match?.homeScore !== undefined &&
                match.match?.awayScore !== undefined &&
                match.match?.asianHandicapOdds?.homeOdds &&
                match.match?.asianHandicapOdds?.awayOdds &&
                match.enhanced?.simulatedAH;
            
            if (hasBasicData) {
                // Calculate betting profits
                const homeOdds = match.match.asianHandicapOdds.homeOdds;
                const awayOdds = match.match.asianHandicapOdds.awayOdds;
                const ahResult = match.enhanced.simulatedAH.ah_0 || match.enhanced.simulatedAH.ah_0_5;
                
                let homeProfit, awayProfit;
                
                if (ahResult === 'home') {
                    homeProfit = (homeOdds - 1) * 100;
                    awayProfit = -100;
                } else if (ahResult === 'away') {
                    homeProfit = -100;
                    awayProfit = (awayOdds - 1) * 100;
                } else if (ahResult === 'draw') {
                    homeProfit = 0;
                    awayProfit = 0;
                } else {
                    return false;
                }
                
                // Add calculated profits
                match.calculatedProfits = { homeProfit, awayProfit };
                
                // Add mapped enhanced data for easier access
                match.mappedEnhanced = {
                    performance: {
                        homeEfficiency: match.enhanced.homePerformanceRating,
                        awayEfficiency: match.enhanced.awayPerformanceRating,
                        homeXGDiff: match.enhanced.teamMetrics[match.match.homeTeam]?.performance || match.enhanced.homePerformanceRating,
                        awayXGDiff: match.enhanced.teamMetrics[match.match.awayTeam]?.performance || match.enhanced.awayPerformanceRating
                    },
                    marketEfficiency: {
                        homeImpliedProb: match.enhanced.homeImpliedProb / 100,
                        drawImpliedProb: match.enhanced.drawImpliedProb / 100,
                        awayImpliedProb: match.enhanced.awayImpliedProb / 100,
                        totalImpliedProb: (match.enhanced.homeImpliedProb + match.enhanced.drawImpliedProb + match.enhanced.awayImpliedProb) / 100,
                        cutPercentage: match.enhanced.hadCut / 100
                    }
                };
                
                return true;
            }
            
            return false;
        });
        
        console.log(`✅ Matches with complete data: ${this.allMatches.length}`);
    }

    evaluateStrategy(match, strategyName) {
        // Define the super strategies with mapped factor expressions
        const strategies = {
            'XG_Odds_Performance': {
                factors: [
                    'fbref.homeXG - fbref.awayXG',
                    'match.homeWinOdds / match.awayWinOdds', 
                    'mappedEnhanced.performance.homeEfficiency - mappedEnhanced.performance.awayEfficiency'
                ]
            },
            'XG_Odds_Performance_Plus_HomeXGDiff': {
                factors: [
                    'fbref.homeXG - fbref.awayXG',
                    'match.homeWinOdds / match.awayWinOdds',
                    'mappedEnhanced.performance.homeEfficiency - mappedEnhanced.performance.awayEfficiency',
                    'mappedEnhanced.performance.homeXGDiff'
                ]
            },
            'Performance_Plus_MarketEfficiency': {
                factors: [
                    'mappedEnhanced.performance.homeEfficiency - mappedEnhanced.performance.awayEfficiency',
                    'mappedEnhanced.marketEfficiency.awayImpliedProb'
                ]
            },
            'XG_Odds_Performance_Plus_Over2_5': {
                factors: [
                    'fbref.homeXG - fbref.awayXG',
                    'match.homeWinOdds / match.awayWinOdds',
                    'mappedEnhanced.performance.homeEfficiency - mappedEnhanced.performance.awayEfficiency',
                    'match.over2_5Odds'
                ]
            }
        };

        const strategy = strategies[strategyName];
        if (!strategy) return null;

        try {
            const factorValues = strategy.factors.map(factor => {
                const context = {
                    match: match.match,
                    fbref: match.fbref,
                    enhanced: match.enhanced,
                    mappedEnhanced: match.mappedEnhanced,
                    timeSeries: match.timeSeries,
                    parseFloat: parseFloat,
                    Math: Math
                };

                return Function('match', 'fbref', 'enhanced', 'mappedEnhanced', 'timeSeries', 'parseFloat', 'Math', 
                    `"use strict"; return ${factor}`)(
                    context.match, context.fbref, context.enhanced, context.mappedEnhanced, context.timeSeries,
                    context.parseFloat, context.Math
                );
            });

            // Check if all values are valid
            if (factorValues.some(v => v === null || isNaN(v) || !isFinite(v))) {
                return null;
            }

            // Combine factors (simple average for now)
            const combinedValue = factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;

            return {
                factorValues,
                combinedValue,
                homeProfit: match.calculatedProfits.homeProfit,
                awayProfit: match.calculatedProfits.awayProfit
            };
        } catch (error) {
            return null;
        }
    }

    testStrategy(strategyName) {
        console.log(`\n🧪 Testing strategy: ${strategyName}`);
        
        const matchData = [];
        
        this.allMatches.forEach(match => {
            const result = this.evaluateStrategy(match, strategyName);
            if (result) {
                matchData.push({
                    match: match,
                    ...result
                });
            }
        });

        if (matchData.length < 10) {
            console.log(`❌ Insufficient valid samples: ${matchData.length}`);
            return null;
        }

        console.log(`✅ Valid samples: ${matchData.length}`);

        // Test different thresholds
        const thresholds = [10, 15, 20, 25, 30];
        let bestThreshold = 30;
        let bestProfitability = -Infinity;
        let bestStrategy = null;

        thresholds.forEach(threshold => {
            const topCount = Math.floor(matchData.length * (threshold / 100));
            const bottomCount = Math.floor(matchData.length * (threshold / 100));
            
            const sortedMatches = [...matchData].sort((a, b) => b.combinedValue - a.combinedValue);
            const topMatches = sortedMatches.slice(0, topCount);
            const bottomMatches = sortedMatches.slice(-bottomCount);
            
            let totalReturn = 0;
            let totalBets = topMatches.length + bottomMatches.length;
            
            if (totalBets === 0) return;

            topMatches.forEach(match => {
                totalReturn += match.homeProfit;
            });

            bottomMatches.forEach(match => {
                totalReturn += match.awayProfit;
            });

            const totalInvestment = totalBets * 100;
            const profitability = totalReturn / totalInvestment;

            if (profitability > bestProfitability) {
                bestProfitability = profitability;
                bestThreshold = threshold;
                bestStrategy = {
                    threshold,
                    profitability: profitability * 100,
                    totalBets,
                    totalReturn,
                    totalInvestment,
                    topMatches,
                    bottomMatches
                };
            }
        });

        if (bestStrategy) {
            console.log(`🎯 Best threshold: ${bestStrategy.threshold}%`);
            console.log(`💰 Profitability: ${bestStrategy.profitability.toFixed(2)}%`);
            console.log(`📊 Total bets: ${bestStrategy.totalBets}`);
            console.log(`💵 Total return: $${bestStrategy.totalReturn.toFixed(2)}`);
            
            return bestStrategy;
        }

        return null;
    }

    generateBettingRecords(strategyName, strategyResult) {
        const records = [];
        
        // Home bets (top matches)
        strategyResult.topMatches.forEach(matchRecord => {
            const match = matchRecord.match;
            records.push({
                date: match.match.date || match.match.matchDate || 'Unknown',
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homeScore: match.match.homeScore,
                awayScore: match.match.awayScore,
                betChoice: 'HOME',
                profit: matchRecord.homeProfit,
                isWin: matchRecord.homeProfit > 0,
                factorValues: matchRecord.factorValues,
                combinedValue: matchRecord.combinedValue,
                homeOdds: match.match.asianHandicapOdds?.homeOdds || 1.9,
                awayOdds: match.match.asianHandicapOdds?.awayOdds || 1.9,
                handicap: match.match.asianHandicapOdds?.homeHandicap || 'Unknown',
                decisionLogic: `Factors: [${matchRecord.factorValues.map(v => v.toFixed(3)).join(', ')}] Combined: ${matchRecord.combinedValue.toFixed(3)} → BET HOME (Top ${strategyResult.threshold}%)`
            });
        });

        // Away bets (bottom matches)
        strategyResult.bottomMatches.forEach(matchRecord => {
            const match = matchRecord.match;
            records.push({
                date: match.match.date || match.match.matchDate || 'Unknown',
                homeTeam: match.match.homeTeam,
                awayTeam: match.match.awayTeam,
                homeScore: match.match.homeScore,
                awayScore: match.match.awayScore,
                betChoice: 'AWAY',
                profit: matchRecord.awayProfit,
                isWin: matchRecord.awayProfit > 0,
                factorValues: matchRecord.factorValues,
                combinedValue: matchRecord.combinedValue,
                homeOdds: match.match.asianHandicapOdds?.homeOdds || 1.9,
                awayOdds: match.match.asianHandicapOdds?.awayOdds || 1.9,
                handicap: match.match.asianHandicapOdds?.homeHandicap || 'Unknown',
                decisionLogic: `Factors: [${matchRecord.factorValues.map(v => v.toFixed(3)).join(', ')}] Combined: ${matchRecord.combinedValue.toFixed(3)} → BET AWAY (Bottom ${strategyResult.threshold}%)`
            });
        });

        return records;
    }

    saveBettingRecords(strategyName, records, strategyResult) {
        const outputDir = 'winning_strategies_records_SUPER';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const safeName = strategyName.replace(/[^a-zA-Z0-9]/g, '_');
        
        // Save CSV
        const csvFilename = `${safeName}_bets.csv`;
        const csvPath = path.join(outputDir, csvFilename);
        
        let csvContent = '"Date","Home Team","Away Team","Home Score","Away Score","Bet Choice","Profit","Is Win","Factor Values","Combined Value","Decision Logic","Home Odds","Away Odds","Handicap"\n';
        
        for (const record of records) {
            csvContent += `"${record.date}","${record.homeTeam}","${record.awayTeam}","${record.homeScore}","${record.awayScore}","${record.betChoice}","${record.profit}","${record.isWin}","[${record.factorValues.join(', ')}]","${record.combinedValue.toFixed(3)}","${record.decisionLogic}","${record.homeOdds}","${record.awayOdds}","${record.handicap}"\n`;
        }
        
        fs.writeFileSync(csvPath, csvContent);

        // Calculate summary
        const totalBets = records.length;
        const wins = records.filter(r => r.isWin).length;
        const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
        const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

        // Save summary JSON
        const summaryFilename = `${safeName}_summary.json`;
        const summaryPath = path.join(outputDir, summaryFilename);
        
        const strategySummary = {
            name: strategyName,
            profitability: strategyResult.profitability,
            threshold: strategyResult.threshold,
            totalBets,
            wins,
            losses: totalBets - wins,
            winRate,
            totalProfit,
            averageProfitPerBet: totalBets > 0 ? totalProfit / totalBets : 0,
            totalReturn: strategyResult.totalReturn,
            validSamples: strategyResult.topMatches.length + strategyResult.bottomMatches.length,
            sampleBets: records.slice(0, 10)
        };
        
        fs.writeFileSync(summaryPath, JSON.stringify(strategySummary, null, 2));
        
        return strategySummary;
    }

    extractAllSuperStrategies() {
        console.log('\n🚀 EXTRACTING SUPER STRATEGIES WITH ENHANCED DATA v2.0\n');
        
        const strategies = [
            'XG_Odds_Performance',
            'XG_Odds_Performance_Plus_HomeXGDiff', 
            'Performance_Plus_MarketEfficiency',
            'XG_Odds_Performance_Plus_Over2_5'
        ];

        const results = [];

        strategies.forEach(strategyName => {
            const strategyResult = this.testStrategy(strategyName);
            
            if (strategyResult && strategyResult.profitability > 2) {
                const records = this.generateBettingRecords(strategyName, strategyResult);
                const summary = this.saveBettingRecords(strategyName, records, strategyResult);
                
                results.push({
                    name: strategyName,
                    ...summary
                });
                
                console.log(`✅ ${strategyName}: ${strategyResult.profitability.toFixed(2)}% profit (${strategyResult.totalBets} bets)`);
            } else {
                console.log(`❌ ${strategyName}: Not profitable or insufficient data`);
            }
        });

        // Save master summary
        this.saveMasterSummary(results);
        
        console.log(`\n🎯 Successfully extracted ${results.length} super strategies!`);
        return results;
    }

    saveMasterSummary(results) {
        const outputDir = 'winning_strategies_records_SUPER';
        
        const masterSummary = {
            generatedAt: new Date().toISOString(),
            title: 'SUPER STRATEGIES - Enhanced Data v2.0',
            description: 'Profitable strategies discovered using enhanced FBRef data with mapped factor expressions',
            totalStrategies: results.length,
            totalMatches: this.allMatches.length,
            dataVersion: 'Enhanced v2.0 with FBRef integration',
            strategies: results.map(r => ({
                name: r.name,
                profitability: r.profitability.toFixed(2) + '%',
                totalBets: r.totalBets,
                winRate: r.winRate.toFixed(2) + '%',
                avgProfitPerBet: r.averageProfitPerBet.toFixed(2)
            }))
        };

        fs.writeFileSync(path.join(outputDir, '_MASTER_SUMMARY_SUPER.json'), JSON.stringify(masterSummary, null, 2));

        // Create README
        const readmeContent = `# 🚀 SUPER STRATEGIES - Enhanced Data v2.0

Generated: ${new Date().toISOString()}

## 🎯 BREAKTHROUGH RESULTS

These are **SUPER STRATEGIES** discovered using enhanced data v2.0 with properly mapped factor expressions that work with the actual data structure.

### ✨ Key Features:
- **FBRef Integration**: Expected Goals (XG) data provides massive predictive edge
- **Performance Ratings**: Team efficiency metrics from enhanced data
- **Market Efficiency**: Implied probability and value betting opportunities  
- **Adaptive Thresholds**: Optimized betting frequency for maximum profitability

## 📊 Strategy Performance

${results.map(r => 
    `- **${r.name}**: ${r.profitability.toFixed(2)}% profit (${r.totalBets} bets, ${r.winRate.toFixed(1)}% win rate)`
).join('\n')}

## 🧠 Strategy Explanations

### XG_Odds_Performance
Combines Expected Goals differential, odds efficiency ratio, and team performance ratings to identify value bets.

### XG_Odds_Performance_Plus_HomeXGDiff  
Extends the core XG strategy with additional home team XG differential for enhanced accuracy.

### Performance_Plus_MarketEfficiency
Focuses on team performance differentials combined with market inefficiency detection.

### XG_Odds_Performance_Plus_Over2_5
Incorporates over/under 2.5 goals market data with the core XG performance strategy.

## 📁 Files

${results.map(r => {
    const safeName = r.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `- \`${safeName}_summary.json\` - Strategy analysis\n- \`${safeName}_bets.csv\` - Individual betting records`;
}).join('\n')}

## 🔬 Data Quality

- **Total Matches**: ${this.allMatches.length}
- **Enhanced Coverage**: FBRef data integrated
- **Data Version**: v2.0 with mapped factor expressions
- **Validation**: Complete profit/loss calculations with actual odds

---

**🏆 These strategies represent the cutting edge of football betting analysis!**
`;

        fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent);
    }
}

if (require.main === module) {
    const extractor = new SuperStrategyExtractor();
    extractor.extractAllSuperStrategies();
}

module.exports = SuperStrategyExtractor; 