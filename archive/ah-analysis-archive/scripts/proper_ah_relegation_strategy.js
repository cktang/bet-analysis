const fs = require('fs');
const path = require('path');

/**
 * Proper Asian Handicap Relegation Strategy
 * Uses actual AH lines and betting outcomes from match data
 */
class ProperAHRelegationStrategy {
    constructor() {
        this.outputDir = path.join(__dirname, 'betting-records');
        this.clearAndCreateOutputDirectory();
    }

    clearAndCreateOutputDirectory() {
        if (fs.existsSync(this.outputDir)) {
            fs.rmSync(this.outputDir, { recursive: true, force: true });
            console.log('🗑️  Removed existing betting-records directory');
        }
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
        
        console.log(`🎯 Total matches loaded: ${allMatches.length}\n`);
        return allMatches;
    }

    /**
     * Proper AH Relegation Strategy
     * Strategy: In week 25+, bet AGAINST teams with high relegation pressure using AH markets
     */
    runProperAHRelegationStrategy() {
        console.log('🔍 PROPER ASIAN HANDICAP RELEGATION STRATEGY\n');
        
        const allMatches = this.loadMatchData();
        const bettingRecords = [];
        let matchesWithAH = 0;
        let matchesWithoutAH = 0;
        
        allMatches.forEach((match, matchIndex) => {
            const week = match.fbref?.week;
            const homePos = match.timeSeries?.home?.leaguePosition;
            const awayPos = match.timeSeries?.away?.leaguePosition;
            const ahOdds = match.match?.asianHandicapOdds;
            const ahOutcomes = match.enhanced?.postMatch?.bettingOutcomes;
            
            // Only consider late season matches (week 25+) with AH data
            if (!week || week < 25 || !homePos || !awayPos || !ahOdds || !ahOutcomes) {
                if (week >= 25 && homePos && awayPos) {
                    matchesWithoutAH++;
                }
                return;
            }
            
            matchesWithAH++;
            
            // Calculate relegation pressure (positions 18-20)
            const homeRelegationPressure = Math.max(0, homePos - 17);
            const awayRelegationPressure = Math.max(0, awayPos - 17);
            const totalRelegationPressure = homeRelegationPressure + awayRelegationPressure;
            
            // Only bet when there's actual relegation pressure
            if (totalRelegationPressure > 0) {
                
                // Strategy: Bet on team with LESS relegation pressure (bet against relegation teams)
                let betSide, odds, handicap, ahResult, profit;
                
                if (homeRelegationPressure < awayRelegationPressure) {
                    // Home team has less pressure - bet HOME
                    betSide = 'HOME';
                    odds = ahOdds.homeOdds;
                    handicap = ahOdds.homeHandicap;
                    ahResult = ahOutcomes.homeResult; // win/loss/push
                    profit = ahOutcomes.homeProfit;   // Already calculated AH profit
                } else if (awayRelegationPressure < homeRelegationPressure) {
                    // Away team has less pressure - bet AWAY
                    betSide = 'AWAY';
                    odds = ahOdds.awayOdds;
                    handicap = ahOdds.awayHandicap;
                    ahResult = ahOutcomes.awayResult; // win/loss/push
                    profit = ahOutcomes.awayProfit;   // Already calculated AH profit
                } else {
                    return; // Equal pressure - skip
                }
                
                const betAmount = 100;
                const homeScore = match.match?.homeScore ?? 0;
                const awayScore = match.match?.awayScore ?? 0;
                
                // Map result to standard format
                let betResult;
                if (ahResult === 'win') betResult = 'WIN';
                else if (ahResult === 'loss') betResult = 'LOSE';
                else betResult = 'PUSH';
                
                const matchId = `${match.match?.date || new Date().toISOString()}_${match.match?.homeTeam || 'Unknown'}_${match.match?.awayTeam || 'Unknown'}`;
                
                bettingRecords.push({
                    matchIndex: matchIndex + 1,
                    matchId: matchId.replace(/[^a-zA-Z0-9_-]/g, '_'),
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
                    handicap: handicap || 'N/A',
                    odds: Number(odds || 1.9).toFixed(2),
                    impliedProbability: (1/(odds || 1.9)*100).toFixed(1),
                    betAmount,
                    ahResult: betResult,
                    profit: Number(profit || 0).toFixed(2),
                    runningProfit: 0
                });
            }
        });
        
        console.log(`📊 Match Analysis:`)
        console.log(`   Matches week 25+ with AH data: ${matchesWithAH}`)
        console.log(`   Matches week 25+ without AH data: ${matchesWithoutAH}`)
        console.log(`   Qualifying bets found: ${bettingRecords.length}\n`);
        
        if (bettingRecords.length === 0) {
            console.log('❌ No betting records found - check AH data availability');
            return null;
        }
        
        // Sort by date and calculate running profit
        bettingRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let runningTotal = 0;
        bettingRecords.forEach(record => {
            runningTotal += parseFloat(record.profit);
            record.runningProfit = runningTotal.toFixed(2);
        });
        
        // Save CSV
        this.saveProperCSV('proper_ah_relegation_strategy', bettingRecords);
        
        // Print summary
        this.printAHSummary(bettingRecords);
        
        return bettingRecords;
    }

    getSeason(dateString) {
        if (!dateString) return 'Unknown';
        
        if (dateString.includes('2022')) return '2022-2023';
        if (dateString.includes('2023')) return '2023-2024'; 
        if (dateString.includes('2024') || dateString.includes('2025')) return '2024-2025';
        return 'Unknown';
    }

    saveProperCSV(fileName, records) {
        console.log(`💾 Saving Proper AH CSV: ${fileName}.csv`);
        
        const headers = [
            'Match_Index', 'Match_ID', 'Date', 'Season', 'Week',
            'Home_Team', 'Away_Team', 'Home_Position', 'Away_Position',
            'Home_Relegation_Pressure', 'Away_Relegation_Pressure', 'Total_Relegation_Pressure',
            'Home_Score', 'Away_Score', 'Actual_Result',
            'Bet_Side', 'AH_Handicap', 'AH_Odds', 'Implied_Probability_Percent',
            'Bet_Amount', 'AH_Result', 'AH_Profit_USD', 'Running_Profit_USD'
        ];
        
        const csvRows = [headers.join(',')];
        
        records.forEach(record => {
            const row = [
                record.matchIndex, record.matchId, record.date, record.season, record.week,
                `"${record.homeTeam}"`, `"${record.awayTeam}"`, 
                record.homePos, record.awayPos,
                record.homeRelegationPressure, record.awayRelegationPressure, record.totalRelegationPressure,
                record.homeScore, record.awayScore, record.actualResult,
                record.betSide, record.handicap, record.odds, record.impliedProbability,
                record.betAmount, record.ahResult, record.profit, record.runningProfit
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const filePath = path.join(this.outputDir, `${fileName}.csv`);
        
        try {
            fs.writeFileSync(filePath, csvContent, 'utf8');
            const stats = fs.statSync(filePath);
            console.log(`✅ Proper AH CSV saved: ${filePath}`);
            console.log(`📏 Size: ${stats.size} bytes, Lines: ${csvRows.length}`);
        } catch (error) {
            console.error(`❌ Error saving CSV: ${error.message}`);
        }
    }

    printAHSummary(records) {
        const totalBets = records.length;
        const wins = records.filter(r => r.ahResult === 'WIN').length;
        const losses = records.filter(r => r.ahResult === 'LOSE').length;
        const pushes = records.filter(r => r.ahResult === 'PUSH').length;
        const totalProfit = records.reduce((sum, r) => sum + parseFloat(r.profit), 0);
        const winRate = (wins / totalBets * 100).toFixed(2);
        const roi = (totalProfit / (totalBets * 100) * 100).toFixed(2);
        
        console.log(`\n📊 PROPER ASIAN HANDICAP RELEGATION STRATEGY RESULTS:`);
        console.log(`   Total AH bets: ${totalBets}`);
        console.log(`   Wins: ${wins} (${winRate}%)`);
        console.log(`   Losses: ${losses} (${(losses/totalBets*100).toFixed(2)}%)`);
        console.log(`   Pushes: ${pushes} (${(pushes/totalBets*100).toFixed(2)}%)`);
        console.log(`   Total profit: $${totalProfit.toFixed(2)}`);
        console.log(`   ROI: ${roi}%`);
        
        // Show handicap distribution
        const handicapTypes = {};
        records.forEach(r => {
            handicapTypes[r.handicap] = (handicapTypes[r.handicap] || 0) + 1;
        });
        
        console.log(`\n🎯 Asian Handicap Lines Used:`);
        Object.entries(handicapTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([handicap, count]) => {
                console.log(`   ${handicap}: ${count} bets`);
            });
        
        console.log(`\n📈 Sample Profitable AH Bets:`);
        const profitableBets = records.filter(r => parseFloat(r.profit) > 0).slice(0, 3);
        profitableBets.forEach((bet, index) => {
            console.log(`   ${index + 1}. ${bet.homeTeam}(${bet.homePos}) vs ${bet.awayTeam}(${bet.awayPos})`);
            console.log(`      Score: ${bet.homeScore}-${bet.awayScore}, Bet: ${bet.betSide} ${bet.handicap} @${bet.odds}`);
            console.log(`      Result: ${bet.ahResult}, Profit: $${bet.profit}`);
        });
    }

    run() {
        console.log('🚀 RUNNING PROPER ASIAN HANDICAP RELEGATION STRATEGY\n');
        const results = this.runProperAHRelegationStrategy();
        
        if (results) {
            console.log(`\n✅ Strategy completed successfully`);
            console.log(`📁 Check ${this.outputDir} for proper AH CSV file`);
        } else {
            console.log(`\n❌ Strategy failed - no AH data found`);
        }
        
        return results;
    }
}

// Run the proper AH strategy
const strategy = new ProperAHRelegationStrategy();
strategy.run();