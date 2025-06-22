const fs = require('fs');
const path = require('path');

/**
 * Test Fixed Strategies - Compare before/after results
 */
class FixedStrategyTester {
    constructor() {
        this.outputDir = path.join(__dirname, 'betting_records');
        this.ensureOutputDirectory();
    }

    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
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
        
        console.log(`🎯 Total matches loaded: ${allMatches.length}\\n`);
        return allMatches;
    }

    /**
     * Test the old "relegation pressure" strategy (actually title race pressure)
     */
    testTitleRacePressureStrategy() {
        console.log('🔍 TESTING TITLE RACE PRESSURE STRATEGY (previously incorrectly named "relegation")\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        allMatches.forEach(match => {
            if (!match.timeSeries?.home?.leaguePosition || !match.timeSeries?.away?.leaguePosition) return;
            
            const homePos = match.timeSeries.home.leaguePosition;
            const awayPos = match.timeSeries.away.leaguePosition;
            
            // Original "relegation pressure" formula (actually measures top teams)
            const titleRacePressure = Math.max(0, 18 - homePos) + Math.max(0, 18 - awayPos);
            
            // Only bet on matches with high "title race pressure" (top teams playing)
            if (titleRacePressure >= 30) { // Threshold from original strategy
                const betSide = 'HOME'; // Original strategy logic
                const odds = match.match?.asianHandicapOdds?.homeOdds || 2.0;
                const betAmount = 100;
                
                const homeScore = match.match.homeScore;
                const awayScore = match.match.awayScore;
                
                let result = 'LOSE';
                let profit = -betAmount;
                
                if (homeScore > awayScore) {
                    result = 'WIN';
                    profit = betAmount * (odds - 1);
                } else if (homeScore === awayScore) {
                    result = 'PUSH';
                    profit = 0;
                }
                
                bettingRecords.push({
                    date: match.match.date,
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    homePos,
                    awayPos,
                    titleRacePressure,
                    homeScore,
                    awayScore,
                    betSide,
                    odds,
                    betAmount,
                    result,
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
        
        this.printResults('TITLE_RACE_PRESSURE', bettingRecords);
        this.saveResults('title_race_pressure_strategy', bettingRecords);
        
        return this.calculateSummary(bettingRecords);
    }

    /**
     * Test the new FIXED relegation pressure strategy
     */
    testFixedRelegationPressureStrategy() {
        console.log('🔍 TESTING FIXED RELEGATION PRESSURE STRATEGY\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        allMatches.forEach(match => {
            if (!match.timeSeries?.home?.leaguePosition || !match.timeSeries?.away?.leaguePosition) return;
            
            const homePos = match.timeSeries.home.leaguePosition;
            const awayPos = match.timeSeries.away.leaguePosition;
            
            // FIXED relegation pressure formula (measures bottom teams)
            const relegationPressure = Math.max(0, homePos - 17) + Math.max(0, awayPos - 17);
            
            // Only bet on matches with actual relegation pressure (teams in positions 18+)
            if (relegationPressure > 0) {
                // Strategy: Bet on the team with LESS relegation pressure (higher up the table)
                const betSide = homePos < awayPos ? 'HOME' : 'AWAY';
                const odds = betSide === 'HOME' ? 
                    (match.match?.asianHandicapOdds?.homeOdds || 2.0) : 
                    (match.match?.asianHandicapOdds?.awayOdds || 2.0);
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
                    date: match.match.date,
                    homeTeam: match.match.homeTeam,
                    awayTeam: match.match.awayTeam,
                    homePos,
                    awayPos,
                    relegationPressure,
                    homeScore,
                    awayScore,
                    betSide,
                    odds,
                    betAmount,
                    result,
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
        
        this.printResults('FIXED_RELEGATION_PRESSURE', bettingRecords);
        this.saveResults('fixed_relegation_pressure_strategy', bettingRecords);
        
        return this.calculateSummary(bettingRecords);
    }

    /**
     * Compare team positions to verify formulas work correctly
     */
    demonstrateFormulaFix() {
        console.log('🔍 DEMONSTRATING FORMULA FIX WITH REAL TEAM EXAMPLES\\n');
        
        const examples = [
            { team: 'Manchester City', position: 1 },
            { team: 'Arsenal', position: 2 },
            { team: 'Liverpool', position: 3 },
            { team: 'Newcastle', position: 7 },
            { team: 'Brighton', position: 12 },
            { team: 'Nottingham Forest', position: 16 },
            { team: 'Luton', position: 18 },
            { team: 'Burnley', position: 19 },
            { team: 'Sheffield United', position: 20 }
        ];
        
        console.log('Team Examples - Formula Comparison:\\n');
        console.log('Team'.padEnd(18) + 'Pos'.padEnd(5) + 'Old "Relegation"'.padEnd(18) + 'New Relegation'.padEnd(18) + 'Title Race');
        console.log('-'.repeat(70));
        
        examples.forEach(example => {
            const oldFormula = Math.max(0, 18 - example.position);  // Old "relegation" (actually title race)
            const newRelegation = Math.max(0, example.position - 17); // Fixed relegation
            const titleRace = Math.max(0, 18 - example.position);     // Properly named title race
            
            console.log(
                example.team.padEnd(18) + 
                example.position.toString().padEnd(5) + 
                oldFormula.toString().padEnd(18) + 
                newRelegation.toString().padEnd(18) + 
                titleRace.toString()
            );
        });
        
        console.log('\\n✅ FORMULA VERIFICATION:');
        console.log('- Title Race Pressure: HIGH for Man City (17), Arsenal (16), Liverpool (15)');
        console.log('- Relegation Pressure: HIGH for Luton (1), Burnley (2), Sheffield Utd (3)');
        console.log('- Mid-table teams: LOW pressure in both formulas\\n');
    }

    printResults(strategyName, records) {
        const summary = this.calculateSummary(records);
        
        console.log(`📋 ${strategyName} RESULTS:`);
        console.log(`  📊 Total bets: ${summary.totalBets}`);
        console.log(`  ✅ Wins: ${summary.wins} (${summary.winRate}%)`);
        console.log(`  ❌ Losses: ${summary.losses}`);
        console.log(`  🤝 Pushes: ${summary.pushes}`);
        console.log(`  💰 Total profit: $${summary.totalProfit.toFixed(2)}`);
        console.log(`  📈 ROI: ${summary.profitability}%`);
        
        if (records.length > 0) {
            console.log(`  🎯 Sample matches:`);
            records.slice(0, 3).forEach(record => {
                console.log(`    ${record.homeTeam}(${record.homePos}) vs ${record.awayTeam}(${record.awayPos}) - ${record.result}`);
            });
        }
        console.log();
    }

    calculateSummary(records) {
        const totalBets = records.length;
        const wins = records.filter(r => r.result === 'WIN').length;
        const losses = records.filter(r => r.result === 'LOSE').length;
        const pushes = records.filter(r => r.result === 'PUSH').length;
        const totalProfit = records.reduce((sum, r) => sum + r.profit, 0);
        const winRate = totalBets > 0 ? (wins / totalBets * 100).toFixed(2) : '0.00';
        const profitability = totalBets > 0 ? (totalProfit / (totalBets * 100) * 100).toFixed(2) : '0.00';
        
        return {
            totalBets,
            wins,
            losses,
            pushes,
            totalProfit,
            winRate,
            profitability
        };
    }

    saveResults(fileName, records) {
        const csvHeaders = [
            'Date', 'Home Team', 'Away Team', 'Home Pos', 'Away Pos', 'Pressure Factor',
            'Home Score', 'Away Score', 'Bet Side', 'Odds', 'Result', 'Profit', 'Running Profit'
        ];
        
        const csvRows = records.map(record => [
            record.date,
            record.homeTeam,
            record.awayTeam,
            record.homePos,
            record.awayPos,
            record.titleRacePressure || record.relegationPressure,
            record.homeScore,
            record.awayScore,
            record.betSide,
            record.odds,
            record.result,
            record.profit.toFixed(2),
            record.runningProfit.toFixed(2)
        ]);
        
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\\n');
        const csvFilePath = path.join(this.outputDir, `${fileName}.csv`);
        fs.writeFileSync(csvFilePath, csvContent);
        
        console.log(`💾 Records saved to: ${fileName}.csv`);
    }

    runAllTests() {
        console.log('🚀 TESTING FIXED STRATEGIES\\n');
        
        this.demonstrateFormulaFix();
        
        const titleRaceResults = this.testTitleRacePressureStrategy();
        const relegationResults = this.testFixedRelegationPressureStrategy();
        
        console.log('✅ STRATEGY COMPARISON SUMMARY:\\n');
        console.log('1. Title Race Pressure (old "relegation"):');
        console.log(`   - ${titleRaceResults.totalBets} bets, ${titleRaceResults.profitability}% ROI`);
        console.log(`   - Bets on top teams in big matches`);
        
        console.log('\\n2. Fixed Relegation Pressure (new):');
        console.log(`   - ${relegationResults.totalBets} bets, ${relegationResults.profitability}% ROI`);
        console.log(`   - Bets on less-threatened team in relegation battles`);
        
        console.log('\\n📁 Check betting_records/ for detailed CSV files');
    }
}

// Run the tests
const tester = new FixedStrategyTester();
tester.runAllTests();