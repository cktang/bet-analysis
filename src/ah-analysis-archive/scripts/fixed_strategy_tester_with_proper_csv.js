const fs = require('fs');
const path = require('path');

/**
 * Fixed Strategy Tester with Proper CSV Output in src/ah-analysis/
 */
class FixedStrategyTesterWithCSV {
    constructor() {
        this.outputDir = path.join(__dirname, 'detailed_betting_records');
        this.ensureOutputDirectory();
        console.log(`📁 Output directory: ${this.outputDir}`);
    }

    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log(`✅ Created output directory: ${this.outputDir}`);
        } else {
            // Clear existing files
            const files = fs.readdirSync(this.outputDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(this.outputDir, file));
            });
            console.log(`🗑️  Cleared ${files.length} existing files`);
        }
    }

    loadMatchData() {
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        let allMatches = [];
        
        seasons.forEach(season => {
            const filePath = path.join(__dirname, `../../data/processed/year-${season}.json`);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const matches = Object.values(data.matches);
                allMatches = allMatches.concat(matches);
                console.log(`📊 Loaded ${matches.length} matches from ${season}`);
            } else {
                console.log(`❌ File not found: ${filePath}`);
            }
        });
        
        console.log(`🎯 Total matches loaded: ${allMatches.length}\\n`);
        return allMatches;
    }

    /**
     * Test Proper Relegation Strategy (Week 25+) with detailed CSV output
     */
    testProperRelegationStrategy() {
        console.log('🔍 TESTING PROPER RELEGATION STRATEGY (Week 25+ only)\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        allMatches.forEach(match => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            
            // Only consider late season matches (week 25+) when relegation pressure is real
            if (!week || week < 25 || !homePos || !awayPos) return;
            
            // Calculate PROPER relegation pressure (positions 18+)
            const homeRelegationPressure = Math.max(0, homePos - 17);
            const awayRelegationPressure = Math.max(0, awayPos - 17);
            const totalRelegationPressure = homeRelegationPressure + awayRelegationPressure;
            
            // Only bet when there's actual relegation pressure involved
            if (totalRelegationPressure > 0) {
                
                // Strategy Logic: Bet on team with LESS relegation pressure
                let betSide, odds;
                if (homeRelegationPressure < awayRelegationPressure) {
                    betSide = 'HOME';
                    odds = match.match?.asianHandicapOdds?.homeOdds || 1.9;
                } else if (awayRelegationPressure < homeRelegationPressure) {
                    betSide = 'AWAY';
                    odds = match.match?.asianHandicapOdds?.awayOdds || 1.9;
                } else {
                    // Equal pressure - skip bet
                    return;
                }
                
                const betAmount = 100;
                const homeScore = match.match.homeScore;
                const awayScore = match.match.awayScore;
                
                let result = 'LOSE';
                let profit = -betAmount;
                
                if ((betSide === 'HOME' && homeScore > awayScore) || 
                    (betSide === 'AWAY' && awayScore > homeScore)) {
                    result = 'WIN';
                    profit = betAmount * (odds - 1);
                } else if (homeScore === awayScore) {
                    result = 'PUSH';
                    profit = 0;
                }
                
                bettingRecords.push({
                    matchId: match.match.id || `${match.match.date}_${match.match.homeTeam}_${match.match.awayTeam}`,
                    date: match.match.date,
                    season: match.match.date.includes('2022') ? '2022-2023' : 
                           match.match.date.includes('2023') ? '2023-2024' : '2024-2025',
                    week,
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    homePos,
                    awayPos,
                    homeRelegationPressure,
                    awayRelegationPressure,
                    totalRelegationPressure,
                    homeScore,
                    awayScore,
                    actualResult: homeScore > awayScore ? 'HOME_WIN' : 
                                 awayScore > homeScore ? 'AWAY_WIN' : 'DRAW',
                    betSide,
                    odds: odds.toFixed(2),
                    impliedProbability: (1/odds*100).toFixed(1) + '%',
                    betAmount,
                    result,
                    profit: profit.toFixed(2),
                    runningProfit: 0,
                    strategy: 'Proper_Relegation_Week25Plus'
                });
            }
        });
        
        // Sort by date
        bettingRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += parseFloat(record.profit);
            record.runningProfit = runningTotal.toFixed(2);
        });
        
        this.printAndSaveResults('Proper_Relegation_Strategy_Week25Plus', bettingRecords);
        return this.calculateSummary(bettingRecords);
    }

    /**
     * Test Early Season Volatility Strategy with detailed CSV
     */
    testEarlySeasonVolatilityStrategy() {
        console.log('🔍 TESTING EARLY SEASON VOLATILITY STRATEGY (Week 2-8)\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        allMatches.forEach(match => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            
            // Only consider early season (week 2-8) when positions are volatile
            if (!week || week < 2 || week > 8 || !homePos || !awayPos) return;
            
            // Strategy: Look for big position gaps in early season (>8 positions apart)
            const positionGap = Math.abs(homePos - awayPos);
            
            if (positionGap >= 8) {
                // Bet on the team with better position (lower number)
                const betSide = homePos < awayPos ? 'HOME' : 'AWAY';
                const odds = betSide === 'HOME' ? 
                    (match.match?.asianHandicapOdds?.homeOdds || 1.8) : 
                    (match.match?.asianHandicapOdds?.awayOdds || 1.8);
                
                const betAmount = 100;
                const homeScore = match.match.homeScore;
                const awayScore = match.match.awayScore;
                
                let result = 'LOSE';
                let profit = -betAmount;
                
                if ((betSide === 'HOME' && homeScore > awayScore) || 
                    (betSide === 'AWAY' && awayScore > homeScore)) {
                    result = 'WIN';
                    profit = betAmount * (odds - 1);
                } else if (homeScore === awayScore) {
                    result = 'PUSH';
                    profit = 0;
                }
                
                bettingRecords.push({
                    matchId: match.match.id || `${match.match.date}_${match.match.homeTeam}_${match.match.awayTeam}`,
                    date: match.match.date,
                    season: match.match.date.includes('2022') ? '2022-2023' : 
                           match.match.date.includes('2023') ? '2023-2024' : '2024-2025',
                    week,
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    homePos,
                    awayPos,
                    positionGap,
                    homeScore,
                    awayScore,
                    actualResult: homeScore > awayScore ? 'HOME_WIN' : 
                                 awayScore > homeScore ? 'AWAY_WIN' : 'DRAW',
                    betSide,
                    odds: odds.toFixed(2),
                    impliedProbability: (1/odds*100).toFixed(1) + '%',
                    betAmount,
                    result,
                    profit: profit.toFixed(2),
                    runningProfit: 0,
                    strategy: 'Early_Season_Volatility_Week2to8'
                });
            }
        });
        
        // Sort by date
        bettingRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += parseFloat(record.profit);
            record.runningProfit = runningTotal.toFixed(2);
        });
        
        this.printAndSaveResults('Early_Season_Volatility_Week2to8', bettingRecords);
        return this.calculateSummary(bettingRecords);
    }

    printAndSaveResults(strategyName, records) {
        const summary = this.calculateSummary(records);
        
        console.log(`📋 ${strategyName.toUpperCase()} RESULTS:`);
        console.log(`  📊 Total bets: ${summary.totalBets}`);
        console.log(`  ✅ Wins: ${summary.wins} (${summary.winRate}%)`);
        console.log(`  ❌ Losses: ${summary.losses} (${summary.lossRate}%)`);
        console.log(`  🤝 Pushes: ${summary.pushes} (${summary.pushRate}%)`);
        console.log(`  💰 Total profit: $${summary.totalProfit.toFixed(2)}`);
        console.log(`  📈 ROI: ${summary.profitability}%`);
        console.log(`  📊 Average odds: ${summary.averageOdds}`);
        console.log(`  🎯 Sample matches:`);
        
        records.slice(0, 5).forEach((record, index) => {
            console.log(`    ${index+1}. Week ${record.week} (${record.season}): ${record.homeTeam}(${record.homePos}) vs ${record.awayTeam}(${record.awayPos})`);
            console.log(`       Score: ${record.homeScore}-${record.awayScore}, Bet: ${record.betSide} @${record.odds}, Result: ${record.result}, Profit: $${record.profit}`);
        });
        console.log();
        
        // Save detailed CSV
        this.saveDetailedCSV(strategyName, records);
        
        // Save summary JSON
        this.saveSummary(strategyName, summary, records);
    }

    saveDetailedCSV(strategyName, records) {
        const csvHeaders = [
            'Match_ID', 'Date', 'Season', 'Week', 'Home_Team', 'Away_Team', 
            'Home_Position', 'Away_Position', 'Position_Gap', 'Home_Score', 'Away_Score',
            'Actual_Result', 'Bet_Side', 'Odds', 'Implied_Probability', 'Bet_Amount',
            'Bet_Result', 'Profit', 'Running_Profit', 'Strategy'
        ];
        
        const csvRows = records.map(record => [
            record.matchId,
            record.date,
            record.season,
            record.week,
            `"${record.homeTeam}"`, // Quote team names to handle commas
            `"${record.awayTeam}"`,
            record.homePos,
            record.awayPos,
            record.positionGap || Math.abs(record.homePos - record.awayPos),
            record.homeScore,
            record.awayScore,
            record.actualResult,
            record.betSide,
            record.odds,
            record.impliedProbability,
            record.betAmount,
            record.result,
            record.profit,
            record.runningProfit,
            record.strategy
        ]);
        
        const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\\n');
        const csvFilePath = path.join(this.outputDir, `${strategyName}.csv`);
        
        try {
            fs.writeFileSync(csvFilePath, csvContent, 'utf8');
            console.log(`💾 Detailed CSV saved: ${csvFilePath}`);
            console.log(`📏 CSV file size: ${fs.statSync(csvFilePath).size} bytes`);
        } catch (error) {
            console.log(`❌ Error saving CSV: ${error.message}`);
        }
    }

    saveSummary(strategyName, summary, records) {
        const summaryData = {
            strategy: strategyName,
            generatedAt: new Date().toISOString(),
            summary,
            sampleBets: records.slice(0, 10),
            seasonBreakdown: this.getSeasonBreakdown(records)
        };
        
        const summaryFilePath = path.join(this.outputDir, `${strategyName}_summary.json`);
        
        try {
            fs.writeFileSync(summaryFilePath, JSON.stringify(summaryData, null, 2), 'utf8');
            console.log(`📊 Summary JSON saved: ${summaryFilePath}`);
        } catch (error) {
            console.log(`❌ Error saving summary: ${error.message}`);
        }
    }

    getSeasonBreakdown(records) {
        const breakdown = {};
        
        records.forEach(record => {
            if (!breakdown[record.season]) {
                breakdown[record.season] = {
                    totalBets: 0,
                    wins: 0,
                    losses: 0,
                    pushes: 0,
                    totalProfit: 0
                };
            }
            
            const season = breakdown[record.season];
            season.totalBets++;
            season.totalProfit += parseFloat(record.profit);
            
            if (record.result === 'WIN') season.wins++;
            else if (record.result === 'LOSE') season.losses++;
            else season.pushes++;
        });
        
        // Calculate percentages
        Object.keys(breakdown).forEach(season => {
            const data = breakdown[season];
            data.winRate = data.totalBets > 0 ? ((data.wins / data.totalBets) * 100).toFixed(2) + '%' : '0%';
            data.profitability = data.totalBets > 0 ? ((data.totalProfit / (data.totalBets * 100)) * 100).toFixed(2) + '%' : '0%';
        });
        
        return breakdown;
    }

    calculateSummary(records) {
        const totalBets = records.length;
        if (totalBets === 0) {
            return {
                totalBets: 0,
                wins: 0,
                losses: 0,
                pushes: 0,
                winRate: '0.00',
                lossRate: '0.00',
                pushRate: '0.00',
                totalProfit: 0,
                profitability: '0.00',
                averageOdds: '0.00'
            };
        }
        
        const wins = records.filter(r => r.result === 'WIN').length;
        const losses = records.filter(r => r.result === 'LOSE').length;
        const pushes = records.filter(r => r.result === 'PUSH').length;
        const totalProfit = records.reduce((sum, r) => sum + parseFloat(r.profit), 0);
        const avgOdds = records.reduce((sum, r) => sum + parseFloat(r.odds), 0) / totalBets;
        
        return {
            totalBets,
            wins,
            losses,
            pushes,
            winRate: (wins / totalBets * 100).toFixed(2),
            lossRate: (losses / totalBets * 100).toFixed(2),
            pushRate: (pushes / totalBets * 100).toFixed(2),
            totalProfit,
            profitability: (totalProfit / (totalBets * 100) * 100).toFixed(2),
            averageOdds: avgOdds.toFixed(2)
        };
    }

    runDetailedTests() {
        console.log('🚀 DETAILED STRATEGY TESTING WITH PROPER CSV OUTPUT\\n');
        console.log(`📁 All files will be saved to: ${this.outputDir}\\n`);
        
        const relegationResults = this.testProperRelegationStrategy();
        const earlyVolatilityResults = this.testEarlySeasonVolatilityStrategy();
        
        console.log('✅ TESTING COMPLETED\\n');
        console.log('📋 FINAL SUMMARY:\\n');
        
        console.log('1. Proper Relegation Strategy (Week 25+):');
        console.log(`   - ${relegationResults.totalBets} bets, ${relegationResults.profitability}% ROI`);
        console.log(`   - Win rate: ${relegationResults.winRate}%, Avg odds: ${relegationResults.averageOdds}`);
        
        console.log('\\n2. Early Season Volatility Strategy (Week 2-8):');
        console.log(`   - ${earlyVolatilityResults.totalBets} bets, ${earlyVolatilityResults.profitability}% ROI`);
        console.log(`   - Win rate: ${earlyVolatilityResults.winRate}%, Avg odds: ${earlyVolatilityResults.averageOdds}`);
        
        console.log(`\\n📁 Check ${this.outputDir} for detailed CSV files and summaries`);
        
        return {
            relegation: relegationResults,
            earlyVolatility: earlyVolatilityResults
        };
    }
}

// Run the detailed tests
const tester = new FixedStrategyTesterWithCSV();
tester.runDetailedTests();