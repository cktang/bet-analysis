const fs = require('fs');
const path = require('path');

/**
 * Detailed AH Strategy Tester with Full Betting Records
 * Clears output directory and creates detailed CSV records for every bet
 */
class DetailedAHStrategyTester {
    constructor() {
        this.outputDir = path.join(__dirname, 'betting_records');
        this.clearOutputDirectory();
        console.log('🗂️  Betting records directory cleared and ready');
    }

    /**
     * Clear the output directory before each run
     */
    clearOutputDirectory() {
        if (fs.existsSync(this.outputDir)) {
            const files = fs.readdirSync(this.outputDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(this.outputDir, file));
            });
        } else {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Load all match data from processed files
     */
    loadMatchData() {
        const seasons = ['2022-2023', '2023-2024', '2024-2025'];
        let allMatches = [];
        
        seasons.forEach(season => {
            const filePath = path.join(__dirname, `data/processed/year-${season}.json`);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const matches = Object.values(data.matches);
                allMatches = allMatches.concat(matches);
                console.log(`📊 Loaded ${matches.length} matches from ${season}`);
            }
        });
        
        console.log(`🎯 Total matches loaded: ${allMatches.length}\n`);
        return allMatches;
    }

    /**
     * Test Level (0) AH Strategy - Away Side Bias
     * This tests the claimed 17.9% edge on away teams in level handicap games
     */
    testLevelHandicapAwayStrategy() {
        console.log('🔍 TESTING LEVEL (0) HANDICAP AWAY STRATEGY\n');
        
        const allMatches = this.loadMatchData();
        const levelHandicapMatches = [];
        const bettingRecords = [];
        
        // Filter for level handicap matches
        allMatches.forEach(match => {
            const ah = match.match?.asianHandicapOdds;
            if (!ah || !ah.homeHandicap) return;
            
            // Check for level handicap (0 or "0")
            if (ah.homeHandicap === '0' || ah.homeHandicap === 0) {
                levelHandicapMatches.push(match);
                
                // Create betting record for away side
                const homeScore = match.match.homeScore;
                const awayScore = match.match.awayScore;
                const awayOdds = ah.awayOdds;
                const betAmount = 100; // Standard bet amount
                
                // Determine outcome for away bet
                let betResult = 'LOSE';
                let profit = -betAmount;
                
                if (awayScore > homeScore) {
                    betResult = 'WIN';
                    profit = betAmount * (awayOdds - 1);
                } else if (awayScore === homeScore) {
                    betResult = 'PUSH';
                    profit = 0;
                }
                
                bettingRecords.push({
                    date: match.match.date,
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    homeScore,
                    awayScore,
                    handicap: ah.homeHandicap,
                    betSide: 'AWAY',
                    odds: awayOdds,
                    impliedProbability: (1 / awayOdds * 100).toFixed(2) + '%',
                    betAmount,
                    result: betResult,
                    profit,
                    runningProfit: 0 // Will be calculated later
                });
            }
        });
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += record.profit;
            record.runningProfit = runningTotal;
        });
        
        // Calculate statistics
        const totalBets = bettingRecords.length;
        const wins = bettingRecords.filter(r => r.result === 'WIN').length;
        const losses = bettingRecords.filter(r => r.result === 'LOSE').length;
        const pushes = bettingRecords.filter(r => r.result === 'PUSH').length;
        const totalProfit = bettingRecords.reduce((sum, r) => sum + r.profit, 0);
        const winRate = (wins / totalBets * 100).toFixed(2);
        const profitability = (totalProfit / (totalBets * 100) * 100).toFixed(2);
        const avgImpliedProb = bettingRecords.reduce((sum, r) => sum + parseFloat(r.impliedProbability), 0) / totalBets;
        
        console.log('📋 LEVEL HANDICAP AWAY STRATEGY RESULTS:');
        console.log(`  📊 Total bets: ${totalBets}`);
        console.log(`  ✅ Wins: ${wins} (${winRate}%)`);
        console.log(`  ❌ Losses: ${losses} (${((losses/totalBets)*100).toFixed(2)}%)`);
        console.log(`  🤝 Pushes: ${pushes} (${((pushes/totalBets)*100).toFixed(2)}%)`);
        console.log(`  💰 Total profit: $${totalProfit.toFixed(2)}`);
        console.log(`  📈 Profitability: ${profitability}%`);
        console.log(`  🎯 Average implied probability: ${avgImpliedProb.toFixed(2)}%`);
        console.log(`  📊 Actual win rate vs implied: ${winRate}% vs ${avgImpliedProb.toFixed(2)}%`);
        console.log(`  🔍 Edge: ${(parseFloat(winRate) - avgImpliedProb).toFixed(2)}%\n`);
        
        // Save detailed records to CSV
        const csvHeaders = [
            'Date', 'Home Team', 'Away Team', 'Home Score', 'Away Score', 
            'Handicap', 'Bet Side', 'Odds', 'Implied Prob', 'Bet Amount', 
            'Result', 'Profit', 'Running Profit'
        ];
        
        const csvRows = bettingRecords.map(record => [
            record.date,
            record.homeTeam,
            record.awayTeam,
            record.homeScore,
            record.awayScore,
            record.handicap,
            record.betSide,
            record.odds,
            record.impliedProbability,
            record.betAmount,
            record.result,
            record.profit.toFixed(2),
            record.runningProfit.toFixed(2)
        ]);
        
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        const csvFilePath = path.join(this.outputDir, 'level_handicap_away_strategy.csv');
        fs.writeFileSync(csvFilePath, csvContent);
        
        // Save summary
        const summary = {
            strategy: 'Level Handicap Away Strategy',
            totalBets,
            wins,
            losses,
            pushes,
            winRate: parseFloat(winRate),
            totalProfit,
            profitability: parseFloat(profitability),
            avgImpliedProbability: avgImpliedProb,
            edge: parseFloat(winRate) - avgImpliedProb,
            generatedAt: new Date().toISOString()
        };
        
        const summaryFilePath = path.join(this.outputDir, 'level_handicap_away_strategy_summary.json');
        fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2));
        
        console.log(`💾 Detailed betting records saved to: ${csvFilePath}`);
        console.log(`📊 Strategy summary saved to: ${summaryFilePath}\n`);
        
        return summary;
    }

    /**
     * Test specific AH values for profitability patterns
     */
    testSpecificAHValues() {
        console.log('🔍 TESTING ALL SPECIFIC AH VALUES\n');
        
        const allMatches = this.loadMatchData();
        const ahValueResults = {};
        const allBettingRecords = [];
        
        // Analyze each match
        allMatches.forEach(match => {
            const ah = match.match?.asianHandicapOdds;
            if (!ah || !ah.homeHandicap) return;
            
            const handicap = ah.homeHandicap.toString();
            
            if (!ahValueResults[handicap]) {
                ahValueResults[handicap] = {
                    handicap,
                    totalBets: 0,
                    homeBets: [],
                    awayBets: [],
                    homeWins: 0,
                    awayWins: 0,
                    pushes: 0
                };
            }
            
            const result = ahValueResults[handicap];
            result.totalBets++;
            
            const homeScore = match.match.homeScore;
            const awayScore = match.match.awayScore;
            const betAmount = 100;
            
            // Test both home and away bets for this handicap
            const homeRecord = this.calculateAHBet(match, 'HOME', handicap, betAmount);
            const awayRecord = this.calculateAHBet(match, 'AWAY', handicap, betAmount);
            
            result.homeBets.push(homeRecord);
            result.awayBets.push(awayRecord);
            
            // Track outcomes
            if (homeRecord.result === 'WIN') result.homeWins++;
            if (awayRecord.result === 'WIN') result.awayWins++;
            if (homeRecord.result === 'PUSH') result.pushes++;
            
            allBettingRecords.push(homeRecord, awayRecord);
        });
        
        // Generate results for each AH value
        const ahAnalysisResults = [];
        
        Object.keys(ahValueResults).forEach(handicap => {
            const data = ahValueResults[handicap];
            
            if (data.totalBets >= 10) { // Minimum sample size
                const homeProfit = data.homeBets.reduce((sum, bet) => sum + bet.profit, 0);
                const awayProfit = data.awayBets.reduce((sum, bet) => sum + bet.profit, 0);
                const homeProfitability = (homeProfit / (data.totalBets * 100) * 100);
                const awayProfitability = (awayProfit / (data.totalBets * 100) * 100);
                
                const homeWinRate = (data.homeBets.filter(b => b.result === 'WIN').length / data.totalBets * 100);
                const awayWinRate = (data.awayBets.filter(b => b.result === 'WIN').length / data.totalBets * 100);
                
                const avgHomeOdds = data.homeBets.reduce((sum, bet) => sum + bet.odds, 0) / data.totalBets;
                const avgAwayOdds = data.awayBets.reduce((sum, bet) => sum + bet.odds, 0) / data.totalBets;
                
                ahAnalysisResults.push({
                    handicap,
                    totalBets: data.totalBets,
                    homeWinRate: homeWinRate.toFixed(2),
                    awayWinRate: awayWinRate.toFixed(2),
                    homeProfitability: homeProfitability.toFixed(2),
                    awayProfitability: awayProfitability.toFixed(2),
                    avgHomeOdds: avgHomeOdds.toFixed(2),
                    avgAwayOdds: avgAwayOdds.toFixed(2),
                    bestSide: Math.abs(homeProfitability) > Math.abs(awayProfitability) ? 'HOME' : 'AWAY',
                    bestProfitability: Math.max(Math.abs(homeProfitability), Math.abs(awayProfitability)).toFixed(2)
                });
            }
        });
        
        // Sort by profitability
        ahAnalysisResults.sort((a, b) => parseFloat(b.bestProfitability) - parseFloat(a.bestProfitability));
        
        console.log('🏆 MOST PROFITABLE AH VALUES:\n');
        ahAnalysisResults.slice(0, 10).forEach((result, index) => {
            console.log(`${index + 1}. ${result.handicap} (${result.totalBets} bets)`);
            console.log(`   Best: ${result.bestSide} side with ${result.bestProfitability}% edge`);
            console.log(`   Home: ${result.homeWinRate}% win rate, ${result.homeProfitability}% profit`);
            console.log(`   Away: ${result.awayWinRate}% win rate, ${result.awayProfitability}% profit\n`);
        });
        
        // Save all betting records
        const csvHeaders = [
            'Date', 'Home Team', 'Away Team', 'Home Score', 'Away Score', 
            'Handicap', 'Bet Side', 'Odds', 'Implied Prob', 'Bet Amount', 
            'Result', 'Profit'
        ];
        
        const csvRows = allBettingRecords.map(record => [
            record.date,
            record.homeTeam,
            record.awayTeam,
            record.homeScore,
            record.awayScore,
            record.handicap,
            record.betSide,
            record.odds,
            record.impliedProbability,
            record.betAmount,
            record.result,
            record.profit.toFixed(2)
        ]);
        
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        const csvFilePath = path.join(this.outputDir, 'all_ah_values_detailed.csv');
        fs.writeFileSync(csvFilePath, csvContent);
        
        // Save analysis summary
        const summaryFilePath = path.join(this.outputDir, 'ah_values_analysis_summary.json');
        fs.writeFileSync(summaryFilePath, JSON.stringify(ahAnalysisResults, null, 2));
        
        console.log(`💾 All betting records saved to: ${csvFilePath}`);
        console.log(`📊 AH values analysis saved to: ${summaryFilePath}\n`);
    }

    /**
     * Calculate AH bet result for a specific match and side
     */
    calculateAHBet(match, betSide, handicap, betAmount) {
        const ah = match.match.asianHandicapOdds;
        const homeScore = match.match.homeScore;
        const awayScore = match.match.awayScore;
        const odds = betSide === 'HOME' ? ah.homeOdds : ah.awayOdds;
        
        // Parse handicap value
        let handicapValue = 0;
        if (handicap.includes('/')) {
            // Quarter ball handicap
            const parts = handicap.split('/');
            handicapValue = (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
        } else {
            handicapValue = parseFloat(handicap) || 0;
        }
        
        // Apply handicap
        let adjHomeScore = homeScore;
        let adjAwayScore = awayScore;
        
        if (betSide === 'HOME') {
            adjHomeScore += handicapValue;
        } else {
            adjAwayScore -= handicapValue;
        }
        
        // Determine result
        let result = 'LOSE';
        let profit = -betAmount;
        
        if (betSide === 'HOME') {
            if (adjHomeScore > adjAwayScore) {
                result = 'WIN';
                profit = betAmount * (odds - 1);
            } else if (adjHomeScore === adjAwayScore) {
                result = 'PUSH';
                profit = 0;
            }
        } else {
            if (adjAwayScore > adjHomeScore) {
                result = 'WIN';
                profit = betAmount * (odds - 1);
            } else if (adjAwayScore === adjHomeScore) {
                result = 'PUSH';
                profit = 0;
            }
        }
        
        return {
            date: match.match.date,
            homeTeam: match.match.homeTeam,
            awayTeam: match.match.awayTeam,
            homeScore,
            awayScore,
            handicap,
            betSide,
            odds,
            impliedProbability: (1 / odds * 100).toFixed(2) + '%',
            betAmount,
            result,
            profit
        };
    }

    /**
     * Run all strategy tests
     */
    runAllTests() {
        console.log('🚀 DETAILED AH STRATEGY TESTING SYSTEM\n');
        console.log('This system will:');
        console.log('1. Clear the betting_records directory');
        console.log('2. Test Level (0) AH Away strategy to verify the 17.9% edge claim');
        console.log('3. Test all specific AH values for profitability patterns');
        console.log('4. Generate detailed CSV files with every single bet\n');
        
        // Test Level Handicap Away Strategy
        const levelStrategy = this.testLevelHandicapAwayStrategy();
        
        // Test all AH values
        this.testSpecificAHValues();
        
        console.log('✅ ALL TESTS COMPLETED');
        console.log(`📁 Check the betting_records directory for detailed CSV files`);
        console.log(`🎯 Level Handicap Away Strategy showed ${levelStrategy.profitability}% profitability (claimed 17.9%)`);
    }
}

// Run the tests
const tester = new DetailedAHStrategyTester();
tester.runAllTests();