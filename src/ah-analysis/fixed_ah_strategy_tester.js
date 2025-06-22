const fs = require('fs');
const path = require('path');

/**
 * FIXED AH Strategy Tester - Only One Bet Per Match
 * Tests actual betting strategies, not both sides simultaneously
 */
class FixedAHStrategyTester {
    constructor() {
        this.outputDir = path.join(__dirname, 'betting_records');
        this.clearOutputDirectory();
        console.log('🗂️  Betting records directory cleared and ready');
    }

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
     * Test Level (0) Handicap Away Strategy - ONLY betting away side
     */
    testLevelHandicapAwayStrategyFixed() {
        console.log('🔍 TESTING LEVEL (0) HANDICAP AWAY STRATEGY - FIXED VERSION\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        // Filter for level handicap matches and bet ONLY on away side
        allMatches.forEach(match => {
            const ah = match.match?.asianHandicapOdds;
            if (!ah || !ah.homeHandicap) return;
            
            // Check for level handicap (0)
            if (ah.homeHandicap === '0' || ah.homeHandicap === 0) {
                const homeScore = match.match.homeScore;
                const awayScore = match.match.awayScore;
                const awayOdds = ah.awayOdds;
                const betAmount = 100;
                
                // Strategy: Always bet AWAY on level handicap
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
                    runningProfit: 0
                });
            }
        });
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += record.profit;
            record.runningProfit = runningTotal;
        });
        
        this.printAndSaveResults('Level_0_Away_Strategy_FIXED', bettingRecords);
        return this.calculateSummary('Level (0) Away Strategy', bettingRecords);
    }

    /**
     * Test Quarter-Ball vs Full-Ball patterns - ONE side selection based on strategy
     */
    testQuarterBallStrategy() {
        console.log('🔍 TESTING 0/-0.5 AWAY STRATEGY - ONE BET PER MATCH\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        // Strategy: Bet AWAY on 0/-0.5 handicap (quarter-ball)
        allMatches.forEach(match => {
            const ah = match.match?.asianHandicapOdds;
            if (!ah || !ah.homeHandicap) return;
            
            // Check for 0/-0.5 handicap
            if (ah.homeHandicap === '0/-0.5') {
                const homeScore = match.match.homeScore;
                const awayScore = match.match.awayScore;
                const awayOdds = ah.awayOdds;
                const betAmount = 100;
                
                // Calculate quarter-ball result for away bet
                // Away gets +0.25 handicap on average
                let betResult = 'LOSE';
                let profit = -betAmount;
                
                if (awayScore > homeScore) {
                    // Away wins outright - full win
                    betResult = 'WIN';
                    profit = betAmount * (awayOdds - 1);
                } else if (awayScore === homeScore) {
                    // Draw - half win for away (+0.5) and half push for away (0)
                    betResult = 'HALF_WIN';
                    profit = (betAmount * (awayOdds - 1)) / 2;
                } else {
                    // Away loses - full loss
                    betResult = 'LOSE';
                    profit = -betAmount;
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
                    runningProfit: 0
                });
            }
        });
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += record.profit;
            record.runningProfit = runningTotal;
        });
        
        this.printAndSaveResults('Quarter_Ball_0_minus0.5_Away_Strategy', bettingRecords);
        return this.calculateSummary('0/-0.5 Away Strategy', bettingRecords);
    }

    /**
     * Test best performing strategies from previous analysis - ONE bet per match
     */
    testBestStrategies() {
        console.log('🔍 TESTING BEST PERFORMING STRATEGIES - ONE BET PER MATCH\n');
        
        const allMatches = this.loadMatchData();
        const strategies = [
            { name: 'Away_on_minus2_minus2.5', handicap: '-2/-2.5', side: 'AWAY' },
            { name: 'Away_on_minus1_minus1.5', handicap: '-1/-1.5', side: 'AWAY' },
            { name: 'Home_on_minus0.5_minus1', handicap: '-0.5/-1', side: 'HOME' }
        ];
        
        const strategyResults = [];
        
        strategies.forEach(strategy => {
            console.log(`Testing ${strategy.name}...`);
            
            const bettingRecords = [];
            
            allMatches.forEach(match => {
                const ah = match.match?.asianHandicapOdds;
                if (!ah || !ah.homeHandicap) return;
                
                if (ah.homeHandicap === strategy.handicap) {
                    const homeScore = match.match.homeScore;
                    const awayScore = match.match.awayScore;
                    const odds = strategy.side === 'HOME' ? ah.homeOdds : ah.awayOdds;
                    const betAmount = 100;
                    
                    const result = this.calculateQuarterBallResult(
                        homeScore, awayScore, strategy.handicap, strategy.side, odds, betAmount
                    );
                    
                    bettingRecords.push({
                        date: match.match.date,
                        homeTeam: match.match.homeTeam,
                        awayTeam: match.match.awayTeam,
                        homeScore,
                        awayScore,
                        handicap: strategy.handicap,
                        betSide: strategy.side,
                        odds,
                        impliedProbability: (1 / odds * 100).toFixed(2) + '%',
                        betAmount,
                        result: result.result,
                        profit: result.profit,
                        runningProfit: 0
                    });
                }
            });
            
            // Calculate running profit
            let runningTotal = 0;
            bettingRecords.forEach(record => {
                runningTotal += record.profit;
                record.runningProfit = runningTotal;
            });
            
            if (bettingRecords.length > 0) {
                this.printAndSaveResults(strategy.name, bettingRecords);
                const summary = this.calculateSummary(strategy.name, bettingRecords);
                strategyResults.push(summary);
            }
        });
        
        return strategyResults;
    }

    /**
     * Calculate quarter-ball handicap result properly
     */
    calculateQuarterBallResult(homeScore, awayScore, handicap, betSide, odds, betAmount) {
        // Parse quarter-ball handicap
        const parts = handicap.split('/');
        const handicap1 = parseFloat(parts[0]);
        const handicap2 = parseFloat(parts[1]);
        
        let result = 'LOSE';
        let profit = -betAmount;
        
        if (betSide === 'HOME') {
            // Apply handicaps to home team
            const adj1 = homeScore + handicap1;
            const adj2 = homeScore + handicap2;
            
            let wins = 0;
            let pushes = 0;
            
            if (adj1 > awayScore) wins++;
            else if (adj1 === awayScore) pushes++;
            
            if (adj2 > awayScore) wins++;
            else if (adj2 === awayScore) pushes++;
            
            if (wins === 2) {
                result = 'WIN';
                profit = betAmount * (odds - 1);
            } else if (wins === 1) {
                result = 'HALF_WIN';
                profit = (betAmount * (odds - 1)) / 2;
            } else if (pushes > 0) {
                result = 'HALF_PUSH';
                profit = -betAmount / 2;
            }
        } else {
            // Apply handicaps to away team (reverse)
            const adj1 = awayScore - handicap1;
            const adj2 = awayScore - handicap2;
            
            let wins = 0;
            let pushes = 0;
            
            if (adj1 > homeScore) wins++;
            else if (adj1 === homeScore) pushes++;
            
            if (adj2 > homeScore) wins++;
            else if (adj2 === homeScore) pushes++;
            
            if (wins === 2) {
                result = 'WIN';
                profit = betAmount * (odds - 1);
            } else if (wins === 1) {
                result = 'HALF_WIN';
                profit = (betAmount * (odds - 1)) / 2;
            } else if (pushes > 0) {
                result = 'HALF_PUSH';
                profit = -betAmount / 2;
            }
        }
        
        return { result, profit };
    }

    /**
     * Print results and save to files
     */
    printAndSaveResults(strategyName, bettingRecords) {
        const summary = this.calculateSummary(strategyName, bettingRecords);
        
        console.log(`📋 ${strategyName.toUpperCase()} RESULTS:`);
        console.log(`  📊 Total bets: ${summary.totalBets}`);
        console.log(`  ✅ Wins: ${summary.wins} (${summary.winRate}%)`);
        console.log(`  ❌ Losses: ${summary.losses}`);  
        console.log(`  🤝 Pushes/Half-wins: ${summary.other}`);
        console.log(`  💰 Total profit: $${summary.totalProfit.toFixed(2)}`);
        console.log(`  📈 ROI: ${summary.profitability}%`);
        console.log(`  🎯 Avg implied prob: ${summary.avgImpliedProbability.toFixed(2)}%`);
        console.log(`  🔍 Edge: ${summary.edge.toFixed(2)}%\n`);
        
        // Save to CSV
        const csvHeaders = [
            'Date', 'Home Team', 'Away Team', 'Home Score', 'Away Score', 
            'Handicap', 'Bet Side', 'Odds', 'Implied Prob', 'Bet Amount', 
            'Result', 'Profit', 'Running Profit'
        ];
        
        const csvRows = bettingRecords.map(record => [
            record.date, record.homeTeam, record.awayTeam, record.homeScore, 
            record.awayScore, record.handicap, record.betSide, record.odds,
            record.impliedProbability, record.betAmount, record.result,
            record.profit.toFixed(2), record.runningProfit.toFixed(2)
        ]);
        
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        const csvFilePath = path.join(this.outputDir, `${strategyName}.csv`);
        fs.writeFileSync(csvFilePath, csvContent);
        
        // Save summary
        const summaryFilePath = path.join(this.outputDir, `${strategyName}_summary.json`);
        fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2));
        
        console.log(`💾 Records saved to: ${csvFilePath.split('/').pop()}`);
    }

    /**
     * Calculate strategy summary statistics
     */
    calculateSummary(strategyName, bettingRecords) {
        const totalBets = bettingRecords.length;
        const wins = bettingRecords.filter(r => r.result === 'WIN' || r.result === 'HALF_WIN').length;
        const losses = bettingRecords.filter(r => r.result === 'LOSE').length;
        const other = totalBets - wins - losses;
        const totalProfit = bettingRecords.reduce((sum, r) => sum + r.profit, 0);
        const winRate = (wins / totalBets * 100);
        const profitability = (totalProfit / (totalBets * 100) * 100);
        const avgImpliedProbability = bettingRecords.reduce((sum, r) => sum + parseFloat(r.impliedProbability), 0) / totalBets;
        const edge = winRate - avgImpliedProbability;
        
        return {
            strategy: strategyName,
            totalBets,
            wins,
            losses,
            other,
            winRate: winRate.toFixed(2),
            totalProfit,
            profitability: profitability.toFixed(2),
            avgImpliedProbability,
            edge,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Run all fixed strategy tests
     */
    runAllFixedTests() {
        console.log('🚀 FIXED AH STRATEGY TESTING SYSTEM\n');
        console.log('Key Changes:');
        console.log('✅ Only ONE bet per match (not both sides)');
        console.log('✅ Proper quarter-ball handicap calculations');
        console.log('✅ Strategy-based betting decisions\n');
        
        // Test strategies with proper single-side betting
        const levelStrategy = this.testLevelHandicapAwayStrategyFixed();
        const quarterStrategy = this.testQuarterBallStrategy();
        const bestStrategies = this.testBestStrategies();
        
        console.log('✅ ALL FIXED TESTS COMPLETED');
        console.log(`📁 Check betting_records/ for detailed CSV files`);
        console.log(`🎯 Level (0) Away Strategy: ${levelStrategy.profitability}% ROI`);
        console.log(`🎲 0/-0.5 Away Strategy: ${quarterStrategy.profitability}% ROI`);
    }
}

// Run the fixed tests
const tester = new FixedAHStrategyTester();
tester.runAllFixedTests();