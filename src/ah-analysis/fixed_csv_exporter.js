const fs = require('fs');
const path = require('path');

/**
 * Fixed CSV Exporter - Properly saves to src/ah-analysis/betting-records/
 */
class FixedCSVExporter {
    constructor() {
        this.outputDir = path.join(__dirname, 'betting-records');
        this.clearAndCreateOutputDirectory();
    }

    clearAndCreateOutputDirectory() {
        // Remove existing directory if it exists
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true, force: true });
            console.log('🗑️  Removed existing betting-records directory');
        }
        
        // Create fresh directory
        fs.mkdirSync(this.outputDir, { recursive: true });
        console.log(`✅ Created fresh directory: ${this.outputDir}`);
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
     * Test Proper Relegation Strategy with FIXED CSV export
     */
    testRelegationStrategyWithFixedCSV() {
        console.log('🔍 TESTING RELEGATION STRATEGY WITH FIXED CSV EXPORT\\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        
        allMatches.forEach((match, matchIndex) => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            
            // Only consider late season matches (week 25+)
            if (!week || week < 25 || !homePos || !awayPos) return;
            
            // Calculate relegation pressure (positions 18+)
            const homeRelegationPressure = Math.max(0, homePos - 17);
            const awayRelegationPressure = Math.max(0, awayPos - 17);
            const totalRelegationPressure = homeRelegationPressure + awayRelegationPressure;
            
            // Only bet when there's actual relegation pressure
            if (totalRelegationPressure > 0) {
                
                // Strategy: Bet on team with LESS relegation pressure
                let betSide, odds;
                if (homeRelegationPressure < awayRelegationPressure) {
                    betSide = 'HOME';
                    odds = match.match?.asianHandicapOdds?.homeOdds || 1.9;
                } else if (awayRelegationPressure < homeRelegationPressure) {
                    betSide = 'AWAY';
                    odds = match.match?.asianHandicapOdds?.awayOdds || 1.9;
                } else {
                    return; // Equal pressure - skip
                }
                
                const betAmount = 100;
                const homeScore = match.match?.homeScore ?? 0;
                const awayScore = match.match?.awayScore ?? 0;
                
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
                
                const matchId = `${match.match?.date || new Date().toISOString()}_${match.match?.homeTeam || 'Unknown'}_${match.match?.awayTeam || 'Unknown'}`;
                
                bettingRecords.push({
                    matchIndex: matchIndex + 1,
                    matchId: matchId.replace(/[^a-zA-Z0-9_-]/g, '_'), // Clean ID
                    date: match.match?.date || 'Unknown',
                    season: this.getSeason(match.match?.date || ''),
                    week,
                    homeTeam: match.match?.homeTeam || 'Unknown',
                    awayTeam: match.match?.awayTeam || 'Unknown',
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
                    odds: Number(odds).toFixed(2),
                    impliedProbability: (1/odds*100).toFixed(1),
                    betAmount,
                    result,
                    profit: Number(profit).toFixed(2),
                    runningProfit: 0
                });
            }
        });
        
        console.log(`📊 Found ${bettingRecords.length} qualifying bets\\n`);
        
        if (bettingRecords.length === 0) {
            console.log('❌ No betting records found - check data format');
            return null;
        }
        
        // Sort by date
        bettingRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate running profit
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += parseFloat(record.profit);
            record.runningProfit = runningTotal.toFixed(2);
        });
        
        // Save CSV with proper encoding
        this.saveCSVFile('relegation_strategy_week25plus', bettingRecords);
        
        // Print summary
        this.printSummary(bettingRecords);
        
        return bettingRecords;
    }

    getSeason(dateString) {
        if (!dateString) return 'Unknown';
        
        if (dateString.includes('2022')) return '2022-2023';
        if (dateString.includes('2023')) return '2023-2024';
        if (dateString.includes('2024') || dateString.includes('2025')) return '2024-2025';
        return 'Unknown';
    }

    saveCSVFile(fileName, records) {
        console.log(`💾 Saving CSV file: ${fileName}.csv`);
        
        // Create CSV headers
        const headers = [
            'Match_Index',
            'Match_ID', 
            'Date',
            'Season',
            'Week',
            'Home_Team',
            'Away_Team',
            'Home_Position',
            'Away_Position',
            'Home_Relegation_Pressure',
            'Away_Relegation_Pressure',
            'Total_Relegation_Pressure',
            'Home_Score',
            'Away_Score',
            'Actual_Result',
            'Bet_Side',
            'Odds',
            'Implied_Probability_Percent',
            'Bet_Amount',
            'Bet_Result',
            'Profit_USD',
            'Running_Profit_USD'
        ];
        
        // Create CSV rows
        const csvRows = [];
        csvRows.push(headers.join(','));
        
        records.forEach(record => {
            const row = [
                record.matchIndex,
                record.matchId,
                record.date,
                record.season,
                record.week,
                `"${record.homeTeam}"`, // Quote to handle commas in team names
                `"${record.awayTeam}"`,
                record.homePos,
                record.awayPos,
                record.homeRelegationPressure,
                record.awayRelegationPressure,
                record.totalRelegationPressure,
                record.homeScore,
                record.awayScore,
                record.actualResult,
                record.betSide,
                record.odds,
                record.impliedProbability,
                record.betAmount,
                record.result,
                record.profit,
                record.runningProfit
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\\n');
        const filePath = path.join(this.outputDir, `${fileName}.csv`);
        
        try {
            // Write with explicit encoding
            fs.writeFileSync(filePath, csvContent, { encoding: 'utf8' });
            
            // Verify file was written
            const stats = fs.statSync(filePath);
            console.log(`✅ CSV file saved successfully:`);
            console.log(`   Path: ${filePath}`);
            console.log(`   Size: ${stats.size} bytes`);
            console.log(`   Rows: ${csvRows.length} (including header)`);
            
            // Read back first few lines to verify
            const verification = fs.readFileSync(filePath, 'utf8');
            const lines = verification.split('\\n');
            console.log(`\\n📋 CSV Preview (first 3 lines):`);
            lines.slice(0, 3).forEach((line, index) => {
                console.log(`   ${index + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
            });
            
        } catch (error) {
            console.log(`❌ Error saving CSV file: ${error.message}`);
            console.log(`   Attempted path: ${filePath}`);
            console.log(`   Content length: ${csvContent.length} characters`);
        }
    }

    printSummary(records) {
        const totalBets = records.length;
        const wins = records.filter(r => r.result === 'WIN').length;
        const losses = records.filter(r => r.result === 'LOSE').length;
        const pushes = records.filter(r => r.result === 'PUSH').length;
        const totalProfit = records.reduce((sum, r) => sum + parseFloat(r.profit), 0);
        const winRate = (wins / totalBets * 100).toFixed(2);
        const profitability = (totalProfit / (totalBets * 100) * 100).toFixed(2);
        
        console.log(`\\n📊 STRATEGY SUMMARY:`);
        console.log(`   Total bets: ${totalBets}`);
        console.log(`   Wins: ${wins} (${winRate}%)`);
        console.log(`   Losses: ${losses} (${(losses/totalBets*100).toFixed(2)}%)`);
        console.log(`   Pushes: ${pushes} (${(pushes/totalBets*100).toFixed(2)}%)`);
        console.log(`   Total profit: $${totalProfit.toFixed(2)}`);
        console.log(`   ROI: ${profitability}%`);
        
        console.log(`\\n🎯 Sample Winning Bets:`);
        const winningBets = records.filter(r => r.result === 'WIN').slice(0, 5);
        winningBets.forEach((bet, index) => {
            console.log(`   ${index + 1}. Week ${bet.week}: ${bet.homeTeam}(${bet.homePos}) vs ${bet.awayTeam}(${bet.awayPos})`);
            console.log(`      Score: ${bet.homeScore}-${bet.awayScore}, Bet: ${bet.betSide} @${bet.odds}, Profit: $${bet.profit}`);
        });
    }

    runStrategy() {
        console.log('🚀 RUNNING RELEGATION STRATEGY WITH FIXED CSV EXPORT\\n');
        console.log(`📁 Output directory: ${this.outputDir}\\n`);
        
        const results = this.testRelegationStrategyWithFixedCSV();
        
        if (results) {
            console.log(`\\n✅ Strategy completed successfully`);
            console.log(`📁 Check ${this.outputDir} for CSV file`);
        } else {
            console.log(`\\n❌ Strategy failed - no results generated`);
        }
        
        return results;
    }
}

// Run the strategy
const exporter = new FixedCSVExporter();
exporter.runStrategy();